import {
  TransactionHistoryItem,
  PositionStatus,
  Finality,
  ReservationStatus,
} from '@/types';
import { formatUnits } from 'viem';

export type TransactionType = 'position' | 'reservation' | 'liteforge_swap';
export type ChainType = 'Litecoin' | 'Ethereum' | 'LiteForge';

export interface TransactionNormalized {
  type: TransactionType;
  fromChain: ChainType;
  toChain: ChainType;
  positionId: string;
  reservationId?: string;
  chainId: number;
  ownerAddress: string;
  tokenAddress: `0x${string}`;
  bitcoinAddress: string;
  exchangeRate: string;
  state: PositionStatus | ReservationStatus;
  registrationFinality: Finality;
  amount: string;
  originalAmount?: string;
  blockNumber: number;
  blockHash: string;
  createdAt: string;
  contractRegistrationTxHash: string;
  originTxHash: string;
  receivedAmount?: string;
  targetTxhash?: string;
  targetBlockNumber?: number;
  targetChain?: number;
}

export const POSITION_STATUS_MAP = [
  PositionStatus.None,     // 0
  PositionStatus.Active,   // 1
  PositionStatus.Paused,   // 2
  PositionStatus.Closed,   // 3
];

export const RESERVATION_STATUS_MAP = [
  ReservationStatus.None,     // 0
  ReservationStatus.Pending,  // 1
  ReservationStatus.Expired,  // 2
  ReservationStatus.Canceled, // 3
  ReservationStatus.Settled,  // 4
];

/**
 * Parse a string in the format "bigint:12a05f200n" to extract the BigInt value
 */
export function parseBigIntString(value: string): bigint {
  if (typeof value === 'string' && value.startsWith('bigint:')) {
    // Extract the hexadecimal part (remove "bigint:" prefix and "n" suffix)
    const hexValue = value.substring(7, value.length - 1);
    return BigInt(`0x${hexValue}`);
  }

  // If the format is not recognized, try direct parsing
  return BigInt(value);
}

function getFromToChains(type: TransactionType, item: TransactionHistoryItem): { fromChain: ChainType; toChain: ChainType } {
  switch (type) {
    case 'position':
      return { fromChain: 'Ethereum', toChain: 'Litecoin' };
    case 'liteforge_swap':
      return { fromChain: 'LiteForge', toChain: 'Litecoin' };
    case 'reservation':
      return {
        fromChain: 'Litecoin',
        toChain: item.liteforgeTxhash ? 'LiteForge' : 'Ethereum',
      };
  }
}

/**
 * Transforms a TransactionHistoryItem into a TransactionResponse object
 * This adapter ensures compatibility with the existing table component
 */
export function transactionHistoryAdapter(
  item: TransactionHistoryItem
): TransactionNormalized {
  // Use transactionType from BE if available, otherwise infer
  const type: TransactionType = item.transactionType || (!item.reservationId ? 'position' : 'reservation');

  // Parse amount properly if it's in the bigint string format
  const originalAmountToUse = parseBigIntString(
    item.originalAmount || (item.amount as string)
  );

  const createdAtDate = item.blockTimestamp
    ? new Date(parseInt(item.blockTimestamp) * 1000) // Convert seconds to milliseconds
    : new Date();

  const state = type === 'position'
    ? POSITION_STATUS_MAP[item.state ?? 1]
    : item.targetTxhash ? ReservationStatus.Settled : RESERVATION_STATUS_MAP[item.state || 1];

  const { fromChain, toChain } = getFromToChains(type, item);

  return {
    ...item,
    type,
    fromChain,
    toChain,
    positionId: item.positionId,
    reservationId: item.reservationId,
    chainId: item.registrationChain,
    ownerAddress: item.ownerAddress,
    tokenAddress: item.tokenAddress as `0x${string}`,
    bitcoinAddress: item.bitcoinAddress,
    exchangeRate: '1',
    state,
    registrationFinality:
      item.registrationFinality === 'FINAL' ? Finality.FINAL : Finality.UNKNOWN,
    amount: formatUnits(originalAmountToUse, 18) || '0',
    originalAmount: formatUnits(originalAmountToUse, 18) || '0',
    receivedAmount: formatUnits(originalAmountToUse, 18) || '0',
    blockNumber: item.registrationBlockNumber,
    blockHash: item.registrationBlockHash,
    createdAt: createdAtDate.toISOString(),
    contractRegistrationTxHash: item.registrationTxhash,
    originTxHash: item.originTxhash,
    targetTxhash: item.targetTxhash || '',
    targetBlockNumber: item.targetBlockNumber,
    targetChain: item.targetChain,
  };
}
