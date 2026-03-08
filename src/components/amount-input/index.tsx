import { Card } from '../ui/card';
import { cn } from '@/lib/utils';
import { ASSETS, CURRENCY_SYMBOLS } from '@/constants/assets';
import { useAmountInput } from '@/hooks/amount-input/useAmountInput';
import { AmountInputHeader } from './amount-input-header';

interface AmountInputProps {
  network: 'bitcoin' | 'ethereum';
  currency: 'btc' | 'eth' | 'xbtc';
  amount: string;
  xbtcAmount?: string;
  onAmountChange?: (value: string) => void;
  readOnly?: boolean;
  maxBtc?: number;
  minBtc?: number;
  bitcoinPrice?: number;
  isFromXbtcToBtc?: boolean;
}

export const AmountInput = ({
  network,
  currency,
  amount,
  xbtcAmount,
  onAmountChange,
  readOnly,
  maxBtc,
  minBtc,
  bitcoinPrice,
  isFromXbtcToBtc,
}: AmountInputProps) => {
  const { errorMessage, handleAmountChange } = useAmountInput({
    amount,
    currency,
    maxBtc,
    minBtc,
    bitcoinPrice,
    isFromXbtcToBtc,
    xbtcAmount,
    onAmountChange,
  });

  const logoSrc = ASSETS.CURRENCY_LOGOS[currency];
  const currencySymbol = CURRENCY_SYMBOLS[currency];

  const currencyBgColor = cn({
    'bg-bitcoin-bg': currency === 'btc',
    'bg-transparent': currency === 'xbtc',
    'bg-ethereum-bg': currency === 'eth'
  });

  const cardBgClass = cn({
    'bg-[var(--card-ethereum-bg)]': network === 'ethereum',
    'bg-[var(--card-bitcoin-bg)]': network === 'bitcoin'
  });

  const cardBorderClass =
    network === 'ethereum' ? 'border border-input-border' : 'border-none';

  const xbtcCardClass =
    currency === 'xbtc' ? 'bg-[#2A273080] border border-[#27292C]' : '';

  const normalizedAmount = amount.replace(',', '.');
  return (
    <Card
      className={cn(
        'w-full max-w-[408px] h-auto min-h-[116px] p-[10px_16px_16px_16px] rounded-2xl shadow-sm mb-0',
        cardBgClass,
        cardBorderClass,
        xbtcCardClass
      )}
    >
      <div className="flex flex-col justify-between h-full gap-2.5">
        <AmountInputHeader
          network={network}
          currency={currency}
          xbtcAmount={xbtcAmount}
        />

        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div
                className={cn(
                  'w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center overflow-hidden',
                  currencyBgColor
                )}
              >
                <img
                  src={logoSrc}
                  alt={currency}
                  className="w-[100%] h-[100%] object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span
                  className={`text-text-primary text-xl sm:text-2xl font-bold ${
                    currency === 'xbtc' ? 'opacity-50 text-gray-400' : ''
                  }`}
                >
                  {currencySymbol}
                </span>
              </div>
            </div>
            {network === 'bitcoin' && (
              <span className="font-inter font-normal text-[11px] sm:text-[13px] leading-[100%] tracking-[0%] text-label-text whitespace-nowrap">
                min {minBtc} {currencySymbol} / max {maxBtc} {currencySymbol}
              </span>
            )}
          </div>

          <div className="flex flex-col items-end">
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9]*[.]?[0-9]*"
              value={normalizedAmount}
              onChange={handleAmountChange}
              className={cn(
                'text-text-primary text-2xl sm:text-3xl font-bold bg-transparent border-none outline-none text-right w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                readOnly && 'text-text-secondary'
              )}
              placeholder="0.000"
              readOnly={readOnly}
              disabled={readOnly}
            />
            {errorMessage && !readOnly && (
              <span className="font-inter font-normal text-[11px] sm:text-[12px] leading-[100%] tracking-[0%] text-right text-red-500 mt-1">
                {errorMessage}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
