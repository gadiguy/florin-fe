import { useState, useEffect } from 'react';
import { TransferForm } from './transfer-form';
import { FeeCard } from './fee-card';
import { TermsSection } from './terms-section';
import { ConnectButton } from './connect-button';
import { Button } from '../ui/button';
import { isValidBitcoinAddress } from '@/lib/utils';
import { Network, Currency } from './types';
import { useChainId } from 'wagmi';
import { Address, parseEther } from 'viem';
import { useExchange } from '@/hooks/useExchange';
import { Position, Reservation } from '@/types';
import { useMaxMinBtc } from '@/hooks/queries/useMaxMinBtc';
import { useBitSnarkBalance } from '@/hooks/useBitSnarkBalance';
import { useAccount } from 'wagmi';
import { useSupportedChains } from '@/hooks/useSupportedChains';
import { useToast } from '@/hooks/useToast';

interface TransferTabProps {
  onTransactionCreated: (
    type: 'position' | 'reservation',
    id: string,
    txHash: string
  ) => void;
}

export function TransferTab({ onTransactionCreated }: TransferTabProps) {
  const { address } = useAccount();
  const chainId = useChainId();
  const [fromNetwork, setFromNetwork] = useState<Network>('bitcoin');
  const [toNetwork, setToNetwork] = useState<Network>('ethereum');
  const [fromCurrency, setFromCurrency] = useState<Currency>(
    fromNetwork === 'bitcoin' ? 'btc' : 'eth'
  );
  const [toCurrency, setToCurrency] = useState<Currency>(
    toNetwork === 'bitcoin' ? 'btc' : 'xbtc'
  );
  const [isAnimating, setIsAnimating] = useState(false);
  const [fromAmount, setFromAmount] = useState('0');
  const [toAmount, setToAmount] = useState('0');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [bitcoinAddress, setBitcoinAddress] = useState<string | undefined>(
    undefined
  );
  const [estimatedGasFee, setEstimatedGasFee] = useState<number>(0);
  const { isSupported } = useSupportedChains();
  const {
    openPosition,
    reservePosition,
    loading,
    error,
    estimateOpenPositionGas,
    estimateReservePositionGas,
    setError,
  } = useExchange();
  const { data } = useMaxMinBtc();
  const maxBtc = data?.maxAmount || 0;
  const minBtc = data?.minAmount || 0;
  const { balance: xbtcAmount } = useBitSnarkBalance();
  const isWalletConnected = !!address;
  const { showError } = useToast();

  const updateGasEstimate = async () => {
    if (
      !address ||
      !chainId ||
      !fromAmount ||
      fromAmount === '0'
    ) {
      setEstimatedGasFee(0);
      return;
    }

    try {
      const normalizedAmount = fromAmount.replace(',', '.');
      const tokenAmount = parseEther(normalizedAmount);

      const gasFee =
        fromNetwork === 'bitcoin'
          ? await estimateReservePositionGas({
              tokenAmount,
              owner: address,
              chainId,
            })
          : await estimateOpenPositionGas();

      setEstimatedGasFee(gasFee);
    } catch (error) {
      console.error('Error updating gas estimate:', error);
      setEstimatedGasFee(0);
    }
  };

  useEffect(() => {
    updateGasEstimate();
  }, [fromAmount, fromNetwork, bitcoinAddress, address, chainId, toAmount]);

  useEffect(() => {
    if (error) {
      showError(error);
      setError(null);
    }
  }, [error, showError]);

  const handleSwitchNetworks = () => {
    if (isAnimating) return;

    setIsAnimating(true);

    setTimeout(() => {
      setFromNetwork(toNetwork);
      setToNetwork(fromNetwork);
      setFromCurrency(toCurrency);
      setToCurrency(fromCurrency);

      const tempAmount = fromAmount;
      setFromAmount(toAmount);
      setToAmount(tempAmount);

      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    }, 300);
  };

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value);
    setToAmount(value);
  };

  const handleToAmountChange = (value: string) => {
    setToAmount(value);
    if (fromCurrency === 'xbtc' && toCurrency === 'btc') {
      setFromAmount(value);
    }
  };

  const handleBridgeFunds = async () => {
    const normalizedAmount = fromAmount.replace(',', '.');
    const parsedAmount = parseEther(normalizedAmount);
    let transaction: Position | Reservation | undefined;
    if (fromNetwork === 'bitcoin') {
      transaction = await reservePosition({
        tokenAmount: parsedAmount,
        evmReceivingAddress: address!,
        chainId,
        owner: address!,
      });
    } else {
      transaction = await openPosition({
        tokenAmount: parsedAmount,
        exchangeRate: 1,
        bitcoinAddresses: bitcoinAddress! as Address,
        deadline: Math.floor(Date.now() / 1000) + 3600,
        owner: address!,
        chainId,
      });
    }
    if (transaction) {
      onTransactionCreated(
        fromNetwork === 'ethereum' ? 'position' : 'reservation',
        fromNetwork === 'ethereum'
          ? (transaction as Position)?.positionId
          : (transaction as Reservation)?.reservationId,
        transaction.hash
      );
    }
  };

  const isBitcoinAddressValid =
    fromNetwork === 'ethereum' && toCurrency === 'btc'
      ? isValidBitcoinAddress(bitcoinAddress as string)
      : true;

  const disabled =
    !termsAccepted ||
    loading ||
    (fromNetwork === 'ethereum' &&
      (!bitcoinAddress || !isBitcoinAddressValid)) ||
    Number(fromAmount) < minBtc ||
    Number(fromAmount) > maxBtc;

  const handleBridgeAndReset = async () => {
    await handleBridgeFunds();
    // Reset form after bridge operation
    handleFromAmountChange('');
    handleToAmountChange('');
    if (fromNetwork === 'ethereum') {
      setBitcoinAddress('');
    }
    setTermsAccepted(false);
  };

  return (
    <>
      <TransferForm
        fromNetwork={fromNetwork}
        toNetwork={toNetwork}
        fromCurrency={fromCurrency}
        toCurrency={toCurrency}
        fromAmount={fromAmount}
        toAmount={toAmount}
        xbtcAmount={xbtcAmount.toString()}
        isAnimating={isAnimating}
        isWalletConnected={isWalletConnected}
        ethWalletAddress={address}
        bitcoinAddress={bitcoinAddress}
        bitcoinAddressValid={isBitcoinAddressValid}
        handleSwitchNetworks={handleSwitchNetworks}
        handleFromAmountChange={handleFromAmountChange}
        handleToAmountChange={handleToAmountChange}
        setBitcoinAddress={setBitcoinAddress}
        maxBtc={maxBtc}
        minBtc={minBtc}
      />
      <FeeCard
        toCurrency={toCurrency}
        isAnimating={isAnimating}
        amount={fromAmount}
        gasFee={estimatedGasFee}
      />
      {isWalletConnected && (
        <TermsSection
          termsAccepted={termsAccepted}
          setTermsAccepted={setTermsAccepted}
          toNetwork={toNetwork}
          isAnimating={isAnimating}
        />
      )}
      <div className="flex justify-center mt-5">
        <ConnectButton
          isWalletConnected={isWalletConnected}
          isAnimating={isAnimating}
          isSupported={isSupported}
        />
        {isWalletConnected && isSupported && (
          <Button
            onClick={handleBridgeAndReset}
            isAnimating={isAnimating}
            variant="orange"
            size="custom"
            disabled={disabled}
            loading={loading}
          >
            {'Bridge funds'}
          </Button>
        )}
      </div>
    </>
  );
}
