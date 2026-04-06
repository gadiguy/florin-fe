import { Card } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';
import EthLogo from '@/assets/eth-logo.png';
import { CheckCircledIcon } from '@radix-ui/react-icons';
import { getExplorerUrl, truncateAddress } from '@/lib/utils';
import { formatConfirmations } from '@/utils/format';
import { InfoField } from './info-field';

export interface EthTransactionCardProps {
  data: {
    amount: string;
    fiatAmount: string;
    recipientAddress?: string;
    reservationTx?: string;
    txid?: string;
    confirmations: number;
    maxConfirmations: number;
  };
  isStepThree?: boolean;
}

export function EthTransactionCard({
  data,
  isStepThree = false,
}: EthTransactionCardProps) {
  const renderConfirmations = () => (
    <div className="flex items-center justify-center gap-1">
      <span className="text-white text-[12px] font-medium">
        {formatConfirmations(data.confirmations || 0)}
      </span>
      {data.confirmations && Number(data.confirmations) >= data.maxConfirmations ? (
        <CheckCircledIcon className="text-green-600 w-4 h-4" />
      ) : (
        <RefreshCw className="text-foreground w-4 h-4 animate-[spin_2s_linear_infinite]" />
      )}
    </div>
  );

  const renderAmount = () => (
    <span className="text-white text-[14px] md:text-[16px] font-medium">
      {isStepThree ? data.amount : `~${data.amount}`} zkLTC
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

  return (
    <Card className="mt-4 w-full bg-[#100D16] rounded-xl p-3 md:p-4 border-none gap-0.5 overflow-hidden">
      <InfoField label="Amount" value={renderAmount()} />
      <InfoField label="Recipient address" value={renderAddress()} />
      <InfoField label="Reservation TX" value={renderReservationTx()} />
      <InfoField label="Confirmations" value={renderConfirmations()} />
    </Card>
  );
}
