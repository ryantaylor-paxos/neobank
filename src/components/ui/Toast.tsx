'use client';
import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const remove = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  const icons = {
    success: <CheckCircle size={16} className="text-emerald-400 shrink-0" />,
    error: <AlertCircle size={16} className="text-red-400 shrink-0" />,
    info: <Info size={16} className="text-sky-400 shrink-0" />,
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'glass flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl animate-slide-in',
              t.type === 'success' && 'border-emerald-500/20',
              t.type === 'error' && 'border-red-500/20',
            )}
          >
            {icons[t.type]}
            <p className="text-sm text-white/90 flex-1">{t.message}</p>
            <button
              onClick={() => remove(t.id)}
              className="text-white/40 hover:text-white/80 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
