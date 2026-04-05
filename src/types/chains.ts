export enum ChainId {
  Ethereum = 1,
  MerlinTestnet = 686868,
  EthereumHolesky = 17000,
  Sepolia = 11155111,
  // BobSepolia = 808813,
  BaseSepolia = 84532,
  ModeSepolia = 919,
  Hardhat = 31337,
}

export type TargetChain = 'sepolia' | 'liteforge';

export const TARGET_CHAIN_LABELS: Record<TargetChain, string> = {
  sepolia: 'Sepolia',
  liteforge: 'Liteforge',
};
