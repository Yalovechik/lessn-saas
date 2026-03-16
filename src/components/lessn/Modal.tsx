import { type ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-foreground/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-2xl w-full max-w-[460px] max-h-[88vh] overflow-auto shadow-lg animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-5 pb-4 flex justify-between items-center border-b border-border">
          <h3 className="text-[17px] font-bold text-foreground">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && (
          <div className="px-6 pb-5 pt-4 flex gap-2.5 justify-end border-t border-border">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
