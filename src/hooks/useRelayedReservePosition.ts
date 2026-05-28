import { useAccount, useSignTypedData, usePublicClient } from 'wagmi';
import { CONTRACTS_ADDRESS } from '@/constants/contracts';
import { AMMEXCHANGE_ABI, FORWARDER_ABI } from '@/constants/abis';
import { encodeFunctionData } from 'viem';
import type { Address } from 'viem';

const ERC20_PREFLIGHT_ABI = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }] },
  { name: 'allowance', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }] },
] as const;

// EIP-712 types for FlorinForwarder (VERIFIED on Sepolia 2026-05-27)
const FORWARD_REQUEST_TYPES = {
  ForwardRequest: [
    { name: 'from',     type: 'address' },
    { name: 'to',       type: 'address' },
    { name: 'value',    type: 'uint256' },
    { name: 'gas',      type: 'uint256' },
    { name: 'nonce',    type: 'uint256' },
    { name: 'deadline', type: 'uint48'  },
    { name: 'data',     type: 'bytes'   },
  ] as const,
} as const;

interface RelayParams {
  evmReceivingAddress: Address;
  tokenAmount: bigint;
  chainId: number;
}

interface RelayResult {
  txHash: string;
}

// Module-scope single-flight: at most one in-flight relay per `from` address.
// Second submit from the same address returns the in-flight Promise rather than
// starting a duplicate transaction — handles both same-tab double-clicks and
// cross-component concurrent calls.
const inflightByFrom = new Map<string, Promise<RelayResult>>();

export function useRelayedReservePosition() {
  const { address: userAddress } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  // usePublicClient with chainId narrows the returned client type; cast through
  // unknown so downstream usage (readContract) is unconstrained by config generics.
  const publicClient = usePublicClient() as ReturnType<typeof usePublicClient> | undefined;

  const relay = async ({ evmReceivingAddress, tokenAmount, chainId }: RelayParams): Promise<RelayResult> => {
    const relayerUrl = import.meta.env.VITE_RELAYER_URL as string | undefined;
    if (!relayerUrl) {
      throw new Error('VITE_RELAYER_URL is not configured');
    }

    if (!userAddress) {
      throw new Error('Wallet not connected');
    }

    const contracts = CONTRACTS_ADDRESS[chainId as keyof typeof CONTRACTS_ADDRESS];
    if (!contracts) {
      throw new Error(`Chain ${chainId} not supported`);
    }

    if (!publicClient) {
      throw new Error('Public client not available');
    }

    // Return the existing in-flight Promise for this address rather than starting
    // a duplicate — prevents double-submit on rapid clicks or concurrent callers.
    const existing = inflightByFrom.get(userAddress);
    if (existing) {
      return existing;
    }

    const promise = (async (): Promise<RelayResult> => {
      // 1. Read nonce from FlorinForwarder
      const forwarderAddress = contracts.florinForwarder as Address;
      if (!forwarderAddress) {
        throw new Error(`FlorinForwarder address not configured for chain ${chainId}`);
      }

      const nonce = (await publicClient.readContract({
        address: forwarderAddress,
        abi: FORWARDER_ABI,
        functionName: 'nonces',
        args: [userAddress],
      })) as bigint;

      // 1b. Pre-flight: zkLTC balance + AMM allowance before expensive signing.
      // Mirrors the direct-path guard; fails fast without burning relayer quota.
      const erc20Address = (contracts as { erc20BitSnark: Address }).erc20BitSnark;
      const ammAddress = (contracts as { ammExchange: Address }).ammExchange as Address;
      const [balance, allowance] = (await Promise.all([
        publicClient.readContract({
          address: erc20Address,
          abi: ERC20_PREFLIGHT_ABI,
          functionName: 'balanceOf',
          args: [userAddress],
        }),
        publicClient.readContract({
          address: erc20Address,
          abi: ERC20_PREFLIGHT_ABI,
          functionName: 'allowance',
          args: [userAddress, ammAddress],
        }),
      ])) as [bigint, bigint];

      if (balance < tokenAmount) {
        throw new Error(`Insufficient token balance: have ${balance}, need ${tokenAmount}`);
      }
      if (allowance < tokenAmount) {
        throw new Error(`Insufficient allowance for AMM: have ${allowance}, need ${tokenAmount}`);
      }

      // 2. Encode reservePosition calldata
      const callData = encodeFunctionData({
        abi: AMMEXCHANGE_ABI,
        functionName: 'reservePosition',
        args: [
          (contracts as { defaultPositionId: `0x${string}` }).defaultPositionId,
          evmReceivingAddress,
          tokenAmount,
        ],
      });

      // 2b. Dynamic gas estimation via simulateContract (20% pad matches backend inner*1.1 check).
      let gasEstimate = 300_000n; // safe fallback
      try {
        const sim = await publicClient.simulateContract({
          address: ammAddress,
          abi: AMMEXCHANGE_ABI,
          functionName: 'reservePosition',
          args: [
            (contracts as { defaultPositionId: `0x${string}` }).defaultPositionId,
            evmReceivingAddress,
            tokenAmount,
          ],
          account: userAddress,
        });
        if (sim.request.gas) {
          gasEstimate = (sim.request.gas * 120n) / 100n;
        }
      } catch {
        // Simulation can fail if allowance wasn't approved or token reverts.
        // Use fallback; backend will reject with 400 if gas is too low.
      }

      // 3. Build EIP-712 domain
      const domain = {
        name: 'FlorinForwarder' as const,
        version: '1' as const,
        chainId,
        verifyingContract: forwarderAddress,
      };

      // 4. Deadline = 5 minutes from now (generous for clock skew).
      // uint48 maps to number in TypeScript (abitype: bits <= 48 → intType = number).
      const deadline: number = Math.floor(Date.now() / 1000) + 300;

      // 5. Sign via Wagmi signTypedDataAsync
      const message = {
        from: userAddress,
        to: (contracts as { ammExchange: string }).ammExchange as Address,
        value: 0n,
        gas: gasEstimate,
        nonce,
        deadline,
        data: callData as `0x${string}`,
      };

      const signature = await signTypedDataAsync({
        domain,
        types: FORWARD_REQUEST_TYPES,
        primaryType: 'ForwardRequest',
        message,
      });

      // 6. POST to relayer — all bigints serialized as decimal strings.
      // nonce is signed-over but NOT sent in the body: the FlorinForwarder
      // (OZ ERC2771Forwarder v5) ForwardRequestData struct has 7 fields, and
      // the relayer schema rejects additional properties. The forwarder reads
      // nonces[from] from storage at execute time.
      const body = {
        from: message.from,
        to: message.to,
        value: message.value.toString(),
        gas: message.gas.toString(),
        deadline: message.deadline.toString(),
        data: message.data,
        signature,
      };

      const response = await fetch(`${relayerUrl}/relay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Relay failed' })) as { error?: string };
        // IMPORTANT: NO fallback to direct call — propagate error as-is
        throw new Error(errorData.error ?? `Relay failed (HTTP ${response.status})`);
      }

      const result = await response.json() as { txHash: string };
      return { txHash: result.txHash };
    })().finally(() => inflightByFrom.delete(userAddress));

    inflightByFrom.set(userAddress, promise);
    return promise;
  };

  return { relay };
}
