import { useState } from 'react';
import { TabSwitcher } from '@/components/ui/tab-switcher';
import { TransferTab } from './transfer-tab';
import { HistoryTab } from '@/components/history-table/history-tab';
import { TransactionTrackerDialog } from '../transaction-tracker';

export function TabSwitcherContainer() {
  const [activeTab, setActiveTab] = useState(0);
  const [trackerData, setTrackerData] = useState<{
    type: 'position' | 'reservation';
    open: boolean;
    transactionId: string;
    txHash: string;
  }>({
    type: 'position',
    open: false,
    transactionId: '',
    txHash: '',
  });

  const tabs = ['Transfer', 'History'];
  const variant = 'default' as const;
  const size = 'default' as const;

  return (
    <div className="flex flex-col items-center justify-center pb-10">
      <TabSwitcher
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant={variant}
        size={size}
        className="gap-2.5 bg-[#100D16] border-none"
      />
      <TransactionTrackerDialog
        key={trackerData.transactionId}
        open={trackerData.open}
        onOpenChange={(open) => {
          setTrackerData((prev) => ({ ...prev, open }));
        }}
        type={trackerData.type}
        id={trackerData.transactionId}
        txHash={trackerData.txHash}
      />
      <div className="my-3">
        {activeTab === 0 ? (
          <TransferTab 
            onTransactionCreated={(type, id, txHash) => {
              console.log('[onTransactionCreated] type:', type, 'id:', id, 'txHash:', txHash);
              setTrackerData({
                type,
                open: true,
                transactionId: id,
                txHash,
              });
            }}
          />
        ) : (
          <HistoryTab />
        )}
      </div>
    </div>
  );
}
