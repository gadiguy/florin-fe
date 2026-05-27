import { useRef } from 'react';
import { useAccount, useSignTypedData, usePublicClient } from 'wagmi';
import { CONTRACTS_ADDRESS } from '@/constants/contracts';
import { AMMEXCHANGE_ABI, FORWARDER_ABI } from '@/constants/abis';
import { encodeFunctionData } from 'viem';
import type { Address } from 'viem';

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

export function useRelayedReservePosition() {
  const isSubmittingRef = useRef(false);
  const { address: userAddress } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  // usePublicClient with chainId narrows the returned client type; cast through
  // unknown so downstream usage (readContract) is unconstrained by config generics.
  const publicClient = usePublicClient() as ReturnType<typeof usePublicClient> | undefined;

  const relay = async ({ evmReceivingAddress, tokenAmount, chainId }: RelayParams): Promise<RelayResult> => {
    if (isSubmittingRef.current) {
      throw new Error('A relay request is already in progress');
    }

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

    isSubmittingRef.current = true;
    try {
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
        gas: 300000n,
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

      // 6. POST to relayer — all bigints serialized as decimal strings
      const body = {
        from: message.from,
        to: message.to,
        value: message.value.toString(),
        gas: message.gas.toString(),
        nonce: message.nonce.toString(),
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

    } finally {
      isSubmittingRef.current = false;
    }
  };

  return { relay };
}
