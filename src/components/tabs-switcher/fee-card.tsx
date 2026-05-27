import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { InfoTooltip } from '@/components/ui/info-tooltip';

interface FeeCardProps {
  toCurrency: 'btc' | 'eth' | 'xbtc';
  isAnimating: boolean;
  amount: string;
  gasFee: number;
}

export function FeeCard({ toCurrency, isAnimating, amount, gasFee }: FeeCardProps) {
  const amountNumber = parseFloat(amount) || 0;
  const receiveAmount = Math.max(0, amountNumber).toFixed(6);

  // When the relayer is active users pay no ETH gas; hide the network fee row.
  const relayerActive = !!import.meta.env.VITE_RELAYER_URL;

  return (
    <Card
      className={cn(
        'bg-[#100D16] border-none w-full sm:w-[400px] md:w-[440px] py-5 px-4 rounded-xl mt-3 transition-all duration-300 ease-in-out',
        isAnimating ? 'opacity-0' : 'opacity-100'
      )}
    >
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1 text-text-secondary text-[13px]">
            You'll receive
            <InfoTooltip
              message={`You'll receive the ${toCurrency === 'btc' ? 'BTC' : 'zkLTC'} you sent, minus the network fee.`}
              position="top"
              align="center"
            />
          </div>
          <div className="text-white text-right text-[13px]">
            {receiveAmount} {toCurrency === 'btc' ? 'BTC' : 'zkLTC'}
          </div>
        </div>
        {!relayerActive && (
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1 text-text-secondary text-[13px]">
              Network fee
              <InfoTooltip
                message="The cost of gas to fund your transaction, paid in ETH. This fee may vary, and is estimated at the moment of your transaction."
                position="top"
                align="center"
              />
            </div>
            <div className="text-white text-right text-[13px]">~{gasFee} ETH</div>
          </div>
        )}
        <div className="flex justify-between items-center">
          <div className="text-text-secondary text-[13px]">Bridge fee</div>
          <div className="text-white text-right text-[13px]">free</div>
        </div>
      </div>
    </Card>
  );
}
