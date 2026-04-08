import { useQuery } from '@tanstack/react-query';
import { createPublicClient, http, Address } from 'viem';
import { sepolia } from '@/config/evm-chains';
import { CONTRACTS_ADDRESS } from '@/constants/contracts';
import { AMMEXCHANGE_ABI } from '@/constants/abis';
import { EVMReservation } from '@/types';
import { bytes32ToBech32Taproot } from '@/lib/utils';

// Standalone Sepolia client — no wallet needed
const sepoliaClient = createPublicClient({
  chain: sepolia,
  transport: http(sepolia.rpcUrls.default.http[0]),
});

async function fetchReservation(reservationId: string): Promise<EVMReservation> {
  const contractAddress = (CONTRACTS_ADDRESS[sepolia.id] as { ammExchange: string }).ammExchange as Address;

  const reservation = (await sepoliaClient.readContract({
    address: contractAddress,
    abi: AMMEXCHANGE_ABI,
    functionName: 'getReservation',
    args: [reservationId],
  })) as unknown as EVMReservation;

  return {
    ...reservation,
    bitcoinAddress: bytes32ToBech32Taproot(reservation.bitcoinAddress) ?? '',
  };
}

interface UseEVMReservationPollingProps {
  reservationId: string;
  chainId: number;
  isActive?: boolean;
  pollingInterval?: number;
}

export const useEVMReservationPolling = ({
  reservationId,
  isActive = true,
  pollingInterval = 5000,
}: UseEVMReservationPollingProps) => {
  const queryKey = ['evmReservation', reservationId];

  const { data: evmReservation, error, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchReservation(reservationId),
    enabled: isActive && !!reservationId,
    refetchInterval: isActive ? pollingInterval : false,
    refetchIntervalInBackground: false,
    staleTime: 0,
  });

  return {
    evmReservation,
    error: error as Error | null,
    isLoading,
  };
};
