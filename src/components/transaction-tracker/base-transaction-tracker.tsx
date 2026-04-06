import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ReactNode, useState } from 'react';
import { TrackerSkeleton } from './tracker-skeleton';
import { CopyIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';

interface BaseTransactionTrackerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  isLoading: boolean;
  error: unknown;
  children: ReactNode;
  maxHeight?: string;
  positionId?: string;
  reservationId?: string;
}

function IdRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const short = value.slice(0, 6) + '...' + value.slice(-4);

  return (
    <div className="flex items-center gap-2 text-xs text-gray-400">
      <span className="shrink-0">{label}:</span>
      <span className="text-gray-300 font-mono">{short}</span>
      <button
        onClick={handleCopy}
        className={cn(
          'flex items-center justify-center rounded p-1 transition-colors',
          copied ? 'bg-emerald-700' : 'bg-[#3A3740] hover:bg-[#4a4750]'
        )}
        title="Copy"
      >
        <CopyIcon className="w-3 h-3 text-white" />
      </button>
    </div>
  );
}

export function BaseTransactionTracker({
  open,
  onOpenChange,
  title = 'Tracker',
  isLoading,
  error,
  children,
  maxHeight = 'max-h-[90vh]',
  positionId,
  reservationId,
}: BaseTransactionTrackerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`bg-[#1E1C21] border-none rounded-xl overflow-y-auto scrollbar-hide w-full md:w-[585px] ${maxHeight} pt-4 md:pt-6 px-4 md:pr-6 md:pl-6 pb-6 md:pb-9`}
      >
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold text-base">{title}</h3>
          {positionId && <IdRow label="Position ID" value={positionId} />}
          {reservationId && <IdRow label="Reservation ID" value={reservationId} />}
        </div>
        {isLoading ? (
          <TrackerSkeleton />
        ) : error ? (
          <div className="text-red-500 text-center py-4">
            {error instanceof Error ? error.message : 'An error occurred'}
          </div>
        ) : (
          <div className="relative">{children}</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
