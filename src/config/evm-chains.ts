import { ChainId } from '@/types/chains';
import { defineChain } from 'viem';
import { env } from './env';

const createChain = (
  id: ChainId,
  name: string,
  nativeSymbol: string,
  rpcUrl: string,
  explorerUrl: string,
  explorerApiUrl: string
) =>
  defineChain({
    id,
    name,
    nativeCurrency: {
      name: nativeSymbol,
      symbol: nativeSymbol,
      decimals: 18,
    },
    rpcUrls: {
      default: { http: [rpcUrl] },
    },
    blockExplorers: {
      default: {
        name: `${name} Explorer`,
        url: explorerUrl,
        apiUrl: explorerApiUrl,
      },
    },
  });

export const sepolia = createChain(
  ChainId.Sepolia,
  'Sepolia',
  'tETH',
  'https://ethereum-sepolia-rpc.publicnode.com',
  'https://sepolia.etherscan.io',
  'https://api-sepolia.etherscan.io/api'
);

export const baseSepolia = createChain(
  ChainId.BaseSepolia,
  'Base Sepolia',
  'ETH',
  'https://sepolia.base.org',
  'https://sepolia.basescan.org',
  'https://sepolia.basescan.org/api'
);

export const localhost = defineChain({
  id: 31337,
  name: 'Hardhat',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: [env.VITE_RPC_URL],
    },
  },
});

export const supportedChains = [sepolia, baseSepolia] as const;

export const AIRDROP_API_MAP: Record<number, string> = {
  [ChainId.Sepolia]: 'https://sepolia.airdroper.bitcoinos.build',
  [ChainId.BaseSepolia]: 'https://basesepolia.airdroper.bitcoinos.build',
};
