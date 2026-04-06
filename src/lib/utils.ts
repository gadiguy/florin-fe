import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import XversIcon from '@/assets/wallet-icons/Xvers.svg';
import MetaMaskIcon from '@/assets/wallet-icons/MetaMask.svg';
import WalletConnectIcon from '@/assets/wallet-icons/walletConnect.svg';
import InjectedIcon from '@/assets/wallet-icons/Injected.svg';
import UnisatIcon from '@/assets/wallet-icons/UniSat.svg';
import OkxIcon from '@/assets/wallet-icons/Okx.svg';
import { bech32, bech32m } from 'bech32';
import { ETHERSCAN_URL, BITCOIN_TESTNET_URL } from '@/constants';

export const gasFee = 0.0013;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const walletIcons = {
  xverse: XversIcon,
  metamask: MetaMaskIcon,
  walletConnect: WalletConnectIcon,
  metaMaskSDK: MetaMaskIcon,
  injected: InjectedIcon,
  unisat: UnisatIcon,
  'com.okex.wallet': OkxIcon,
};

export function truncateAddress(address: string) {
  if (!address) return '';
  const first = address.substring(0, 6);
  const last = address.substring(address.length - 4);
  return `${first}...${last}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function stringifyWithBigInt(obj: any): string {
  return JSON.stringify(obj, (_, value) =>
    typeof value === 'bigint' ? value.toString() : value
  );
}

/**
 * Validates a Litecoin address
 * Supports P2WPKH (bech32) and P2TR (bech32m) addresses
 * @param address Litecoin address to validate
 * @returns true if the address is valid, false otherwise
 */
export function isValidBitcoinAddress(address: string | undefined): boolean {
  if (!address) return false;

  // Litecoin bech32 P2WPKH: ltc1q... (mainnet) or tltc1q... (testnet)
  // Litecoin bech32m P2TR:   ltc1p... (mainnet) or tltc1p... (testnet)
  const ltcRegex = /^(ltc1[qp][a-z0-9]{38,}|tltc1[qp][a-z0-9]{38,})$/;

  return ltcRegex.test(address);
}


/**
 * Converts a Litecoin address to a bytes32 value
 * @param address Litecoin address to convert
 * @returns bytes32 value as a hex string
 */
export function bech32ToBytes32(address: string): `0x${string}` {
  try {
    const decoded = bech32.decode(address);
    const witnessProgram = bech32.fromWords(decoded.words.slice(1));
    return `0x${Array.from(witnessProgram)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .padStart(64, '0')}` as `0x${string}`;
  } catch {
    const decoded = bech32m.decode(address);
    const witnessProgram = bech32m.fromWords(decoded.words.slice(1));
    return `0x${Array.from(witnessProgram)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .padStart(64, '0')}` as `0x${string}`;
  }
}

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error('Invalid hex string');
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Converts a bytes32 (hex) to a Litecoin bech32m Taproot address
 * @param bytes32 Hex value (with or without 0x)
 * @param network 'mainnet' or 'testnet' (default: 'testnet')
 * @returns Litecoin address (ltc1p... or tltc1p...)
 */
export function bytes32ToBech32Taproot(
  bytes32: string,
  network: 'mainnet' | 'testnet' = 'testnet'
): string {
  const hex = bytes32.startsWith('0x') ? bytes32.slice(2) : bytes32;
  const data = hexToBytes(hex);
  const words = [1, ...bech32.toWords(data)];
  const prefix = network === 'mainnet' ? 'ltc' : 'tltc';
  return bech32m.encode(prefix, words);
}

/**
 * Gets the appropriate blockchain explorer URL based on the hash format
 * @param hash The transaction hash or address to link to
 * @returns The base URL to the appropriate blockchain explorer
 */
export function getExplorerUrl(hash: string | undefined): string {
  if (!hash) return '#';

  // EVM addresses/transactions start with '0x'
  return hash.startsWith('0x')
    ? ETHERSCAN_URL
    : BITCOIN_TESTNET_URL;
}
