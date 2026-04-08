import { useState, useEffect } from 'react';
import { TransferForm } from './transfer-form';
import { FeeCard } from './fee-card';
import { TermsSection } from './terms-section';
import { ConnectButton } from './connect-button';
import { Button } from '../ui/button';
import { isValidBitcoinAddress } from '@/lib/utils';
import { Network, Currency } from './types';
import { useChainId, useSwitchChain } from 'wagmi';
import { Address, parseEther } from 'viem';
import { useExchange } from '@/hooks/useExchange';
import { useLiteforgeSwap } from '@/hooks/useLiteforgeSwap';
import { ContractManager } from '@/services/ContractManager';
import { Reservation } from '@/types';
import { useMaxMinBtc } from '@/hooks/queries/useMaxMinBtc';
import { useBitSnarkBalance } from '@/hooks/useBitSnarkBalance';
import { useAccount } from 'wagmi';
import { useSupportedChains } from '@/hooks/useSupportedChains';
import { useToast } from '@/hooks/useToast';
import { TargetChain, ChainId } from '@/types/chains';
import { CONTRACTS_ADDRESS } from '@/constants/contracts';

interface TransferTabProps {
  onTransactionCreated: (
    type: 'position' | 'reservation' | 'liteforge-swap',
    id: string,
    txHash: string,
    targetChain?: TargetChain
  ) => void;
}

export function TransferTab({ onTransactionCreated }: TransferTabProps) {
  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [isLiteforgeMode, setIsLiteforgeMode] = useState(false);
  const [fromNetwork, setFromNetwork] = useState<Network>('bitcoin');
  const [toNetwork, setToNetwork] = useState<Network>('liteforge');
  const [fromCurrency, setFromCurrency] = useState<Currency>('btc');
  const [toCurrency, setToCurrency] = useState<Currency>('xbtc');
  const [isAnimating, setIsAnimating] = useState(false);
  const [fromAmount, setFromAmount] = useState('0');
  const [toAmount, setToAmount] = useState('0');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [bitcoinAddress, setBitcoinAddress] = useState<string | undefined>(undefined);
  const [estimatedGasFee, setEstimatedGasFee] = useState<number>(0);
  const { isSupported } = useSupportedChains();
  const {
    reservePosition,
    loading: exchangeLoading,
    error: exchangeError,
    estimateReservePositionGas,
    setError: setExchangeError,
  } = useExchange();
  const {
    swap: liteforgeSwap,
    loading: liteforgeLoading,
    error: liteforgeError,
    setError: setLiteforgeError,
  } = useLiteforgeSwap();
  const { data } = useMaxMinBtc();
  const maxBtc = data?.maxAmount || 0;
  const minBtc = data?.minAmount || 0;
  const { balance: xbtcAmount } = useBitSnarkBalance();
  const isWalletConnected = !!address;
  const { showError } = useToast();

  const loading = isLiteforgeMode ? liteforgeLoading : exchangeLoading;

  const handleDirectionChange = (mode: 'ltc-to-liteforge' | 'liteforge-to-ltc') => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      if (mode === 'ltc-to-liteforge') {
        setIsLiteforgeMode(false);
        setFromNetwork('bitcoin');
        setToNetwork('liteforge');
        setFromCurrency('btc');
        setToCurrency('xbtc');
      } else {
        setIsLiteforgeMode(true);
        setFromNetwork('liteforge');
        setToNetwork('bitcoin');
        setFromCurrency('xbtc');
        setToCurrency('btc');
      }
      setFromAmount('0');
      setToAmount('0');
      setBitcoinAddress(undefined);
      setTermsAccepted(false);
      setTimeout(() => setIsAnimating(false), 300);
    }, 300);
  };

  const updateGasEstimate = async () => {
    if (!address || !chainId || !fromAmount || fromAmount === '0' || isLiteforgeMode) {
      setEstimatedGasFee(0);
      return;
    }
    try {
      const normalizedAmount = fromAmount.replace(',', '.');
      const tokenAmount = parseEther(normalizedAmount);
      const gasFee = await estimateReservePositionGas({ tokenAmount, owner: address, chainId });
      setEstimatedGasFee(gasFee);
    } catch {
      setEstimatedGasFee(0);
    }
  };

  useEffect(() => {
    updateGasEstimate();
  }, [fromAmount, isLiteforgeMode, address, chainId]);

  useEffect(() => {
    if (exchangeError) {
      showError(exchangeError);
      setExchangeError(null);
    }
  }, [exchangeError, showError]);

  useEffect(() => {
    if (liteforgeError) {
      showError(liteforgeError);
      setLiteforgeError(null);
    }
  }, [liteforgeError, showError]);

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value);
    setToAmount(value);
  };

  const handleToAmountChange = (value: string) => {
    setToAmount(value);
  };

  const handleBridgeFunds = async () => {
    const normalizedAmount = fromAmount.replace(',', '.');
    const parsedAmount = parseEther(normalizedAmount);

    if (isLiteforgeMode) {
      await switchChain({ chainId: ChainId.LiteforgeTestnet });
      const cm = await ContractManager.getInstance();
      await cm.reinitialize();
      const result = await liteforgeSwap({ ltcAddress: bitcoinAddress!, amount: parsedAmount });
      if (result) {
        onTransactionCreated('liteforge-swap', result.txHash, result.txHash);
      }
      return;
    }

    // LTC → Liteforge: always use LiteforgeDepositor as receiving address
    const contracts = CONTRACTS_ADDRESS[chainId as keyof typeof CONTRACTS_ADDRESS];
    const evmReceivingAddress: Address =
      (contracts as { liteforgeDepositor?: string }).liteforgeDepositor as Address;

    const transaction = await reservePosition({
      tokenAmount: parsedAmount,
      evmReceivingAddress,
      chainId,
      owner: address!,
    });

    if (transaction) {
      onTransactionCreated(
        'reservation',
        (transaction as Reservation).reservationId,
        transaction.hash,
        'liteforge'
      );
    }
  };

  const isBitcoinAddressValid = !isLiteforgeMode || isValidBitcoinAddress(bitcoinAddress as string);

  const disabled =
    !termsAccepted ||
    loading ||
    (isLiteforgeMode && (!bitcoinAddress || !isBitcoinAddressValid)) ||
    (!isLiteforgeMode && (Number(fromAmount) < minBtc || Number(fromAmount) > maxBtc));

  const handleBridgeAndReset = async () => {
    await handleBridgeFunds();
    setFromAmount('0');
    setToAmount('0');
    setBitcoinAddress(undefined);
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
        isLiteforgeMode={isLiteforgeMode}
        onDirectionChange={handleDirectionChange}
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
            {isLiteforgeMode ? 'Swap to LTC' : 'Bridge to Liteforge'}
          </Button>
        )}
      </div>
    </>
  );
}
