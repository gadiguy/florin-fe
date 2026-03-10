import {
  formatHash,
  getChainLogo,
  formatDate,
  formatReceivedAmount,
} from './utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRightIcon, SymbolIcon } from '@radix-ui/react-icons';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useMaxMinBtc } from '@/hooks/queries/useMaxMinBtc';
import { TransactionNormalized } from './transaction-history-adapter';
import { StatusIcon } from '@/components/ui/status-icon';
import { getExplorerUrl } from '@/lib/utils';
import { Txhash } from './txhash';

// Mobile Transaction Item using Accordion
export const MobileTransactionItem = ({
  tx,
  index,
  setTransactionToTrack,
  setOpenTrackerDialog,
}: {
  tx: TransactionNormalized;
  index: number;
  setTransactionToTrack?: (tx: {
    id: string;
    type: 'reservation' | 'position';
    txHash: string;
  }) => void;
  setOpenTrackerDialog?: (open: boolean) => void;
}) => {
  const { data } = useMaxMinBtc();

  const handleOpenTrackerDialog = () => {
    if (setOpenTrackerDialog && setTransactionToTrack) {
      setOpenTrackerDialog(true);
      setTransactionToTrack({
        id: tx.contractRegistrationTxHash,
        type: tx.type === 'position' ? 'position' : 'reservation',
        txHash: tx.contractRegistrationTxHash,
      });
    }
  };

  return (
    <AccordionItem
      value={`tx-${index}`}
      className="bg-[#1D1F25] rounded-xl border-none overflow-hidden"
      data-testid="mobile-transaction-item"
    >
      <AccordionTrigger className="flex items-center justify-between p-3 w-[327px] h-[52px] text-white hover:no-underline" data-testid="mobile-transaction-header">
        <div className="flex items-center gap-1">
          <img
            src={getChainLogo(tx.fromChain.toLowerCase())}
            alt={tx.fromChain}
            className="h-5 w-5"
          />
          <span className="text-sm font-medium">{tx.fromChain}</span>
          <ArrowRightIcon className="text-white w-3 h-3" />
          <img src={getChainLogo(tx.toChain.toLowerCase())} alt={tx.toChain} className="h-5 w-5" />
          <span className="text-sm font-medium">{tx.toChain}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm font-medium text-right">
            <span className="text-white">{tx.amount}</span> {tx.type === 'position' ? 'zkLTC' : 'LTC'}
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="px-4 pb-4 pt-0">
        <div className="space-y-4 text-[#9A9A9A]">
          <div className="grid grid-cols-2 items-center">
            <span className="text-sm">Contract registration</span>
            <span className="text-sm text-right text-[#F0A719]">
              <Txhash
                hash={tx.contractRegistrationTxHash || ''}
                explorerUrl={`${getExplorerUrl(tx.contractRegistrationTxHash || '')}/tx/${tx.contractRegistrationTxHash || ''}`}
                formattedHash={formatHash(tx.contractRegistrationTxHash || '')}
                trigger="click"
              />
            </span>
          </div>

          <div className="grid grid-cols-2 items-center">
            <span className="text-sm">Requested amount</span>
            <span className="text-sm text-right">
              {tx.amount} {tx.type === 'position' ? 'zkLTC' : 'LTC'}
            </span>
          </div>

          <div className="grid grid-cols-2 items-center">
            <span className="text-sm">Received amount</span>
            <span className="text-sm text-right">
              {formatReceivedAmount(tx.receivedAmount, data?.minAmount)}{' '}
              {tx.type === 'position' ? 'LTC' : 'zkLTC'}
            </span>
          </div>

          <div className="grid grid-cols-2 items-center">
            <span className="text-sm">Origin network TXID</span>
            <span className="text-sm text-right text-[#FFAA2E]">
              <Txhash
                hash={tx.originTxHash || ''}
                explorerUrl={`${getExplorerUrl(tx.originTxHash || '')}/tx/${tx.originTxHash || ''}`}
                formattedHash={formatHash(tx.originTxHash || '')}
                trigger="click"
              />
            </span>
          </div>

          <div className="grid grid-cols-2 items-center">
            <span className="text-sm">Destination network TXID</span>
            <span className="text-sm text-right text-[#FFAA2E]">
              <Txhash
                hash={tx.targetTxhash || ''}
                explorerUrl={`${getExplorerUrl(tx.targetTxhash || '')}/tx/${tx.targetTxhash || ''}`}
                formattedHash={formatHash(tx.targetTxhash || '')}
                trigger="click"
              />
            </span>
          </div>

          <div className="grid grid-cols-2 items-center">
            <span className="text-sm">Timestamp</span>
            <span className="text-sm text-right text-white">
              {formatDate(tx.createdAt)}
            </span>
          </div>

          <div className="grid grid-cols-2 items-center">
            <span className="text-sm">Status</span>
            <div className="flex items-center justify-end gap-2">
              <StatusIcon status={tx.state} />
              <span className="text-sm">{tx.state}</span>
            </div>
          </div>

          <Button
            variant="grey"
            className="w-full h-[56px]"
            onClick={handleOpenTrackerDialog}
          >
            Track
          </Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

// Mobile Loading Skeleton
export const MobileLoadingSkeleton = () => (
  <div className="bg-[#1D1F25] rounded-xl border-none overflow-hidden mb-3">
    <div className="flex items-center justify-between p-3 w-[327px] h-[52px]">
      <div className="flex items-center gap-1">
        <Skeleton className="h-5 w-5 rounded-full" data-testid="skeleton" />
        <Skeleton className="h-5 w-16" data-testid="skeleton" />
        <Skeleton className="h-3 w-3 mx-1" data-testid="skeleton" />
        <Skeleton className="h-5 w-5 rounded-full" data-testid="skeleton" />
        <Skeleton className="h-5 w-16" data-testid="skeleton" />
      </div>
      <div className="flex items-center">
        <Skeleton className="h-5 w-16" data-testid="skeleton" />
      </div>
    </div>
  </div>
);

// Mobile Empty State
export const MobileEmptyState = () => (
  <div className="bg-[#1D1F25] rounded-[24px] border border-[#333845] p-6 text-center" data-testid="empty-state">
    <div className="flex flex-col items-center justify-center gap-2">
      <SymbolIcon className="h-10 w-10 text-[#666]" />
      <p className="text-white text-base">No transactions found</p>
      <p className="text-[#9A9A9A] text-sm">
        Your transactions will appear here once you start interacting with the
        platform.
      </p>
    </div>
  </div>
);

// Mobile Wallet Not Connected State
export const MobileWalletNotConnectedState = () => (
  <div className="bg-[#1D1F25] rounded-[24px] border border-[#333845] p-6 text-center" data-testid="wallet-not-connected-state">
    <div className="flex flex-col items-center justify-center gap-2">
      <SymbolIcon className="h-10 w-10 text-[#666]" />
      <p className="text-white text-base">Wallet not connected</p>
      <p className="text-[#9A9A9A] text-sm">
        Connect your wallet to see your transaction history.
      </p>
    </div>
  </div>
);
