import { useCallback, useEffect, useState } from 'react';
import { meetingService } from '@/services/meetingService';
import type { GetMeetingsParams } from '@/services/meetingService';
import type { Meeting } from '@/types';
import { getErrorMessage } from '@/services/apiClient';

export const useMeetings = (initialParams: GetMeetingsParams = {}) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ total: number; totalPages: number } | null>(null);
  const [params, setParams] = useState<GetMeetingsParams>(initialParams);

  const fetchMeetings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await meetingService.getAll(params);
      setMeetings(data.data || []);
      setMeta({
        total: (data.meta?.total as number) || 0,
        totalPages: (data.meta?.totalPages as number) || 1,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  return { meetings, isLoading, error, meta, params, setParams, refetch: fetchMeetings };
};
