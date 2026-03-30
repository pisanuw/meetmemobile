import { useState, useCallback } from 'react';

export type FlashType = 'success' | 'error' | 'info';

interface FlashState {
  message: string;
  type: FlashType;
}

interface UseFlashReturn {
  flash: FlashState | null;
  showFlash: (message: string, type?: FlashType) => void;
  clearFlash: () => void;
}

export function useFlash(): UseFlashReturn {
  const [flash, setFlash] = useState<FlashState | null>(null);

  const showFlash = useCallback((message: string, type: FlashType = 'info') => {
    setFlash({ message, type });
  }, []);

  const clearFlash = useCallback(() => {
    setFlash(null);
  }, []);

  return { flash, showFlash, clearFlash };
}
