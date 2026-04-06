import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TransactionStep } from './transaction-step';
import { BtcCompletionCard } from './btc-completion-card';
import { BaseTransactionTracker } from './base-transaction-tracker';
import { FlorinApiService } from '@/services/Api';
import { useTxConfirmations } from '@/hooks/useTxConfirmations';
import { EthTransactionCard } from './eth-transaction-card';
import { env } from '@/config/env';

interface LiteforgeSwapTrackerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  txHash: string;
}

export function LiteforgeSwapTracker({
  open,
  onOpenChange,
  txHash,
}: LiteforgeSwapTrackerProps) {
  const [shouldPoll, setShouldPoll] = useState(open);

  const { data: swapData } = useQuery({
    queryKey: ['liteforge-swap', txHash],
    queryFn: () => FlorinApiService.getLiteforgeSwap(txHash),
    enabled: !!txHash && shouldPoll,
    refetchInterval: shouldPoll ? 5000 : undefined,
  });

  const ltcSent = swapData?.state === 'ltc_sent' || swapData?.state === 'completed';
  const ltcArrived = swapData?.state === 'completed';

  const confirmations = useTxConfirmations({
    isActive: open,
    transactionHash: txHash,
  });
  const maxConfirmations = Number(env.VITE_EVM_CONFIRMATIONS);

  useEffect(() => {
    setShouldPoll(open && !ltcArrived);
  }, [open, ltcArrived]);

  const maxHeightClass = !ltcArrived
    ? 'max-h-[90vh] md:h-[600px]'
    : 'max-h-[90vh]';

  return (
    <BaseTransactionTracker
      open={open}
      onOpenChange={onOpenChange}
      isLoading={false}
      error={null}
      maxHeight={maxHeightClass}
      title="Liteforge → LTC"
    >
      {/* Step 1 — Swap initiated on Liteforge */}
      <TransactionStep
        title="Swap initiated"
        description="Your swap transaction was confirmed on Liteforge."
        status="completed"
        completed={true}
        isStepOne={true}
      >
        <EthTransactionCard
          data={{
            amount: swapData?.amount || '0',
            fiatAmount: '',
            reservationTx: txHash,
            confirmations,
            maxConfirmations,
          }}
        />
      </TransactionStep>

      {/* Step 2 — LTC being sent */}
      <TransactionStep
        title="LTC being sent"
        description="The backend is sending LTC to your Litecoin address."
        status={ltcArrived ? 'completed' : ltcSent ? 'current' : 'pending'}
        completed={ltcSent}
      />

      {/* Step 3 — LTC arrived */}
      <TransactionStep
        title="LTC arrived"
        description="LTC has been delivered to your Litecoin address."
        status={ltcArrived ? 'completed' : 'pending'}
        isLastStep={true}
        completed={ltcArrived}
      >
        {ltcArrived && (
          <BtcCompletionCard
            amount={swapData?.amount || '0'}
            recipientAddress={swapData?.ltcAddress || ''}
            reservationTx={txHash}
            confirmations={1}
            type="position"
          />
        )}
      </TransactionStep>
    </BaseTransactionTracker>
  );
}
