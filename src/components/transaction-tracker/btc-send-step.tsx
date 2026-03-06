import { Card } from '@/components/ui/card';
import { TransactionStep } from './transaction-step';
import { WarningMessage } from './warning-message';
import { AddressReveal } from './address-reveal';
import { WarningIcon } from './warning-icon';
import { useMemo } from 'react';
import { ReservationStatus, Reservation } from '@/types';
import { useTimer } from './timer-logic';
import {
  addHours,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
} from 'date-fns';
import { env } from '@/config/env';

interface BtcSendStepProps {
  amount: string;
  recipientAddress?: string;
  isSent: boolean;
  state: ReservationStatus;
  reservation: Reservation;
  fiatAmount: string;
  isReadyToSend: boolean;
}

export function BtcSendStep({
  amount,
  recipientAddress,
  isSent,
  state,
  reservation,
  fiatAmount,
  isReadyToSend,
}: BtcSendStepProps) {
  const warningMessage = 'You can use any Litecoin wallet to send funds.';
  const blockTimestamp = reservation.blockTimestamp
    ? reservation.blockTimestamp * 1000
    : 0;

  const remainingTime = useMemo(() => {
    const now = new Date();
    const endTime = addHours(
      new Date(blockTimestamp),
      env.VITE_EXPIRATION_HOURS
    );

    if (now >= endTime) return { hours: 0, minutes: 0, seconds: 0 };
    return {
      hours: differenceInHours(endTime, now),
      minutes: differenceInMinutes(endTime, now) % 60,
      seconds: differenceInSeconds(endTime, now) % 60,
    };
  }, [blockTimestamp]);

  const { timeLeft, progress } = useTimer(
    reservation.state === ReservationStatus.Pending,
    remainingTime
  );

  const descriptionMessage = isSent
    ? 'You initiated transaction in your wallet to send LTC.'
    : parseFloat(fiatAmount) > env.VITE_EVM_CONFIRMATIONS_USD_AMOUNT
      ? `Your Litecoin transaction has been detected. You need to send LTC from your Litecoin wallet to a specified address. If your transaction is ${env.VITE_EVM_CONFIRMATIONS_USD_AMOUNT}+ in LTC, you must wait for at least ${env.VITE_EVM_CONFIRMATIONS} confirmations before sending LTC. Make sure to send LTC within ${env.VITE_EXPIRATION_HOURS} hours.`
      : `Your Litecoin transaction has been detected. You can send LTC from your Litecoin wallet to a specified address. Make sure to send LTC within ${env.VITE_EXPIRATION_HOURS} hours.`;

  const stepStatus =
    reservation.state !== ReservationStatus.Expired &&
    (reservation.originTxhash || isReadyToSend)
      ? 'completed'
      : 'current';

  return (
    <TransactionStep
      title="Send LTC"
      description={descriptionMessage}
      status={stepStatus}
      completed={stepStatus === 'completed'}
    >
      {!isSent && (
        <Card className="bg-[#100D16] rounded-xl p-3 md:p-4 border-none w-full gap-2">
          <WarningMessage message={warningMessage} iconToShow="info" />
          {state === ReservationStatus.Expired ? (
            <div
              className="flex gap-2 bg-grey rounded-xl p-3"
              data-testid="reservation-expired-message"
            >
              <div className="text-orange w-5 h-5 md:w-6 md:h-6 flex-shrink-0 mt-0.5 mr-2 md:mr-3">
                <WarningIcon />
              </div>
              <span className="text-white text-[14px] md:text-[16px] font-medium text-center">
                Your reservation is not valid anymore. Try to create a new one.
              </span>
            </div>
          ) : (
            <AddressReveal
              amount={amount}
              address={recipientAddress!}
              timeLeft={timeLeft}
              progress={progress}
              isReadyToSend={isReadyToSend}
            />
          )}
        </Card>
      )}
    </TransactionStep>
  );
}
