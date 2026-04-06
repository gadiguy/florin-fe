import { Card } from '../ui/card';
import { CheckCircledIcon } from '@radix-ui/react-icons';
import { getExplorerUrl, truncateAddress } from '@/lib/utils';
import litecoinLogo from '@/assets/litecoin-logo.png';
import ethLogo from '@/assets/eth-logo.png';
import { formatConfirmations } from '@/utils/format';

export interface EthCompletionCardProps {
  amount: string;
  recipientAddress: string;
  reservationTx: string;
  confirmations?: number;
  type?: 'position' | 'reservation';
}

export function EthCompletionCard({
  amount,
  recipientAddress,
  reservationTx,
  confirmations = 20,
  type = 'reservation',
}: EthCompletionCardProps) {
  const logoSrc = type === 'position' ? litecoinLogo : ethLogo;

  return (
    <Card className="mt-4 w-full bg-[#100D16] rounded-xl p-3 md:p-4 border-none gap-0.5 overflow-hidden">
      <div className="flex flex-col justify-between items-center gap-2">
        <div className="flex items-center gap-2 w-full p-3 rounded-xl bg-grey">
          <CheckCircledIcon className="w-4 h-4 text-green-500" />
          <span className="text-white text-[14px] md:text-[16px] font-medium">
            Transfer is successfully completed
          </span>
        </div>
        <div className="flex justify-between items-center w-full">
          <span className="text-[#888888] text-[13px]">Amount</span>
          <span className="text-white text-[14px] md:text-[16px] font-medium">
            {amount} zkLTC
          </span>
        </div>
      </div>
      <div className="flex justify-between items-center w-full">
        <span className="text-[#888888] text-[13px]">Recipient address</span>
        <span className="text-[#FFAA2E] text-[12px] font-medium">
          <a href={`${getExplorerUrl(recipientAddress)}/address/${recipientAddress}`} target="_blank">
            {truncateAddress(recipientAddress)}
          </a>
        </span>
      </div>
      <div className="flex justify-between items-center w-full">
        <span className="text-[#888888] text-[13px]">TXID</span>
        <span className="text-[#FFAA2E] text-[12px] font-medium cursor-pointer flex items-center gap-1">
          <img
            src={logoSrc}
            alt={type === 'position' ? 'LTC' : 'zkLTC'}
            className="w-4 h-4 inline"
          />
          <a href={`${getExplorerUrl(reservationTx)}/tx/${reservationTx}`} target="_blank">
            {truncateAddress(reservationTx)}
          </a>
        </span>
      </div>
      <div className="flex justify-between items-center w-full">
        <span className="text-[#888888] text-[13px]">Confirmations</span>
        <div className="flex items-center gap-2">
          <span className="text-white text-[13px] font-medium">
            {formatConfirmations(confirmations || 0)}
          </span>
          <CheckCircledIcon className="w-4 h-4 text-green-500" />
        </div>
      </div>
    </Card>
  );
}
