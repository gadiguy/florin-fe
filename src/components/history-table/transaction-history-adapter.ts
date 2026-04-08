import {
  TransactionHistoryItem,
  PositionStatus,
  Finality,
  ReservationStatus,
} from '@/types';
import { formatUnits } from 'viem';

export type TransactionType = 'position' | 'reservation';
export type ChainType = 'Litecoin' | 'Ethereum';

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

/**
 * Transforms a TransactionHistoryItem into a TransactionResponse object
 * This adapter ensures compatibility with the existing table component
 */
export function transactionHistoryAdapter(
  item: TransactionHistoryItem
): TransactionNormalized {
  const type = !item.reservationId ? 'position' : 'reservation';

  // Parse amount properly if it's in the bigint string format
  const originalAmountToUse = parseBigIntString(
    item.originalAmount || (item.amount as string)
  );

  const createdAtDate = item.blockTimestamp 
    ? new Date(parseInt(item.blockTimestamp) * 1000) // Convert seconds to milliseconds
    : new Date();

    const state = type === 'position'
    ? POSITION_STATUS_MAP[item.state ?? 1]
    : item.targetTxhash ? ReservationStatus.Settled : RESERVATION_STATUS_MAP[item.state || 1]

  return {
    ...item,
    type: type,
    fromChain: !item.reservationId ? 'Ethereum' : 'Litecoin',
    toChain: !item.reservationId ? 'Litecoin' : 'Ethereum',
    positionId: item.positionId,
    reservationId: item.reservationId,
    chainId: item.registrationChain,
    ownerAddress: item.ownerAddress,
    tokenAddress: item.tokenAddress as `0x${string}`,
    bitcoinAddress: item.bitcoinAddress,
    exchangeRate: '1', // Not available in new API
    state: state,
    registrationFinality:
      item.registrationFinality === 'FINAL' ? Finality.FINAL : Finality.UNKNOWN,
    amount: formatUnits(originalAmountToUse, 18) || '0',
    originalAmount: formatUnits(originalAmountToUse, 18) || '0',
    receivedAmount: formatUnits(originalAmountToUse, 18) || '0',
    blockNumber: item.registrationBlockNumber,
    blockHash: item.registrationBlockHash,
    createdAt: createdAtDate.toISOString(), // Not available in new API, using current time
    contractRegistrationTxHash: item.registrationTxhash,
    originTxHash: item.originTxhash,
    targetTxhash: item.targetTxhash || '',
    targetBlockNumber: item.targetBlockNumber,
    targetChain: item.targetChain,
  };
}
