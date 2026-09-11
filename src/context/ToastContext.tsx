import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', title?: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, message, title }]);

      setTimeout(() => {
        removeToast(id);
      }, 5000);
    },
    [removeToast]
  );

  const success = useCallback((msg: string, title?: string) => showToast(msg, 'success', title), [showToast]);
  const error = useCallback((msg: string, title?: string) => showToast(msg, 'error', title), [showToast]);
  const info = useCallback((msg: string, title?: string) => showToast(msg, 'info', title), [showToast]);
  const warning = useCallback((msg: string, title?: string) => showToast(msg, 'warning', title), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      <div
        id="toast-container"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4"
      >
        <AnimatePresence>
          {toasts.map((t) => {
            let bg = 'bg-white border-slate-200 text-slate-900';
            let icon = <Info className="w-5 h-5 text-blue-500 shrink-0" />;

            if (t.type === 'success') {
              bg = 'bg-emerald-50 border-emerald-200 text-emerald-950';
              icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
            } else if (t.type === 'error') {
              bg = 'bg-rose-50 border-rose-200 text-rose-950';
              icon = <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />;
            } else if (t.type === 'warning') {
              bg = 'bg-amber-50 border-amber-200 text-amber-950';
              icon = <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />;
            }

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg ${bg}`}
              >
                {icon}
                <div className="flex-1 text-sm">
                  {t.title && <div className="font-semibold mb-0.5">{t.title}</div>}
                  <div className="leading-snug">{t.message}</div>
                </div>
                <button
                  id={`close-toast-${t.id}`}
                  onClick={() => removeToast(t.id)}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
