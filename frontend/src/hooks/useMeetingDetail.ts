import { useCallback, useEffect, useState } from 'react';
import { meetingService } from '@/services/meetingService';
import type { MeetingFullDetail } from '@/types';
import { getErrorMessage } from '@/services/apiClient';

export const useMeetingDetail = (meetingId: string | undefined) => {
  const [detail, setDetail] = useState<MeetingFullDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!meetingId) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await meetingService.getById(meetingId);
      setDetail(data.data!);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [meetingId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return { detail, isLoading, error, refetch: fetchDetail };
};
