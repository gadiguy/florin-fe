import { ReservationTracker } from './reservation-tracker';
import { PositionTracker } from './position-tracker';
import { TargetChain } from '@/types/chains';

interface TransactionTrackerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'reservation' | 'position';
  id: string;
  txHash: string;
  targetChain?: TargetChain;
}

export function TransactionTrackerDialog({
  open,
  onOpenChange,
  type,
  id,
  txHash,
  targetChain,
}: TransactionTrackerDialogProps) {
  if (type === 'reservation') {
    return (
      <ReservationTracker
        open={open}
        onOpenChange={onOpenChange}
        id={id}
        txHash={txHash}
        targetChain={targetChain}
      />
    );
  }

  return (
    <PositionTracker
      open={open}
      onOpenChange={onOpenChange}
      id={id}
      txHash={txHash}
    />
  );
}
