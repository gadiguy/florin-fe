import { Finality, ReservationStatus } from '@/types';
import { TransactionStep } from './transaction-step';
import { BtcTransactionCard } from './btc-transaction-card';
import { BtcSendStep } from './btc-send-step';
import { EthCompletionCard } from './eth-completion-card';
import { BaseTransactionTracker } from './base-transaction-tracker';
import { useBitcoinPrice } from '@/hooks/useBitcoinPrice';
import { useMemo, useState, useEffect } from 'react';
import { useTxConfirmations } from '@/hooks/useTxConfirmations';
import { useEVMReservationPolling } from '@/hooks/useEVMReservationPolling';
import { useChainId } from 'wagmi';
import { Address, formatUnits } from 'viem';
import { useReservation } from '@/hooks/queries/useReservation';
import { RESERVATION_STATUS_MAP } from '../history-table/transaction-history-adapter';
import { useBtcBlockConfirmations } from '@/hooks/useBtcBlockConfirmations';
import { env } from '@/config/env';

interface ReservationTrackerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  id: string;
  txHash: string;
}

export function ReservationTracker({
  open,
  onOpenChange,
  id,
  txHash,
}: ReservationTrackerProps) {
  const [shouldPoll, setShouldPoll] = useState(open);
  const { data } = useReservation(id, {
    refetchInterval: shouldPoll ? 5000 : undefined,
  });
  const { data: bitcoinPrice } = useBitcoinPrice();
  const chainId = useChainId();
  const reservation = data?.data;

  const { evmReservation, error: isEVMReservationError } =
    useEVMReservationPolling({
      reservationId: id || '',
      chainId: chainId || 0,
      isActive: shouldPoll,
    });

  const amount = formatUnits(evmReservation?.tokenAmount || 0n, 18);
  const xltcAmount = formatUnits(evmReservation?.tokenAmount || 0n, 18);

  const fiatAmount = useMemo(() => {
    if (!amount || !bitcoinPrice?.bitcoin?.usd) return '0';
    const usdValue = Number(amount) * bitcoinPrice.bitcoin.usd;
    return usdValue.toFixed(2);
  }, [amount, bitcoinPrice?.bitcoin?.usd]);

  const maxConfirmations = Number(env.VITE_EVM_CONFIRMATIONS);

  const confirmations = useTxConfirmations({
    isActive: open,
    transactionHash: txHash,
  });

  const btcConfirmations = useBtcBlockConfirmations({
    isActive: open,
    blockNumber: reservation?.originBlockNumber,
  });

  const status = RESERVATION_STATUS_MAP[evmReservation?.status || 0];
  const bridgingCompleted = status === ReservationStatus.Settled || !!reservation?.targetTxhash;
  const btcReadyToSend =
    Number(fiatAmount) < env.VITE_EVM_CONFIRMATIONS_USD_AMOUNT ||
    confirmations >= maxConfirmations;

  const targetConfirmations = useTxConfirmations({
    isActive: open && bridgingCompleted,
    transactionHash: reservation?.targetTxhash,
  });

  useEffect(() => {
    const should = open && !bridgingCompleted;
    setShouldPoll(should);
  }, [bridgingCompleted, open]);

  const maxHeightClass = !bridgingCompleted
    ? 'max-h-[90vh] md:h-[813px]'
    : 'max-h-[90vh]';

  const btcTransactionDetected =
    status !== ReservationStatus.Expired &&
    !!reservation?.originTxhash &&
    reservation.originBlockNumber &&
    reservation.originBlockNumber > 0;

  return (
    <BaseTransactionTracker
      open={open}
      onOpenChange={onOpenChange}
      isLoading={false}
      error={isEVMReservationError}
      maxHeight={maxHeightClass}
    >
      {evmReservation && (
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
                recipientAddress: evmReservation.ownerAddress,
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
            recipientAddress={evmReservation.bitcoinAddress}
            state={status}
            reservation={{
              ...reservation,
              amount: amount,
              state: status,
              bitcoinAddress: evmReservation.bitcoinAddress,
              hash: txHash,
              targetTxhash: reservation?.targetTxhash,
              reservationId: evmReservation.reservationId,
              ownerAddress: evmReservation.ownerAddress,
              tokenAddress: 'token adrress' as Address,
              finality: Finality.UNKNOWN,
              createdAt: reservation?.createdAt || '',
              chainId: chainId || 0,
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
                  confirmations: btcConfirmations,
                  fiatAmount: fiatAmount,
                  maxConfirmations: env.VITE_BTC_CONFIRMATIONS,
                }}
                isStepThree={true}
              />
            )}
          </TransactionStep>

          {/* Step 4 - Transaction Complete */}
          <TransactionStep
            title="Bridging complete"
            description="Funds (xLTC) are in your wallet now."
            status={bridgingCompleted ? 'completed' : 'pending'}
            isLastStep={true}
            completed={bridgingCompleted}
          >
            {bridgingCompleted && (
              <EthCompletionCard
                amount={xltcAmount}
                confirmations={targetConfirmations}
                recipientAddress={evmReservation.bitcoinAddress || ''}
                reservationTx={
                  reservation?.targetTxhash ||
                  reservation?.targetBlockHash ||
                  ''
                }
                type="reservation"
              />
            )}
          </TransactionStep>
        </>
      )}
    </BaseTransactionTracker>
  );
}
