import { ASSETS, NETWORK_NAMES } from '@/constants/assets';
import walletIcon from '@/assets/wallet-icon.svg';
import { cn } from '@/lib/utils';

interface AmountInputHeaderProps {
  network: 'bitcoin' | 'ethereum';
  currency: 'btc' | 'eth' | 'xbtc';
  xbtcAmount?: string;
}

export const AmountInputHeader = ({
  network,
  currency,
  xbtcAmount,
}: AmountInputHeaderProps) => {
  const networkLogoSrc = ASSETS.NETWORK_LOGOS[network];
  const bgColor = network === 'bitcoin' ? 'bg-bitcoin-bg' : 'bg-ethereum-bg';

  const formattedAmount = xbtcAmount 
    ? Number(xbtcAmount).toLocaleString('en-US', {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      })
    : '0';

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="text-label-text font-inter font-medium text-xs sm:text-[13px] leading-[100%] tracking-[0%]">
          {network === 'bitcoin' ? 'From' : 'To'}
        </span>
        <div className="flex items-center gap-1 sm:gap-2">
          <div
            className={cn(
              'w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center overflow-hidden',
              bgColor
            )}
          >
            <img
              src={networkLogoSrc}
              alt={network}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-text-primary font-inter font-medium text-xs sm:text-[14px] leading-tight sm:leading-[20px] tracking-[0%] align-middle">
            {NETWORK_NAMES[network]}
          </span>
        </div>
      </div>

      {network === 'ethereum' && (
        <div className="flex items-center gap-1 sm:gap-2">
          <img
            src={walletIcon}
            alt="Wallet"
            className="w-4 h-4 sm:w-5 sm:h-5"
          />
          <span
            className={`text-text-primary font-medium text-xs sm:text-[14px] ${
              currency === 'xbtc' ? 'opacity-50 text-gray-400' : ''
            }`}
          >
            {formattedAmount} xLTC
          </span>
        </div>
      )}
    </div>
  );
}; 