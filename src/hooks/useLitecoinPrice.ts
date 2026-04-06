import { useQuery } from '@tanstack/react-query';
import { LitecoinPrice, BitcoinOracle } from '@/services/BitcoinOracle';

export function useLitecoinPrice() {
  return useQuery<LitecoinPrice>({
    queryKey: ['litecoin-price'],
    queryFn: () => BitcoinOracle.getLitecoinPrice(),
    refetchInterval: 60000,
    staleTime: 30000,
  });
}
