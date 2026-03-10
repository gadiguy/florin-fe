import { useQuery } from '@tanstack/react-query';
import { FlorinApiService } from '@/services/Api';
import { TransactionHistory } from '@/types';

/**
 * Hook to fetch transaction history for a given owner address
 * Uses the new API endpoint to fetch transaction history
 */
export function useTransactionHistory(ownerAddress: string | undefined) {
  return useQuery<TransactionHistory>({
    queryKey: ['transactions', 'history', ownerAddress],
    queryFn: () => FlorinApiService.getTransactionHistory(ownerAddress),
    enabled: !!ownerAddress,
    staleTime: 1000 * 10, // 10 seconds
  });
} 