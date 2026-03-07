import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { CopyIcon } from '@radix-ui/react-icons';
import { EyeIcon } from './eye-icon';
import { QRCode } from './qr-code';
import { getExplorerUrl, truncateAddress } from '@/lib/utils';

interface AddressRevealProps {
  amount: string;
  address: string;
  timeLeft: {
    hours: number;
    minutes: number;
    seconds: number;
  };
  progress: number;
  isReadyToSend?: boolean;
}

// Hook for checking if screen matches a media query
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

export function AddressReveal({
  amount,
  address,
  timeLeft,
  progress,
  isReadyToSend,
}: AddressRevealProps) {
  const [showAddress, setShowAddress] = useState(isReadyToSend || false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  useEffect(() => {
    if (isReadyToSend) {
      setShowAddress(true);
    }
  }, [isReadyToSend]);

  // Handle copy address to clipboard
  const copyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  // Handle copy amount to clipboard
  const copyAmountToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(amount);
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  return (
    <Card
      className={`w-full p-3 cursor-pointer border-none bg-[#2A2730] flex flex-col items-center justify-center gap-2 ${
        !showAddress
          ? 'h-[100px] md:h-[116px] justify-center'
          : 'h-[270px] md:h-[290px]'
      }`}
      onClick={() => {
        if (isReadyToSend) return;

        setShowAddress(!showAddress);
      }}
    >
      <>
        {!showAddress ? (
          <>
            <span className="mr-2 text-[#939097] text-[12px] md:text-[13px]">
              Show the address
            </span>
            <div className="w-[50px] h-[50px] md:w-[57px] md:h-[57px] bg-[#1E1C21] flex items-center justify-center rounded-lg">
              <EyeIcon />
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between items-center w-full">
              <span className="text-[#888888] text-[11px] md:text-[13px]">
                Amount
              </span>
              <div className="flex items-center gap-1 md:gap-2">
                <span className="text-white text-[11px] md:text-[13px]">
                  ~{amount} LTC
                </span>
                <div
                  className="cursor-pointer flex items-center justify-center w-[30px] h-[30px] md:w-[33px] md:h-[35px] rounded-lg bg-[#3A3740]"
                  onClick={copyAmountToClipboard}
                >
                  <CopyIcon
                    className={`w-3 h-3 md:w-4 md:h-4 ${copiedAmount ? 'text-green-500' : 'text-white'}`}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center w-full">
              <span className="text-[#888888] text-[11px] md:text-[13px]">
                Litecoin address
              </span>
              <div className="flex items-center gap-1 md:gap-2">
                <span className="text-[#FFAA2E] text-[10px] md:text-[13px] truncate max-w-[100px] md:max-w-none">
                  <a href={`${getExplorerUrl(address)}/address/${address}`} target="_blank">
                    {isDesktop ? truncateAddress(address) : address}
                  </a>
                </span>
                <div
                  className="cursor-pointer flex items-center justify-center w-[30px] h-[30px] md:w-[33px] md:h-[35px] rounded-lg bg-[#3A3740]"
                  onClick={copyToClipboard}
                >
                  <CopyIcon
                    className={`w-3 h-3 md:w-4 md:h-4 ${copiedAddress ? 'text-green-500' : 'text-white'}`}
                  />
                </div>
              </div>
            </div>
            <QRCode address={address} />
          </>
        )}
      </>
    </Card>
  );
}
