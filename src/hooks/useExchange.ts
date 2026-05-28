import {
  Finality,
  Position,
  PositionStatus,
  Reservation,
  ReservationStatus,
  TransactionStatus,
  EVMPosition,
  EVMReservation,
} from '@/types';
import { useState } from 'react';
import { Address, formatEther } from 'viem';
import { CONTRACTS_ADDRESS } from '@/constants/contracts';
import { ContractManager } from '@/services/ContractManager';
import { bech32ToBytes32, bytes32ToBech32Taproot } from '@/lib/utils';
import { AMMEXCHANGE_ABI } from '@/constants/abis';
import { useRelayedReservePosition } from './useRelayedReservePosition';

function parseContractError(error: unknown): string {
  const message = (error as Error)?.message ?? '';
  if (
    message.includes('insufficient funds') ||
    message.includes('exceeds the balance') ||
    message.includes('InsufficientFunds')
  ) {
    return 'Insufficient ETH to cover gas fees. Please add ETH to your wallet and try again.';
  }
  if (message.includes('User rejected') || message.includes('user rejected')) {
    return 'Transaction cancelled.';
  }
  return message;
}

export const useExchange = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { relay: relayReservePosition } = useRelayedReservePosition();

  const estimateOpenPositionGas = async (): Promise<number> => {
    try {
      const contractManager = await ContractManager.getInstance();
      const gasPrice = await contractManager.publicClient.getGasPrice();
      return Number(formatEther(2000000n * gasPrice));
    } catch (error) {
      console.error('Error estimating openPosition gas:', error);
      return 0;
    }
  };

  const estimateReservePositionGas = async ({
    tokenAmount,
    owner,
    chainId,
  }: {
    tokenAmount: bigint;
    owner: Address;
    chainId: number;
  }): Promise<number> => {
    try {
      const contractManager = await ContractManager.getInstance();
      const contractAddress = CONTRACTS_ADDRESS[
        chainId as keyof typeof CONTRACTS_ADDRESS
      ].ammExchange as Address;

      const { request } = await contractManager.publicClient.simulateContract({
        address: contractAddress,
        abi: AMMEXCHANGE_ABI,
        functionName: 'reservePosition',
        args: [CONTRACTS_ADDRESS[chainId as keyof typeof CONTRACTS_ADDRESS].defaultPositionId, owner, tokenAmount],
        account: owner,
        value: 0n,
      });
      const gasEstimate =
        await contractManager.publicClient.estimateContractGas({
          ...request,
          account: owner,
        });
      const gasPrice = await contractManager.publicClient.getGasPrice();
      return Number(formatEther(gasEstimate * gasPrice));
    } catch (error) {
      console.error('Error estimating reservePosition gas:', error);
      return 0;
    }
  };

  const openPosition = async ({
    tokenAmount,
    exchangeRate,
    bitcoinAddresses,
    deadline,
    owner,
    chainId,
  }: {
    tokenAmount: bigint;
    exchangeRate: number;
    bitcoinAddresses: `0x${string}`;
    deadline: number;
    owner: Address;
    chainId: number;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const contractManager = await ContractManager.getInstance();
      const contractAddress = CONTRACTS_ADDRESS[
        chainId as keyof typeof CONTRACTS_ADDRESS
      ].ammExchange as Address;
      const tokenAddress = CONTRACTS_ADDRESS[
        chainId as keyof typeof CONTRACTS_ADDRESS
      ].erc20BitSnark as Address;

      const balance = await contractManager.readContract(
        'ERC20BitSnark',
        'balanceOf',
        [owner],
        tokenAddress
      ) as unknown as bigint;
      if (balance < tokenAmount) {
        throw new Error('Insufficient zkLTC balance.');
      }

      const tokenName = await contractManager.readContract(
        'ERC20BitSnark',
        'name',
        [],
        tokenAddress
      );

      const nonce = await contractManager.readContract(
        'ERC20BitSnark',
        'nonces',
        [owner],
        tokenAddress
      );
      const domain = {
        name: tokenName,
        version: '1',
        chainId,
        verifyingContract: tokenAddress,
      };
      const types = {
        Permit: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
        ],
      };
      const message = {
        owner,
        spender: contractAddress,
        value: tokenAmount,
        nonce,
        deadline,
      };

      const signature = await contractManager.signTypedData({
        domain,
        types,
        primaryType: 'Permit',
        message,
      });

      const { r, s, v } = contractManager.getRSV(signature);
      const bytes32 = bech32ToBytes32(bitcoinAddresses);

      const { hash, wait } = await contractManager.writeContract(
        'AMMExchange',
        'openPosition',
        [
          tokenAmount,
          BigInt(exchangeRate),
          bytes32 as `0x${string}`,
          BigInt(deadline),
          v,
          r,
          s,
        ],
        contractAddress
      );
      const receipt = await wait();
      const transaction = {
        hash,
        contractRegistrationTxHash: hash,
        blockHash: null,
        blockNumber: receipt.receipt?.blockNumber,
        status: TransactionStatus.Pending,
        createdAt: new Date().toISOString(),
        receivedAmount: '0',
      };
      const newPosition: Position = {
        positionId: receipt?.logs ? receipt?.logs[0].args.positionId : '',
        ownerAddress: owner,
        amount: tokenAmount.toString(),
        deadline: deadline,
        exchangeRate: exchangeRate.toString(),
        tokenAddress: tokenAddress,
        bitcoinAddress: bitcoinAddresses,
        state: PositionStatus.Active,
        finality: Finality.FINAL,
        chainId: chainId,
        ...transaction,
      };

      setLoading(false);
      return newPosition;
    } catch (error) {
      setLoading(false);
      setError(parseContractError(error));
      console.log('openPosition error', error);
    }
  };

  const reservePosition = async ({
    evmReceivingAddress,
    tokenAmount,
    chainId,
    owner,
  }: {
    evmReceivingAddress: Address;
    tokenAmount: bigint;
    chainId: number;
    owner: Address;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const tokenAddress = CONTRACTS_ADDRESS[
        chainId as keyof typeof CONTRACTS_ADDRESS
      ].erc20BitSnark as Address;

      const positionId = CONTRACTS_ADDRESS[chainId as keyof typeof CONTRACTS_ADDRESS].defaultPositionId;

      const relayerUrl = import.meta.env.VITE_RELAYER_URL as string | undefined;

      if (relayerUrl) {
        // --- Meta-transaction path (gas-free for user) ---
        // Errors from the relayer propagate directly; no ETH fallback.
        const { txHash } = await relayReservePosition({
          evmReceivingAddress,
          tokenAmount,
          chainId,
        });

        // The relayer returns txHash after 2 confirmations.
        // reservationId will be populated by the existing polling hooks
        // (useReservation / useEVMReservationPolling) once the tx is mined.
        const newReservation: Reservation = {
          positionId: positionId,
          reservationId: '', // Populated by polling hooks
          ownerAddress: owner,
          amount: tokenAmount.toString(),
          tokenAddress: tokenAddress,
          state: ReservationStatus.Pending,
          finality: Finality.FINAL,
          chainId: chainId,
          hash: txHash,
          contractRegistrationTxHash: txHash,
          blockHash: '',
          blockNumber: undefined,
          status: TransactionStatus.Pending,
          createdAt: new Date().toISOString(),
          receivedAmount: '0',
        };

        setLoading(false);
        return newReservation;

      } else {
        // --- Direct on-chain path (user pays ETH gas) ---
        const contractAddress = CONTRACTS_ADDRESS[
          chainId as keyof typeof CONTRACTS_ADDRESS
        ].ammExchange as Address;

        const contractManager = await ContractManager.getInstance();
        const { hash, wait } = await contractManager.writeContract(
          'AMMExchange',
          'reservePosition',
          [positionId, evmReceivingAddress, tokenAmount],
          contractAddress,
          { value: 0n }
        );
        const receipt = await wait();

        const transaction = {
          hash: hash,
          contractRegistrationTxHash: hash,
          blockHash: receipt.receipt?.blockHash,
          blockNumber: receipt.receipt?.blockNumber,
          status: TransactionStatus.Completed,
          receivedAmount: '0',
        };

        const reservationId = receipt?.logs
          ? receipt.logs.find((l: { args?: { reservationId?: string } }) => l.args?.reservationId)?.args?.reservationId
          : '';
        if (!reservationId) {
          throw new Error('Reservation ID not found in receipt logs');
        }
        const newReservation: Reservation = {
          positionId: positionId,
          reservationId: reservationId,
          ownerAddress: owner,
          amount: tokenAmount.toString(),
          tokenAddress: tokenAddress,
          state: ReservationStatus.Pending,
          finality: Finality.FINAL,
          chainId: chainId,
          ...transaction,
          createdAt: new Date().toISOString(),
        };

        setLoading(false);
        return newReservation;
      }
    } catch (error) {
      setLoading(false);
      setError(parseContractError(error));
      console.log('reservePosition error', error);
      throw error;
    }
  };

  const getPosition = async ({
    positionId,
    chainId,
  }: {
    positionId: string;
    chainId: number;
  }): Promise<EVMPosition> => {
    try {
      setLoading(true);
      const contractManager = await ContractManager.getInstance();
      const contractAddress = CONTRACTS_ADDRESS[
        chainId as keyof typeof CONTRACTS_ADDRESS
      ].ammExchange as Address;

      const position = (await contractManager.readContract(
        'AMMExchange',
        'getPosition',
        [positionId],
        contractAddress
      )) as unknown as EVMPosition;
      setLoading(false);
      return position;
    } catch (error) {
      setLoading(false);
      setError(parseContractError(error));
      console.error('getPosition error:', error);
      throw error;
    }
  };

  const getReservation = async ({
    reservationId,
    chainId,
  }: {
    reservationId: string;
    chainId: number;
  }): Promise<EVMReservation> => {
    try {
      setLoading(true);
      const contractManager = await ContractManager.getInstance();
      const contractAddress = CONTRACTS_ADDRESS[
        chainId as keyof typeof CONTRACTS_ADDRESS
      ].ammExchange as Address;

      const reservation = (await contractManager.readContract(
        'AMMExchange',
        'getReservation',
        [reservationId],
        contractAddress
      )) as unknown as EVMReservation;
      setLoading(false);

      return {
        ...reservation,
        bitcoinAddress:
          bytes32ToBech32Taproot(reservation.bitcoinAddress) ?? '',
      };
    } catch (error) {
      setLoading(false);
      setError(parseContractError(error));
      console.error('getReservation error:', error);
      throw error;
    }
  };

  return {
    loading,
    error,
    openPosition,
    reservePosition,
    getPosition,
    getReservation,
    estimateOpenPositionGas,
    estimateReservePositionGas,
    setError,
  };
};
