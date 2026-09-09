import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { createPortal } from 'react-dom';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  onUndo?: () => void;
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      {createPortal(
        <div className="fixed bottom-0 right-0 z-50 p-4 space-y-4 w-full max-w-sm pointer-events-none">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

const ToastItem = ({ toast, onRemove }: { toast: Toast; onRemove: () => void }) => {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
  };

  return (
    <div className="pointer-events-auto flex items-start p-4 rounded-lg shadow-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 animate-slide-in">
      <div className="flex-shrink-0 mr-3">
        {icons[toast.type]}
      </div>
      <div className="flex-1 mr-2">
        <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">{toast.title}</h3>
        {toast.message && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{toast.message}</p>
        )}
        {toast.onUndo && (
          <button
            onClick={() => {
              toast.onUndo?.();
              onRemove();
            }}
            className="mt-2 text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline"
          >
            Undo
          </button>
        )}
      </div>
      <button
        onClick={onRemove}
        className="flex-shrink-0 text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
