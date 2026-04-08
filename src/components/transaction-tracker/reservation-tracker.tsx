import { Finality, ReservationStatus } from '@/types';
import { TransactionStep } from './transaction-step';
import { BtcTransactionCard } from './btc-transaction-card';
import { BtcSendStep } from './btc-send-step';
import { EthCompletionCard } from './eth-completion-card';
import { BaseTransactionTracker } from './base-transaction-tracker';
import { useLitecoinPrice } from '@/hooks/useLitecoinPrice';
import { useMemo, useState, useEffect } from 'react';
import { useTxConfirmations } from '@/hooks/useTxConfirmations';
import { useEVMReservationPolling } from '@/hooks/useEVMReservationPolling';
import { useAccount } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { Address, formatUnits } from 'viem';
import { useReservation } from '@/hooks/queries/useReservation';
import { RESERVATION_STATUS_MAP } from '../history-table/transaction-history-adapter';
import { useBtcBlockConfirmations } from '@/hooks/useBtcBlockConfirmations';
import { env } from '@/config/env';
import { TargetChain } from '@/types/chains';
import { useLiteforgeEvent } from '@/hooks/useLiteforgeEvent';
import { CONTRACTS_ADDRESS } from '@/constants/contracts';
import { sepolia } from '@/config/evm-chains';

interface ReservationTrackerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  id: string;
  txHash: string;
  targetChain?: TargetChain;
}

export function ReservationTracker({
  open,
  onOpenChange,
  id,
  txHash,
  targetChain,
}: ReservationTrackerProps) {
  const [shouldPoll, setShouldPoll] = useState(open);
  const { data } = useReservation(id, {
    refetchInterval: shouldPoll ? 5000 : undefined,
  });
  const { data: litecoinPrice } = useLitecoinPrice();
  const reservation = data?.data;

  const { evmReservation } =
    useEVMReservationPolling({
      reservationId: id || '',
      chainId: sepolia.id,
      isActive: shouldPoll,
    });

  const amount = formatUnits(evmReservation?.tokenAmount || 0n, 18);
  const xltcAmount = amount;

  const fiatAmount = useMemo(() => {
    if (!amount || !litecoinPrice?.litecoin?.usd) return '0';
    const usdValue = Number(amount) * litecoinPrice.litecoin.usd;
    return usdValue.toFixed(2);
  }, [amount, litecoinPrice?.litecoin?.usd]);

  const maxConfirmations = Number(env.VITE_EVM_CONFIRMATIONS);

  const confirmations = useTxConfirmations({
    isActive: open,
    transactionHash: txHash,
  });

  const btcConfirmations = useBtcBlockConfirmations({
    isActive: open,
    blockNumber: reservation?.originBlockNumber,
  });

  const depositorAddress = (CONTRACTS_ADDRESS[sepolia.id] as { liteforgeDepositor?: string }).liteforgeDepositor?.toLowerCase();
  const isLiteforge =
    targetChain === 'liteforge' ||
    !!reservation?.liteforgeTxhash ||
    (!!reservation?.ownerAddress && reservation.ownerAddress.toLowerCase() === depositorAddress);

  const ownerAddress = evmReservation?.ownerAddress || reservation?.ownerAddress || '';
  const bitcoinAddress = evmReservation?.bitcoinAddress || reservation?.bitcoinAddress || '';
  const reservationIdStr = evmReservation?.reservationId || id;
  const status = RESERVATION_STATUS_MAP[evmReservation?.status || 0];
  const bridgingCompleted = status === ReservationStatus.Settled || !!reservation?.targetTxhash;
  const btcReadyToSend =
    Number(fiatAmount) < env.VITE_EVM_CONFIRMATIONS_USD_AMOUNT ||
    confirmations >= maxConfirmations;

  const targetConfirmations = useTxConfirmations({
    isActive: open && bridgingCompleted,
    transactionHash: reservation?.targetTxhash,
  });

  const { bridgedEvent } = useLiteforgeEvent({
    isActive: isLiteforge && bridgingCompleted && shouldPoll,
    chainId: sepolia.id,
  });
  const liteforgeArrived = !!bridgedEvent;

  const queryClient = useQueryClient();
  const { address } = useAccount();

  useEffect(() => {
    const should = open && (isLiteforge ? !liteforgeArrived : !bridgingCompleted);
    setShouldPoll(should);
  }, [bridgingCompleted, liteforgeArrived, open, isLiteforge]);

  useEffect(() => {
    if (bridgingCompleted) {
      queryClient.setQueryData(
        ['transactions', 'history', address],
        (old: { reservationId?: string; state?: number }[] | undefined) =>
          old?.map((item) => item.reservationId === id ? { ...item, state: 4 } : item)
      );
    }
  }, [bridgingCompleted]);

  const maxHeightClass = (isLiteforge ? !liteforgeArrived : !bridgingCompleted)
    ? 'max-h-[90vh] md:h-[813px]'
    : 'max-h-[90vh]';

  const btcTransactionDetected =
    bridgingCompleted || (
      status !== ReservationStatus.Expired &&
      !!reservation?.originTxhash &&
      reservation.originBlockNumber &&
      reservation.originBlockNumber > 0
    );

  return (
    <BaseTransactionTracker
      open={open}
      onOpenChange={onOpenChange}
      isLoading={false}
      error={null}
      maxHeight={maxHeightClass}
      positionId={reservation?.positionId}
      reservationId={id}
    >
      {(evmReservation || reservation) && (
        <>
          {/* Step 1 - Request Transfer */}
          <TransactionStep
            title="Request transfer"
            description="Sending your request to the smartcontract."
            status="completed"
            completed={true}
            isStepOne={true}
          >
            <BtcTransactionCard
              data={{
                amount: amount,
                recipientAddress: ownerAddress,
                reservationTx: txHash,
                confirmations: confirmations,
                fiatAmount: fiatAmount,
                maxConfirmations: maxConfirmations,
              }}
            />
          </TransactionStep>

          {/* Step 2 - Send BTC */}
          <BtcSendStep
            amount={amount}
            isSent={bridgingCompleted}
            isReadyToSend={btcReadyToSend}
            recipientAddress={bitcoinAddress}
            state={status}
            reservation={{
              ...reservation,
              amount: amount,
              state: status,
              bitcoinAddress: bitcoinAddress,
              hash: txHash,
              targetTxhash: reservation?.targetTxhash,
              reservationId: reservationIdStr,
              ownerAddress: ownerAddress,
              tokenAddress: 'token adrress' as Address,
              finality: Finality.UNKNOWN,
              createdAt: reservation?.createdAt || '',
              chainId: sepolia.id,
              contractRegistrationTxHash:
                reservation?.contractRegistrationTxHash || '',
              targetChain: reservation?.targetChain,
              targetBlockNumber: reservation?.targetBlockNumber,
              targetBlockHash: reservation?.targetBlockHash,
            }}
            fiatAmount={fiatAmount}
          />

          {/* Step 3 - BTC Transaction Detected */}
          <TransactionStep
            title="LTC transaction detected"
            description="We need 1 confirmation to make sure the transaction is final."
            status={btcTransactionDetected ? 'completed' : 'pending'}
            completed={!!btcTransactionDetected}
          >
            {btcTransactionDetected && (
              <BtcTransactionCard
                data={{
                  amount: amount,
                  txid: reservation?.originTxhash,
                  confirmations: bridgingCompleted ? env.VITE_BTC_CONFIRMATIONS : btcConfirmations,
                  fiatAmount: fiatAmount,
                  maxConfirmations: env.VITE_BTC_CONFIRMATIONS,
                }}
                isStepThree={true}
              />
            )}
          </TransactionStep>

          {/* Step 4 - Transaction Complete */}
          <TransactionStep
            title="Funds on L1"
            description={isLiteforge ? 'zkLTC received on Sepolia.' : 'Funds (zkLTC) are in your wallet now.'}
            status={bridgingCompleted ? 'completed' : 'pending'}
            isLastStep={!isLiteforge}
            completed={bridgingCompleted}
          >
            {bridgingCompleted && (
              <EthCompletionCard
                amount={xltcAmount}
                confirmations={targetConfirmations}
                recipientAddress={bitcoinAddress || ''}
                reservationTx={
                  reservation?.targetTxhash ||
                  reservation?.targetBlockHash ||
                  ''
                }
                type="reservation"
              />
            )}
          </TransactionStep>

          {/* Steps 5 & 6 — Liteforge only */}
          {isLiteforge && (
            <>
              <TransactionStep
                title="Bridging to Liteforge"
                description="zkLTC is being sent to Liteforge via the native bridge."
                status={liteforgeArrived ? 'completed' : bridgingCompleted ? 'current' : 'pending'}
                completed={liteforgeArrived}
              />

              <TransactionStep
                title="Arrived on Liteforge"
                description="Your zkLTC has arrived at your address on Liteforge."
                status={liteforgeArrived ? 'completed' : 'pending'}
                isLastStep={true}
                completed={liteforgeArrived}
              >
                {liteforgeArrived && (
                  <EthCompletionCard
                    amount={xltcAmount}
                    confirmations={0}
                    recipientAddress={bridgedEvent?.args.l2Recipient || ''}
                    reservationTx={bridgedEvent?.transactionHash || ''}
                    type="reservation"
                  />
                )}
              </TransactionStep>
            </>
          )}
        </>
      )}
    </BaseTransactionTracker>
  );
}
