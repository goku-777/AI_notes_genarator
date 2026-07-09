import { useEffect, useState } from 'react';
import { userService } from '@/services/userService';
import type { DashboardStats } from '@/types';

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    userService
      .getStats()
      .then(({ data }) => {
        if (isMounted) setStats(data.data!);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return { stats, isLoading };
};
