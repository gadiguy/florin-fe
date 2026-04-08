import { useCallback, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { ChainId } from '@/types/chains';
import { ContractManager } from '@/services/ContractManager';
import { liteforgeTestnet, sepolia } from '@/config/evm-chains';

function getRequiredChainId(isLiteforgeMode: boolean): number {
  return isLiteforgeMode ? ChainId.LiteforgeTestnet : ChainId.Sepolia;
}

export function useChainForDirection(isLiteforgeMode: boolean) {
  const { isConnected } = useAccount();
  const [currentChainId, setCurrentChainId] = useState<number | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);

  // Track chain ID from the provider directly (not wagmi state)
  useEffect(() => {
    const getChainId = async () => {
      const provider = window.ethereum?.providers?.find(
        (p: { isMetaMask?: boolean }) => p.isMetaMask
      ) || window.ethereum;
      if (provider && isConnected) {
        const id = await provider.request({ method: 'eth_chainId' });
        setCurrentChainId(parseInt(id as string, 16));
      }
    };
    if (isConnected) {
      getChainId();
    } else {
      setCurrentChainId(null);
    }

    const handleChainChanged = (id: string) => {
      setCurrentChainId(parseInt(id, 16));
    };
    window.ethereum?.on('chainChanged', handleChainChanged);
    return () => {
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [isConnected]);

  const requiredChainId = getRequiredChainId(isLiteforgeMode);
  const isCorrectChain = !isConnected || currentChainId === requiredChainId;

  const switchToCorrectChain = useCallback(
    async (targetIsLiteforge: boolean) => {
      const targetChainId = getRequiredChainId(targetIsLiteforge);
      if (!isConnected || currentChainId === targetChainId) return;

      const provider = window.ethereum?.providers?.find(
        (p: { isMetaMask?: boolean }) => p.isMetaMask
      ) || window.ethereum;
      if (!provider) return;

      setIsSwitching(true);
      try {
        const hexChainId = `0x${targetChainId.toString(16)}`;
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: hexChainId }],
        });
      } catch (err: unknown) {
        // Error 4902: chain not added to wallet yet — add it
        if ((err as { code?: number }).code === 4902) {
          const chain = targetIsLiteforge ? liteforgeTestnet : sepolia;
          try {
            const hexChainId = `0x${targetChainId.toString(16)}`;
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: hexChainId,
                chainName: chain.name,
                rpcUrls: [chain.rpcUrls.default.http[0]],
                nativeCurrency: chain.nativeCurrency,
                blockExplorerUrls: [chain.blockExplorers?.default.url],
              }],
            });
            // After adding, switch to it
            await provider.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: hexChainId }],
            });
          } catch (addErr) {
            console.error('Failed to add chain:', addErr);
          }
        } else {
          console.error('Chain switch failed:', err);
        }
      } finally {
        setIsSwitching(false);
        if (!targetIsLiteforge) {
          await ContractManager.reinitializeIfExists();
        }
      }
    },
    [isConnected, currentChainId]
  );

  return { isCorrectChain, isSwitching, requiredChainId, switchToCorrectChain };
}
