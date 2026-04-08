import { useState } from 'react';
import { writeContract, waitForTransactionReceipt, switchChain } from '@wagmi/core';
import { wagmiConfig } from '@/config/wagmi';
import { CONTRACTS_ADDRESS } from '@/constants/contracts';
import { LITEFORGE_SWAP_ABI } from '@/constants/abis';
import { ChainId } from '@/types/chains';
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

      // Switch to Liteforge first, then send the tx on that chain
      await switchChain(wagmiConfig, { chainId: ChainId.LiteforgeTestnet });

      const hash = await writeContract(wagmiConfig, {
        address: contractAddress,
        abi: [...LITEFORGE_SWAP_ABI],
        functionName: 'swap',
        args: [ltcAddressBytes32],
        value: amount,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      await waitForTransactionReceipt(wagmiConfig, { hash, confirmations: 1 });

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
