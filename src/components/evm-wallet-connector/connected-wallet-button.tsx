import { useState, useRef, useEffect } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { truncateAddress } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { Card } from '../ui/card';
import EthLogo from '@/assets/eth-logo.png';

export const EvmWalletConnected = () => {
  const { disconnect } = useDisconnect();
  const { address } = useAccount();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const truncatedAddr = truncateAddress(address || '');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <Card className="text-white text-[14px] font-bold | bg-grey h-[88px] rounded-xl py-2 px-4 border-none cursor-pointer hover:opacity-90 transition-opacity">
        <div className="h-full flex flex-row items-center justify-between gap-9">
          <div className="flex flex-row items-center gap-2">
            <img src={EthLogo} alt="Ethereum Logo" className="w-4 h-4" />

            {truncatedAddr}
          </div>

          <ChevronDown
            className="text-white"
            size={16}
            onClick={(e) => {
              e.stopPropagation();
              setIsDropdownOpen(!isDropdownOpen);
            }}
          />
        </div>
      </Card>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-1 p-4 w-full rounded-lg shadow-lg z-10 bg-[#2A2730] hover:bg-[#333]">
          <div
            onClick={() => {
              disconnect();
              setIsDropdownOpen(false);
            }}
            className="p-3 cursor-pointer rounded-lg text-white"
          >
            Disconnect
          </div>
        </div>
      )}
    </div>
  );
};
