import { useEffect } from 'react';
import { X, Check, AlertTriangle } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'error' | 'success' | 'warning';
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type = 'error', onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const styles = {
    error: 'bg-coral-light border-coral/20 text-coral-dark',
    success: 'bg-mint-light border-mint-dark/20 text-foreground',
    warning: 'bg-orange-light border-orange/20 text-orange-dark',
  };

  return (
    <div className={`fixed top-5 right-5 z-[9999] flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg animate-fade-in ${styles[type]}`}>
      {type === 'success' ? <Check className="h-4 w-4 text-mint-dark" /> : <AlertTriangle className="h-4 w-4" />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
