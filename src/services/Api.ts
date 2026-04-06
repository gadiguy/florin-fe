import { env } from '@/config/env';
import { Position, Reservation, TransactionHistory, LiteforgeSwap } from '@/types';

const API_BASE_URL = env.VITE_API_BASE_URL;

function serializeBigInt<T>(data: T): string {
  return JSON.stringify(data, (_, value) =>
    typeof value === 'bigint' ? value.toString() : value
  );
}

export class FlorinApiService {
  static async getGreeting(): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/`);
    if (!response.ok) {
      throw new Error(`Failed to fetch greeting: ${response.statusText}`);
    }
    return response.text();
  }

  static async getActivePositions(finalityFlag?: boolean): Promise<Position[]> {
    const response = await fetch(`${API_BASE_URL}/positions/active`);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch active positions: ${response.statusText}`
      );
    }
    const positions = await response.json();
    return finalityFlag === undefined
      ? positions
      : positions.filter((p: Position) => p.finality === 'FINAL');
  }

  static async getPositionById(
    id: string | undefined,
  ): Promise<Position | null> {
    if (!id) return null;

    const response = await fetch(`${API_BASE_URL}/position/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch position: ${response.statusText}`);
    }
    const position = await response.json();
    return position;
  }

  static async getActiveReservations(): Promise<Reservation[]> {
    const response = await fetch(`${API_BASE_URL}/reservations/active`);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch active reservations: ${response.statusText}`
      );
    }
    return response.json();
  }

  static async getReservationById(
    id: string | undefined,
  ): Promise<{ data: Reservation; blockCount: number } | null> {
    if (!id) return null;

    const response = await fetch(`${API_BASE_URL}/reservation/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch reservation: ${response.statusText}`);
    }
    const reservation = await response.json();
    return reservation;
  }

  static async getBitcoinTaprootAddress(): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/bitcoin/taproot-address`);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch taproot address: ${response.statusText}`
      );
    }
    return response.text();
  }

  static async finPositionIdForAmount(amount: bigint): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/positions/find-for-amount`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: serializeBigInt({ amount }),
    });

    if (!response.ok) {
      throw new Error(`Failed to find position: ${response.statusText}`);
    }
    const data = await response.json();
    return data.positionId;
  }

  static async getMaxAmount(): Promise<{
    maxAmount: number;
    minAmount: number;
  }> {
    return {
      maxAmount: env.VITE_MAX_AMOUNT,
      minAmount: env.VITE_MIN_AMOUNT,
    };
  }

  static async getTransactionHistory(
    ownerAddress: string | undefined
  ): Promise<TransactionHistory> {
    if (!ownerAddress) {
      throw new Error('Owner address is required');
    }

    const response = await fetch(
      `${env.VITE_API_BASE_URL}/history/${ownerAddress}`
    );
    if (!response.ok) {
      throw new Error(
        `Failed to fetch transaction history: ${response.statusText}`
      );
    }
    return response.json();
  }

  static async getBtcBlockCount(): Promise<{ blockCount: number }> {
    const response = await fetch(`${API_BASE_URL}/btcBlockCount`);
    if (!response.ok) {
      throw new Error(`Failed to fetch block count: ${response.statusText}`);
    }
    return response.json();
  }

  static async getLiteforgeSwap(txHash: string): Promise<LiteforgeSwap | null> {
    if (!txHash) return null;
    const response = await fetch(`${API_BASE_URL}/liteforge-swap/${txHash}`);
    if (!response.ok) return null;
    return response.json();
  }
}
