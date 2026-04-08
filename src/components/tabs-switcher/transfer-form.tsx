import { AmountInput } from '@/components/amount-input';
import { Input } from '@/components/ui/input';
import { Label } from '@radix-ui/react-label';
import { cn } from '@/lib/utils';
import { Address } from 'viem';
import { useBitcoinPrice } from '@/hooks/useBitcoinPrice';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { Network } from './types';

interface TransferFormProps {
  fromNetwork: Network;
  toNetwork: Network;
  fromCurrency: 'btc' | 'eth' | 'xbtc';
  toCurrency: 'btc' | 'eth' | 'xbtc';
  fromAmount: string;
  toAmount: string;
  xbtcAmount: string;
  isAnimating: boolean;
  isWalletConnected: boolean;
  ethWalletAddress?: Address;
  bitcoinAddress?: string;
  bitcoinAddressValid?: boolean;
  isLiteforgeMode: boolean;
  onDirectionChange: (mode: 'ltc-to-liteforge' | 'liteforge-to-ltc') => void;
  handleFromAmountChange: (value: string) => void;
  handleToAmountChange: (value: string) => void;
  setBitcoinAddress: (value: Address | undefined) => void;
  maxBtc: number;
  minBtc: number;
}

export function TransferForm({
  fromNetwork,
  toNetwork,
  fromCurrency,
  toCurrency,
  fromAmount,
  toAmount,
  xbtcAmount,
  isAnimating,
  isWalletConnected,
  ethWalletAddress,
  bitcoinAddress,
  bitcoinAddressValid = true,
  isLiteforgeMode,
  onDirectionChange,
  handleFromAmountChange,
  handleToAmountChange,
  setBitcoinAddress,
  maxBtc,
  minBtc,
}: TransferFormProps) {
  const { data: bitcoinPrice } = useBitcoinPrice();
  const isFromXbtcToBtc = fromCurrency === 'xbtc' && toCurrency === 'btc';

  return (
    <div
      className={`flex flex-col items-center bg-[#100D16] w-full sm:w-[400px] md:w-[440px] py-5 px-4 rounded-xl transition-all duration-300 ease-in-out`}
    >
      {/* Direction selector */}
      <div className="flex w-full gap-2 mb-5">
        <button
          type="button"
          onClick={() => onDirectionChange('ltc-to-liteforge')}
          className={cn(
            'flex-1 h-[42px] rounded-[10px] text-[13px] font-semibold transition-colors',
            !isLiteforgeMode
              ? 'bg-[#FFAA2E] text-black'
              : 'bg-grey border border-input-border text-text-secondary hover:bg-gray-700'
          )}
        >
          LTC → zkLTC
        </button>
        <button
          type="button"
          onClick={() => onDirectionChange('liteforge-to-ltc')}
          className={cn(
            'flex-1 h-[42px] rounded-[10px] text-[13px] font-semibold transition-colors',
            isLiteforgeMode
              ? 'bg-[#FFAA2E] text-black'
              : 'bg-grey border border-input-border text-text-secondary hover:bg-gray-700'
          )}
        >
          zkLTC → LTC
        </button>
      </div>

      <div
        className={`w-full transition-all duration-300 ease-in-out ${
          isAnimating
            ? 'opacity-0 transform -translate-y-10'
            : 'opacity-100 transform translate-y-0'
        }`}
      >
        <AmountInput
          network={fromNetwork}
          currency={fromCurrency}
          amount={fromAmount}
          xbtcAmount={xbtcAmount}
          onAmountChange={handleFromAmountChange}
          maxBtc={maxBtc}
          minBtc={minBtc}
          bitcoinPrice={bitcoinPrice?.bitcoin.usd || 0}
          readOnly={false}
        />
      </div>

      <div className="flex justify-center items-center h-8 my-1">
        <span className="text-text-secondary text-lg">↓</span>
      </div>

      <div
        className={`w-full transition-all duration-300 ease-in-out ${
          isAnimating
            ? 'opacity-0 transform translate-y-10'
            : 'opacity-100 transform translate-y-0'
        }`}
      >
        <AmountInput
          network={toNetwork}
          currency={toCurrency}
          amount={toAmount}
          xbtcAmount={xbtcAmount}
          onAmountChange={handleToAmountChange}
          readOnly={true}
          isFromXbtcToBtc={isFromXbtcToBtc}
          maxBtc={maxBtc}
          minBtc={minBtc}
          bitcoinPrice={bitcoinPrice?.bitcoin.usd || 0}
        />
      </div>

      {/* Ethereum sending address — only in LTC → Liteforge mode */}
      {!isLiteforgeMode && (
        <div
          className={cn(
            'flex flex-col gap-1.5 w-full mt-3 transition-all duration-300 ease-in-out',
            isAnimating ? 'opacity-0' : 'opacity-100'
          )}
        >
          <Label
            htmlFor="wallet-address"
            className="text-xs text-text-secondary font-bold flex flex-row gap-1"
          >
            Ethereum sending address
            <InfoTooltip
              message="The sending amount is calculated in LTC. Ethereum token X, Y, Z can be used for transfer"
              position="top"
            />
          </Label>
          <Input
            id="wallet-address"
            disabled={true}
            placeholder={
              isWalletConnected ? ethWalletAddress : 'Connect your wallet first'
            }
          />
        </div>
      )}

      {/* LTC receiving address — only needed when receiving LTC (Liteforge → LTC) */}
      {isLiteforgeMode && <div
        className={cn(
          'flex flex-col gap-1.5 w-full mt-3 transition-all duration-300 ease-in-out',
          isAnimating ? 'opacity-0' : 'opacity-100'
        )}
      >
        <Label
          htmlFor="bitcoin-address"
          className="text-xs text-text-secondary font-bold flex flex-row gap-1"
        >
          Litecoin receiving address
          <InfoTooltip
            message="Enter the P2WPKH Litecoin address where you want to receive your LTC."
            position="top"
          />
        </Label>
        <Input
          id="bitcoin-address"
          placeholder="Paste your Litecoin receiving address"
          value={bitcoinAddress || ''}
          onChange={(e) => setBitcoinAddress(e.target.value as Address)}
          errorMessage={
            bitcoinAddress && !bitcoinAddressValid
              ? 'Invalid Litecoin address'
              : undefined
          }
          className={cn(
            bitcoinAddress &&
              !bitcoinAddressValid &&
              'border-red-400 focus-visible:ring-red-400'
          )}
        />
      </div>}
    </div>
  );
}
