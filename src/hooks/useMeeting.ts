import { useState, useEffect, useCallback } from 'react';
import { getMeeting } from '@/api/meetings';
import { Meeting } from '@/types';

interface UseMeetingReturn {
  meeting: Meeting | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useMeeting(id: string): UseMeetingReturn {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await getMeeting(id);
      setMeeting(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load meeting');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { meeting, isLoading, error, refresh: fetch };
}
