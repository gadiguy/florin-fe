import { Address, Chain, Hash } from 'viem';

export enum Finality {
  UNKNOWN = 'UNKNOWN',
  FINAL = 'FINAL',
  REVERTED = 'REVERTED',
}

export enum PositionStatus {
  None = 'None',
  Active = 'Active',
  Paused = 'Paused',
  Closed = 'Closed'
}

export enum ReservationStatus {
  None = 'None',
  Pending = 'Pending',
  Expired = 'Expired',
  Canceled = 'Canceled',
  Settled = 'Settled'
}


export enum TransactionStatus {
  Pending = 'Pending',
  Completed = 'Completed',
  Failed = 'Failed',
}

export type Position = {
  positionId: string;
  chainId: number;
  ownerAddress: string;
  tokenAddress: Address;
  bitcoinAddress: string;
  exchangeRate: string;
  state: PositionStatus;
  finality: Finality;
  amount: string;
  deadline?: number;
  blockNumber?: number;
  blockHash?: string;
  hash: string;
  createdAt: string; // ISO 8601 string
  receivedAmount?: string;
  status: TransactionStatus;
  contractRegistrationTxHash: string;
  registrationTxhash?: string;
  originTxHash?: string;
  destinationTxHash?: string;
  originTxConfirmations?: number;
  destinationsTxConfirmations?: number;
  targetChain?: number;
  targetTxhash?: string;
  targetBlockNumber?: number;
  targetBlockHash?: string;
};

export type Reservation = {
  reservationId: string;
  ownerAddress: string;
  positionId?: string;
  tokenAddress: Address,
  amount: string;
  state: ReservationStatus;
  finality: Finality;
  chainId: number;
  bitcoinAddress?: string;
  blockNumber?: number;
  blockTimestamp?: number;
  blockHash?: string;
  hash: string;
  createdAt: string; // ISO 8601 string
  receivedAmount?: string;
  contractRegistrationTxHash: string;
  originTxhash?: string;
  targetChain?: number;
  targetTxhash?: string;
  targetBlockNumber?: number;
  targetBlockHash?: string;
  originBlockNumber?: number;
  originBlockHash?: string;
  liteforgeTxhash?: string;
};

export type EVMPosition = {
  positionId: string;
  ownerAddress: Address;
  bitcoinAddress: string[];
  originalAmount: bigint;
  availableAmount: bigint;
  settledAmount: bigint;
  withdrawnAmount: bigint;
  exchangeRate: bigint;
  partialSettlement: boolean;
  status: number;
};

export type EVMReservation = {
  reservationId: string;
  positionId: string;
  ownerAddress: Address;
  tokenAmount: bigint;
  depositAmount: bigint;
  createdAtBlock: bigint;
  status: number;
  bitcoinAddress: string;
};

export interface ContractManagerConfig {
  chain: Chain;
  network: {
    rpcUrl: string;
  };
  privateKey?: Address;
}

export interface ContractConfig {
  // TODO: Fix this type once we have the correct type for the contract
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abi: any[];
  bytecode: Address;
}

export interface TransactionResponse {
  hash: Hash;
  // TODO: Fix this type once we have the correct type for the transaction
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wait: () => Promise<any>;
}



export type TransactionHistoryItem = {
  transactionType?: 'position' | 'reservation' | 'liteforge_swap';
  positionId: string;
  reservationId?: string;
  amount: string;
  originalAmount?: string;
  tokenAddress: string;
  ownerAddress: string;
  bitcoinAddress: string;
  registrationChain: number;
  registrationTxhash: string;
  registrationBlockHash: string;
  registrationBlockNumber: number;
  registrationFinality: Finality;
  originChain: number;
  originTxhash: string;
  originBlockNumber: number;
  originBlockHash: string;
  originFinality: Finality;
  state: number;
  targetTxhash?: string;
  targetBlockNumber?: number;
  targetBlockHash?: string;
  targetTxConfirmations?: number;
  blockTimestamp?: string;
  targetChain?: number;
  liteforgeTxhash?: string;
};

export type TransactionHistory = TransactionHistoryItem[];

export interface LiteforgeSwap {
  l2TxHash: string;
  userAddress: string;
  ltcAddress: string;
  amount: string;
  state: 'pending' | 'ltc_sent' | 'completed';
}

export interface Transaction {
  hash: string;
  date: string;
  action: string;
  asset: string;
  fromChain: string;
  toChain: string;
  amount: string;
  receivedAmount: string;
  status: TransactionStatus;
  contractRegistration: string;
  originTxId: string;
  destinationTxId: string;
}
