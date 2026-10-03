'use client';

import { create } from 'zustand';
import { useEffect } from 'react';
import { apiClient } from './api-client';
import { useAuthStore } from './auth-store';

interface EarlyCheckoutState {
  pendingEarlyCheckoutCount: number;
  isLoading: boolean;
  lastFetchedAt: number | null;
  setPendingEarlyCheckoutCount: (count: number) => void;
  decrementPendingCount: (by?: number) => void;
  incrementPendingCount: (by?: number) => void;
  fetchPendingCount: () => Promise<number>;
}

export const useEarlyCheckoutStore = create<EarlyCheckoutState>((set, get) => ({
  pendingEarlyCheckoutCount: 0,
  isLoading: false,
  lastFetchedAt: null,

  setPendingEarlyCheckoutCount: (count: number) => {
    set({ pendingEarlyCheckoutCount: Math.max(0, count) });
  },

  decrementPendingCount: (by = 1) => {
    set((state) => ({
      pendingEarlyCheckoutCount: Math.max(0, state.pendingEarlyCheckoutCount - by),
    }));
  },

  incrementPendingCount: (by = 1) => {
    set((state) => ({
      pendingEarlyCheckoutCount: state.pendingEarlyCheckoutCount + by,
    }));
  },

  fetchPendingCount: async () => {
    const token = useAuthStore.getState().token;
    if (!token) {
      set({ pendingEarlyCheckoutCount: 0, isLoading: false });
      return 0;
    }

    set({ isLoading: true });
    try {
      let count = 0;
      try {
        const res = await apiClient<unknown>(
          '/hr/attendance/early-checkout-requests?status=PENDING&limit=1',
        );
        if (Array.isArray(res)) {
          count = res.length;
        } else if (typeof res === 'object' && res !== null) {
          const obj = res as Record<string, unknown>;
          const rawData =
            obj.data && typeof obj.data === 'object' ? (obj.data as Record<string, unknown>) : null;
          if (typeof obj.pendingCount === 'number') {
            count = obj.pendingCount;
          } else if (typeof rawData?.pendingCount === 'number') {
            count = rawData.pendingCount as number;
          } else if (typeof obj.total === 'number') {
            count = obj.total;
          } else if (typeof rawData?.total === 'number') {
            count = rawData.total as number;
          } else if (Array.isArray(obj.requests)) {
            count = obj.requests.length;
          } else if (Array.isArray(obj.items)) {
            count = obj.items.length;
          }
        }
      } catch {
        // Fallback endpoint
        const res = await apiClient<unknown>(
          '/attendance/early-checkout-requests?status=PENDING&limit=1',
        );
        if (Array.isArray(res)) {
          count = res.length;
        } else if (typeof res === 'object' && res !== null) {
          const obj = res as Record<string, unknown>;
          if (typeof obj.total === 'number') count = obj.total;
        }
      }

      set({
        pendingEarlyCheckoutCount: Math.max(0, count),
        lastFetchedAt: Date.now(),
        isLoading: false,
      });
      return count;
    } catch {
      set({ isLoading: false });
      return get().pendingEarlyCheckoutCount;
    }
  },
}));

/**
 * Hook to automatically poll and refresh the pending early checkout badge on mount and window focus.
 */
export function useEarlyCheckoutBadgeWatcher(
  options: { pollIntervalMs?: number; enabled?: boolean } = {},
) {
  const { pollIntervalMs = 30000, enabled = true } = options;
  const token = useAuthStore((s) => s.token);
  const fetchPendingCount = useEarlyCheckoutStore((s) => s.fetchPendingCount);
  const pendingCount = useEarlyCheckoutStore((s) => s.pendingEarlyCheckoutCount);

  useEffect(() => {
    if (!enabled || !token) return;

    void fetchPendingCount();

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        void fetchPendingCount();
      }
    }, pollIntervalMs);

    const handleFocus = () => {
      void fetchPendingCount();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void fetchPendingCount();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, token, fetchPendingCount, pollIntervalMs]);

  return { pendingCount, refetch: fetchPendingCount };
}
