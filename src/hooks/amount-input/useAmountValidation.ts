import { CURRENCY_SYMBOLS } from '@/constants/assets';

interface UseAmountValidationProps {
  currency: 'btc' | 'eth' | 'xbtc';
  maxBtc?: number;
  minBtc?: number;
  isFromXbtcToBtc?: boolean;
  xbtcAmount?: string;
}

export const useAmountValidation = ({
  currency,
  maxBtc,
  minBtc,
  isFromXbtcToBtc,
  xbtcAmount,
}: UseAmountValidationProps) => {
  const validateAmount = (value: string, numValue: number): { error: string | null; validValue: string } => {
    const currencySymbol = CURRENCY_SYMBOLS[currency];

    if (isFromXbtcToBtc && xbtcAmount && numValue > Number(xbtcAmount)) {
      return { error: `Maximum value: ${xbtcAmount} zkLTC`, validValue: value };
    }
    if (maxBtc && numValue > Number(maxBtc)) {
      return { error: `Maximum value: ${maxBtc} ${currencySymbol}`, validValue: value };
    }
    if (minBtc && numValue !== 0 && numValue < Number(minBtc)) {
      return { error: `Minimum value: ${minBtc} ${currencySymbol}`, validValue: value };
    }
    return { error: null, validValue: value };
  };

  return {
    validateAmount,
  };
}; 