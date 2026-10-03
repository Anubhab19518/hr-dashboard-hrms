'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from '@/components/atoms/icons';
import { toast, toastListeners, type ToastItem } from '@/lib/client/toast';

export { toast };

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
  success: (message: string, title?: string, duration?: number) => string;
  error: (message: string, title?: string, duration?: number) => string;
  warning: (message: string, title?: string, duration?: number) => string;
  info: (message: string, title?: string, duration?: number) => string;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toastData: Omit<ToastItem, 'id'>) => {
      const id = 'toast-' + Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { ...toastData, id };
      setToasts((prev) => [...prev, newToast]);

      const duration = toastData.duration ?? 4000;
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
      return id;
    },
    [removeToast],
  );

  useEffect(() => {
    const listener = (toastData: Omit<ToastItem, 'id'>) => {
      addToast(toastData);
    };
    toastListeners.add(listener);
    return () => {
      toastListeners.delete(listener);
    };
  }, [addToast]);

  const success = useCallback(
    (message: string, title?: string, duration = 4000) =>
      addToast({ type: 'success', message, title, duration }),
    [addToast],
  );

  const error = useCallback(
    (message: string, title?: string, duration = 5000) =>
      addToast({ type: 'error', message, title, duration }),
    [addToast],
  );

  const warning = useCallback(
    (message: string, title?: string, duration = 4500) =>
      addToast({ type: 'warning', message, title, duration }),
    [addToast],
  );

  const info = useCallback(
    (message: string, title?: string, duration = 4000) =>
      addToast({ type: 'info', message, title, duration }),
    [addToast],
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      {/* Toast Render Container */}
      <div
        aria-live="polite"
        style={{
          position: 'fixed',
          bottom: 'var(--space-5)',
          right: 'var(--space-5)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
          maxWidth: '420px',
          width: 'calc(100vw - 32px)',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => {
          const typeStyles = {
            success: {
              border: 'hsl(var(--color-success))',
              bg: 'hsl(var(--bg-surface))',
              iconColor: 'hsl(var(--color-success))',
              icon: <CheckCircle2 size={18} strokeWidth={2.2} />,
            },
            error: {
              border: 'hsl(var(--color-danger))',
              bg: 'hsl(var(--bg-surface))',
              iconColor: 'hsl(var(--color-danger))',
              icon: <AlertCircle size={18} strokeWidth={2.2} />,
            },
            warning: {
              border: 'hsl(var(--color-warning))',
              bg: 'hsl(var(--bg-surface))',
              iconColor: 'hsl(var(--color-warning))',
              icon: <AlertTriangle size={18} strokeWidth={2.2} />,
            },
            info: {
              border: 'hsl(var(--color-brand-accent))',
              bg: 'hsl(var(--bg-surface))',
              iconColor: 'hsl(var(--color-brand-accent))',
              icon: <Info size={18} strokeWidth={2.2} />,
            },
          }[t.type];

          return (
            <div
              key={t.id}
              role="status"
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-3)',
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: typeStyles.bg,
                border: `1px solid ${typeStyles.border}`,
                boxShadow: 'var(--shadow-lg)',
                color: 'hsl(var(--text-primary))',
                animation: 'slideInUp 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                transition: 'all var(--transition-fast)',
              }}
            >
              <div
                style={{
                  color: typeStyles.iconColor,
                  flexShrink: 0,
                  marginTop: '1px',
                }}
              >
                {typeStyles.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {t.title && (
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 700,
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    {t.title}
                  </div>
                )}
                <div
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'hsl(var(--text-secondary))',
                    lineHeight: 1.4,
                    wordBreak: 'break-word',
                  }}
                >
                  {t.message}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                aria-label="Close notification"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'hsl(var(--text-muted))',
                  cursor: 'pointer',
                  padding: 'var(--space-1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 'var(--radius-sm)',
                  flexShrink: 0,
                }}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return toast;
  }
  return context;
}
