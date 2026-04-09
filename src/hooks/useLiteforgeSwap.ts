import { useState } from 'react';
import { getConnectorClient } from '@wagmi/core';
import { createWalletClient, createPublicClient, custom, http } from 'viem';
import { wagmiConfig } from '@/config/wagmi';
import { CONTRACTS_ADDRESS } from '@/constants/contracts';
import { LITEFORGE_SWAP_ABI } from '@/constants/abis';
import { ChainId } from '@/types/chains';
import { liteforgeTestnet } from '@/config/evm-chains';
import { bech32ToBytes32 } from '@/lib/utils';

function parseContractError(error: unknown): string {
  const message = (error as Error)?.message ?? '';
  if (message.includes('User rejected') || message.includes('user rejected')) {
    return 'Transaction cancelled.';
  }
  if (message.includes('insufficient funds') || message.includes('exceeds the balance')) {
    return 'Insufficient funds to cover the swap and gas fees.';
  }
  return message;
}

export const useLiteforgeSwap = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const swap = async ({
    ltcAddress,
    amount,
  }: {
    ltcAddress: string;
    amount: bigint;
  }): Promise<{ txHash: string } | undefined> => {
    try {
      setLoading(true);
      setError(null);

      const contracts = CONTRACTS_ADDRESS[ChainId.LiteforgeTestnet as keyof typeof CONTRACTS_ADDRESS];
      const contractAddress = (contracts as { liteforgeSwap: string }).liteforgeSwap as `0x${string}`;
      const ltcAddressBytes32 = bech32ToBytes32(ltcAddress);

      // Wallet should already be on LiteForge (switched by direction selector)
      const connectorClient = await getConnectorClient(wagmiConfig);
      const walletClient = createWalletClient({
        account: connectorClient.account,
        chain: liteforgeTestnet,
        transport: custom(connectorClient.transport),
      });
      const publicClient = createPublicClient({
        chain: liteforgeTestnet,
        transport: http(liteforgeTestnet.rpcUrls.default.http[0]),
      });

      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi: LITEFORGE_SWAP_ABI,
        functionName: 'swap',
        args: [ltcAddressBytes32],
        value: amount,
        account: walletClient.account,
      });

      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });

      setLoading(false);
      return { txHash: hash };
    } catch (err) {
      setLoading(false);
      setError(parseContractError(err));
      console.error('LiteforgeSwap error:', err);
    }
  };

  return { swap, loading, error, setError };
};
