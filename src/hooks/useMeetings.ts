import { useState, useEffect, useCallback } from 'react';
import { listMeetings } from '@/api/meetings';
import { MeetingsListResponse } from '@/types';

interface UseMeetingsReturn {
  data: MeetingsListResponse | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useMeetings(): UseMeetingsReturn {
  const [data, setData] = useState<MeetingsListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await listMeetings();
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load meetings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refresh: fetch };
}
