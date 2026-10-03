'use client';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

export type ToastListener = (toast: Omit<ToastItem, 'id'>) => void;
export const toastListeners = new Set<ToastListener>();

export const toast = {
  success: (message: string, title?: string, duration = 4000) => {
    toastListeners.forEach((fn) => fn({ type: 'success', message, title, duration }));
  },
  error: (message: string, title?: string, duration = 5000) => {
    toastListeners.forEach((fn) => fn({ type: 'error', message, title, duration }));
  },
  warning: (message: string, title?: string, duration = 4500) => {
    toastListeners.forEach((fn) => fn({ type: 'warning', message, title, duration }));
  },
  info: (message: string, title?: string, duration = 4000) => {
    toastListeners.forEach((fn) => fn({ type: 'info', message, title, duration }));
  },
};
