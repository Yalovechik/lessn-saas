import { useState, useCallback } from 'react';

interface ToastState {
  message: string;
  type: 'error' | 'success' | 'warning';
  id: number;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: 'error' | 'success' | 'warning' = 'error') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return { toast, showToast, hideToast };
}
