import { useQuery } from '@tanstack/react-query';
import { Reservation } from '@/types';
import { FlorinApiService } from '@/services/Api';

/**
 * Hook to fetch a single reservation by ID
 */
export function useReservation(
  reservationId: string | undefined,
  { refetchInterval }: { refetchInterval?: number }
) {
  return useQuery<{ data: Reservation; blockCount: number } | null>({
    queryKey: ['reservation', reservationId],
    queryFn: () => FlorinApiService.getReservationById(reservationId),
    enabled: !!reservationId,
    refetchInterval: refetchInterval || undefined,
  });
}
