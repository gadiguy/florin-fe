import { createConfig, http, injected, createStorage } from '@wagmi/core';
import { metaMask, walletConnect } from '@wagmi/connectors';
import { supportedChains } from './evm-chains';
import { ChainId } from '@/types/chains';
import { env } from './env';

const walletConnector = walletConnect({
  projectId: env.VITE_WALLETCONNECT_PROJECT_ID,
  qrModalOptions: {
    themeMode: 'dark',
  },
});

export const wagmiConfig = createConfig({
  chains: supportedChains,
  connectors: [metaMask(), walletConnector, injected()],
  ssr: true,
  storage: createStorage({ storage: window.localStorage }),
  transports: Object.fromEntries(
    supportedChains.map((chain) => [chain.id, http(chain.rpcUrls.default.http[0])])
  ) as Record<ChainId, ReturnType<typeof http>>,
});
