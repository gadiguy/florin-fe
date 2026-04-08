import { useQuery } from '@tanstack/react-query';
import { createPublicClient, http, Address } from 'viem';
import { sepolia } from '@/config/evm-chains';
import { CONTRACTS_ADDRESS } from '@/constants/contracts';
import { AMMEXCHANGE_ABI } from '@/constants/abis';
import { EVMPosition } from '@/types';

// Standalone Sepolia client — no wallet needed
const sepoliaClient = createPublicClient({
  chain: sepolia,
  transport: http(sepolia.rpcUrls.default.http[0]),
});

async function fetchPosition(positionId: string): Promise<EVMPosition> {
  const contractAddress = (CONTRACTS_ADDRESS[sepolia.id] as { ammExchange: string }).ammExchange as Address;

  const position = (await sepoliaClient.readContract({
    address: contractAddress,
    abi: AMMEXCHANGE_ABI,
    functionName: 'getPosition',
    args: [positionId],
  })) as unknown as EVMPosition;

  return position;
}

interface UseEVMPositionPollingProps {
  positionId: string;
  chainId: number;
  isActive?: boolean;
  pollingInterval?: number;
}

export const useEVMPositionPolling = ({
  positionId,
  isActive = true,
  pollingInterval = 10000,
}: UseEVMPositionPollingProps) => {
  const queryKey = ['evmPosition', positionId];

  const { data: evmPosition, error, isLoading, refetch } = useQuery({
    queryKey,
    queryFn: () => fetchPosition(positionId),
    enabled: !!positionId,
    refetchInterval: isActive ? pollingInterval : false,
    refetchIntervalInBackground: false,
    staleTime: 0,
    placeholderData: (previousData) => previousData,
  });

  return {
    evmPosition,
    error: error as Error | null,
    isLoading,
    refetch,
  };
};
