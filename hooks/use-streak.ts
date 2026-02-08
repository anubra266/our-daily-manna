import { useQuery } from '@tanstack/react-query';
import { getStreak, getWeekStatus } from '@/lib/db/cache';

const STREAK_QUERY_KEY = ['streak'] as const;
const WEEK_STATUS_QUERY_KEY = ['weekStatus'] as const;

export function useStreak() {
  return useQuery({
    queryKey: STREAK_QUERY_KEY,
    queryFn: getStreak,
  });
}

export function useWeekStatus() {
  return useQuery({
    queryKey: WEEK_STATUS_QUERY_KEY,
    queryFn: getWeekStatus,
  });
}

export { STREAK_QUERY_KEY, WEEK_STATUS_QUERY_KEY };
