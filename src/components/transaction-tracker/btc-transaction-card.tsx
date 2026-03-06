import { Card } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';
import EthLogo from '@/assets/eth-logo.png';
import LtcLogo from '@/assets/litecoin-logo.png';
import { CheckCircledIcon } from '@radix-ui/react-icons';
import { getExplorerUrl, truncateAddress } from '@/lib/utils';
import { InfoField } from './info-field';
import { formatConfirmations } from '@/utils/format';

export interface BtcTransactionCardProps {
  data: {
    amount: string;
    fiatAmount: string;
    recipientAddress?: string;
    reservationTx?: string;
    txid?: string;
    confirmations?: number;
    maxConfirmations?: number;
  };
  isStepThree?: boolean;
}

export function BtcTransactionCard({
  data,
  isStepThree = false,
}: BtcTransactionCardProps) {
  const renderConfirmations = () => {
      return (
        <div className="flex items-center justify-center gap-1">
          <span className="text-white text-[12px] font-medium">
            {formatConfirmations(data.confirmations || 0)}
          </span>
          {Number(data?.confirmations) >= Number(data?.maxConfirmations) ? (
            <CheckCircledIcon className="text-green-600 w-4 h-4" />
          ) : (
            <RefreshCw className="text-foreground w-4 h-4 animate-[spin_2s_linear_infinite]" />
          )}
        </div>
      );

  };

  const renderAmount = () => (
    <span className="text-white text-[14px] md:text-[16px] font-medium" data-testid="btc-amount">
      {isStepThree ? data.amount : `~${data.amount}`} LTC
    </span>
  );

  const renderAddress = () => (
    <span className="text-[#FFAA2E] text-[10px] md:text-xs cursor-pointer max-w-[180px] md:max-w-[250px]">
      <a href={`${getExplorerUrl(data.recipientAddress)}/address/${data.recipientAddress}`} target="_blank">
        {data.recipientAddress && truncateAddress(data.recipientAddress)}
      </a>
    </span>
  );

  const renderReservationTx = () => (
    <div className="flex items-center">
      <img src={EthLogo} alt="Ethereum Logo" className="w-4 h-4 inline mr-1" />
      <span className="text-[#FFAA2E] text-[10px] md:text-xs cursor-pointer max-w-[180px] md:max-w-[250px] pt-0.5">
        <a href={`${getExplorerUrl(data.reservationTx)}/tx/${data.reservationTx}`} target="_blank">
          {data.reservationTx && truncateAddress(data.reservationTx)}
        </a>
      </span>
    </div>
  );

  const renderTxid = () => (
    <span className="text-[#FFAA2E] text-[10px] md:text-xs truncate max-w-[180px] md:max-w-[250px]">
      <img src={LtcLogo} alt="LTC Logo" className="w-4 h-4 inline mr-1" />
      <a href={`${getExplorerUrl(data.txid)}/tx/${data.txid}`} target="_blank" data-testid="btc-txid">
        {data.txid && truncateAddress(data.txid)}
      </a>
    </span>
  );

  if (!isStepThree) {
    return (
      <Card className="mt-4 w-full bg-[#100D16] rounded-xl p-3 md:p-4 border-none gap-0.5 overflow-hidden">
        <InfoField label="Amount" value={renderAmount()} />
        <InfoField label="Recipient address" value={renderAddress()} />
        <InfoField label="Reservation TX" value={renderReservationTx()} />
        <InfoField label="Confirmations" value={renderConfirmations()} />
      </Card>
    );
  }

  return (
    <Card className="mt-4 w-full bg-[#100D16] rounded-xl p-3 md:p-4 border-none gap-0.5 overflow-hidden">
      <InfoField label="Amount" value={renderAmount()} />
      <InfoField label="TXID" value={renderTxid()} />
      <InfoField
        label="Confirmations"
        value={
          <span className="text-white text-[12px] font-medium">
            {renderConfirmations()}
          </span>
        }
      />
    </Card>
  );
}
