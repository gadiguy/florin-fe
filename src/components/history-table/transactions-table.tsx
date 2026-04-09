import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowRightIcon } from '@radix-ui/react-icons';
import { Accordion } from '@/components/ui/accordion';
import { useWindowSize } from './utils';
import {
  MobileTransactionItem,
  MobileLoadingSkeleton,
  MobileEmptyState,
  MobileWalletNotConnectedState,
} from './mobile-components';
import {
  DesktopTransactionRow,
  SkeletonRow,
  EmptyState,
  WalletNotConnectedState,
} from './desktop-components';
import { useAccount } from 'wagmi';
import { TransactionTrackerDialog } from '../transaction-tracker';
import { useState } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { TransactionNormalized } from './transaction-history-adapter';
import { useSupportedChains } from '@/hooks/useSupportedChains';
import { TargetChain } from '@/types/chains';

/**
 * Transactions history table component
 *
 * This component displays transaction history in both desktop and mobile views.
 * It uses the useTransactions hook which transforms our backend data into the
 * TransactionResponse format required by the UI design.
 */
export default function TransactionsTable() {
  const { address } = useAccount();
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const { data: transactions, isLoading } = useTransactions(address);
  const [transactionToTrack, setTransactionToTrack] = useState<{
    id: string;
    type: 'reservation' | 'position' | 'liteforge-swap';
    txHash: string;
    targetChain?: TargetChain;
  } | null>(null);
  const [openTrackerDialog, setOpenTrackerDialog] = useState(false);
  const { isSupported } = useSupportedChains();

  const isWalletConnected = address !== undefined;

  const renderContent = () => {
    if (!isSupported) return null;

    // Render mobile view
    if (isMobile) {
      return (
        <div className="bg-card p-4 rounded-xl w-full max-w-[359px] mx-auto overflow-y-auto">
          {!isWalletConnected ? (
            <MobileWalletNotConnectedState />
          ) : isLoading ? (
            <div className="flex flex-col gap-3">
              <MobileLoadingSkeleton />
              <MobileLoadingSkeleton />
            </div>
          ) : transactions?.length > 0 ? (
            <Accordion
              type="single"
              collapsible
              className="flex flex-col gap-3"
            >
              {transactions.map((tx: TransactionNormalized, index) => (
                <MobileTransactionItem
                  key={tx.contractRegistrationTxHash}
                  tx={tx}
                  index={index}
                  setTransactionToTrack={setTransactionToTrack}
                  setOpenTrackerDialog={setOpenTrackerDialog}
                />
              ))}
            </Accordion>
          ) : (
            <MobileEmptyState />
          )}
        </div>
      );
    }

    // Render desktop table view
    return (
      <div className="bg-card p-6 rounded-xl overflow-visible w-full">
        <Table
          style={{
            borderCollapse: 'separate',
            borderSpacing: '0 8px',
            width: '100%',
          }}
        >
          <TableHeader className="border-none">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="py-3 px-2 text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap">
                <div className="flex flex-row gap-1">
                  <span>From</span>
                  <ArrowRightIcon />
                  <span>To</span>
                </div>
              </TableHead>
              <TableHead className="py-3 px-2 text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap">
                <div className="flex flex-col items-center">
                  <span>Contract</span>
                  <span>registration</span>
                </div>
              </TableHead>
              <TableHead className="py-3 px-2 text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap">
                <div className="flex flex-col items-end">
                  <span>Requested</span>
                  <span>amount</span>
                </div>
              </TableHead>
              <TableHead className="py-3 px-2 text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap">
                <div className="flex flex-col items-end">
                  <span>Received</span>
                  <span>amount</span>
                </div>
              </TableHead>
              <TableHead className="py-3 px-2 text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap">
                <div className="flex flex-col items-start">
                  <span>Origin</span>
                  <span>network TXID</span>
                </div>
              </TableHead>
              <TableHead className="py-3 px-2 text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap">
                <div className="flex flex-col items-start">
                  <span>Destination</span>
                  <span>network TXID</span>
                </div>
              </TableHead>
              <TableHead className="py-3 px-2 text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap">
                <span>Timestamp</span>
              </TableHead>
              <TableHead className="py-3 px-2 text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap">
                <span>Status</span>
              </TableHead>
              <TableHead className="py-3 px-2 text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap">
                <span></span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!isWalletConnected ? (
              <WalletNotConnectedState />
            ) : isLoading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : transactions?.length > 0 ? (
              transactions.map((tx: TransactionNormalized) => (
                <DesktopTransactionRow
                  key={tx.contractRegistrationTxHash}
                  tx={tx}
                  setTransactionToTrack={setTransactionToTrack}
                  setOpenTrackerDialog={setOpenTrackerDialog}
                />
              ))
            ) : (
              <EmptyState />
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <>
      {renderContent()}
      <TransactionTrackerDialog
        open={openTrackerDialog}
        onOpenChange={setOpenTrackerDialog}
        type={transactionToTrack?.type || 'reservation'}
        id={transactionToTrack?.id || ''}
        txHash={transactionToTrack?.txHash || ''}
        targetChain={transactionToTrack?.targetChain}
      />
    </>
  );
}
