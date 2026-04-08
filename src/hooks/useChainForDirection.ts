import { useCallback, useState } from 'react';
import { useSwitchChain, useChainId, useAccount } from 'wagmi';
import { ChainId } from '@/types/chains';
import { ContractManager } from '@/services/ContractManager';

function getRequiredChainId(isLiteforgeMode: boolean): number {
  return isLiteforgeMode ? ChainId.LiteforgeTestnet : ChainId.Sepolia;
}

export function useChainForDirection(isLiteforgeMode: boolean) {
  const chainId = useChainId();
  const { isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const [isSwitching, setIsSwitching] = useState(false);

  const requiredChainId = getRequiredChainId(isLiteforgeMode);
  const isCorrectChain = !isConnected || chainId === requiredChainId;

  const switchToCorrectChain = useCallback(
    async (targetIsLiteforge: boolean) => {
      const targetChainId = getRequiredChainId(targetIsLiteforge);
      if (!isConnected || chainId === targetChainId) return;

      setIsSwitching(true);
      try {
        await switchChainAsync({ chainId: targetChainId });
        if (targetChainId === ChainId.Sepolia) {
          await ContractManager.reinitializeIfExists();
        }
      } catch (err) {
        console.error('Chain switch failed:', err);
      } finally {
        setIsSwitching(false);
      }
    },
    [isConnected, chainId, switchChainAsync]
  );

  return { isCorrectChain, isSwitching, requiredChainId, switchToCorrectChain };
}
