import { TransactionStep } from './transaction-step';
import { EthTransactionCard } from './eth-transaction-card';
import { BtcCompletionCard } from './btc-completion-card';
import { BaseTransactionTracker } from './base-transaction-tracker';
import { usePosition } from '@/hooks/queries/usePosition';
import { useTxConfirmations } from '@/hooks/useTxConfirmations';
import { useEVMPositionPolling } from '@/hooks/useEVMPositionPolling';
import { useChainId } from 'wagmi';
import { formatUnits } from 'viem';
import { useMemo, useState, useEffect } from 'react';
import { useBitcoinPrice } from '@/hooks/useBitcoinPrice';
import { PositionStatus } from '@/types';
import { POSITION_STATUS_MAP } from '../history-table/transaction-history-adapter';
import { env } from '@/config/env';
import { useBtcBlockConfirmations } from '@/hooks/useBtcBlockConfirmations';

interface PositionTrackerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  id: string;
  txHash: string;
}

export function PositionTracker({
  open,
  onOpenChange,
  id,
  txHash,
}: PositionTrackerProps) {
  const [shouldPoll, setShouldPoll] = useState(open);
  const { data: position } = usePosition(id, {
    refetchInterval: shouldPoll ? 5000 : undefined,
  });
  const chainId = useChainId();
  const { data: bitcoinPrice } = useBitcoinPrice();

  const { evmPosition, isLoading, error } = useEVMPositionPolling({
    positionId: id || '',
    chainId: chainId || 0,
    isActive: shouldPoll,
  });

  const amount = formatUnits(evmPosition?.originalAmount || 0n, 8);
  const fiatAmount = useMemo(() => {
    if (!evmPosition?.originalAmount || !bitcoinPrice?.bitcoin?.usd) return '0';
    const usdValue = Number(amount) * bitcoinPrice.bitcoin.usd;
    return usdValue.toFixed(2);
  }, [evmPosition?.originalAmount, bitcoinPrice?.bitcoin?.usd]);

  const confirmations = useTxConfirmations({
    isActive: open,
    transactionHash: txHash,
  });

  const status = POSITION_STATUS_MAP[evmPosition?.status || 1];
  const isPositionCompleted = status === PositionStatus.Closed;

  useEffect(() => {
    const should = open && !isPositionCompleted;
    setShouldPoll(should);
  }, [isPositionCompleted, open]);

  
  const targetConfirmations = useBtcBlockConfirmations({
    isActive: isPositionCompleted,
    blockNumber: position?.targetBlockNumber,
  });

  const displayTargetConfirmations = targetConfirmations;

  return (
    <BaseTransactionTracker
      open={open}
      onOpenChange={onOpenChange}
      isLoading={isLoading}
      error={error}
      positionId={id}
    >
      {evmPosition && (
        <>
          {/* Step 1 - Initiating transaction */}
          <TransactionStep
            title="Initiating transaction"
            description="Sending your request to the smart contract. It might take up to 5 min."
            status="completed"
            completed={isPositionCompleted}
            isStepOne={true}
          >
            <EthTransactionCard
              data={{
                amount: amount,
                recipientAddress: evmPosition.ownerAddress,
                reservationTx: position?.registrationTxhash || '',
                confirmations: confirmations,
                fiatAmount: fiatAmount,
                maxConfirmations: Number(env.VITE_EVM_CONFIRMATIONS),
              }}
            />
          </TransactionStep>

          {/* Step 2 - Bridging complete */}
          <TransactionStep
            title="Bridging complete"
            description="Funds (LTC) are in your wallet now"
            status={isPositionCompleted ? 'completed' : 'pending'}
            completed={isPositionCompleted}
            isLastStep={true}
          >
            {isPositionCompleted && (
              <BtcCompletionCard
                confirmations={displayTargetConfirmations}
                amount={amount}
                recipientAddress={evmPosition?.positionId || ''}
                reservationTx={
                  position?.targetTxhash || position?.targetBlockHash || ''
                }
                type="position"
              />
            )}
          </TransactionStep>
        </>
      )}
    </BaseTransactionTracker>
  );
}
