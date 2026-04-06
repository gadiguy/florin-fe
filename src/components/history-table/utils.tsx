import { useEffect, useState } from 'react';
import litecoinLogo from '@/assets/litecoin-logo.png';
import ethLogo from '@/assets/eth-logo.png';

// Formatter for hash display
export function formatHash(hash: string = '') {
  return hash.slice(0, 6) + '...' + hash.slice(-4);
}

// Helper function to get chain logo
export function getChainLogo(chain: string): string | undefined {
  switch (chain.toLowerCase()) {
    case 'litecoin':
      return litecoinLogo;
    case 'ethereum':
      return ethLogo;
    default:
      return undefined;
  }
}

// Date formatter function
export function formatDate(dateString: string): string {
  return new Date(dateString)
    .toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    .replace(',', '');
}

// Format receivedAmount based on minAmount
export function formatReceivedAmount(
  receivedAmount: string | undefined,
  minAmount: number | undefined
): string {
  if (!receivedAmount) return '0';
  if (minAmount === undefined) return receivedAmount;

  // Convert to number for comparison
  const receivedAmountNum = parseFloat(receivedAmount);
  const minAmountNum = minAmount;

  // If receivedAmount is less than minAmount, return minAmount
  if (receivedAmountNum < minAmountNum) {
    return minAmountNum.toString();
  }

  // Otherwise, format to the same precision as minAmount
  const minAmountStr = minAmountNum.toString();
  const decimalPlaces = minAmountStr.includes('.')
    ? minAmountStr.split('.')[1].length
    : 0;

  return receivedAmountNum.toFixed(decimalPlaces);
}

// Custom hook to detect window size
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
      });
    }

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}
