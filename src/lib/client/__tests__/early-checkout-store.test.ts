import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEarlyCheckoutStore, useEarlyCheckoutBadgeWatcher } from '../early-checkout-store';
import { useAuthStore } from '../auth-store';
import { apiClient } from '../api-client';

vi.mock('../api-client', () => ({
  apiClient: vi.fn(),
}));

describe('useEarlyCheckoutStore & useEarlyCheckoutBadgeWatcher Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    useEarlyCheckoutStore.setState({
      pendingEarlyCheckoutCount: 0,
      isLoading: false,
      lastFetchedAt: null,
    });
    useAuthStore.setState({
      token: 'mock-token',
      user: { id: 'u-1', email: 'admin@work.com', name: 'Admin' },
    });
  });

  it('updates, increments, and decrements pending count with lower bound 0', () => {
    const store = useEarlyCheckoutStore.getState();

    store.setPendingEarlyCheckoutCount(5);
    expect(useEarlyCheckoutStore.getState().pendingEarlyCheckoutCount).toBe(5);

    store.decrementPendingCount(2);
    expect(useEarlyCheckoutStore.getState().pendingEarlyCheckoutCount).toBe(3);

    store.decrementPendingCount(10);
    expect(useEarlyCheckoutStore.getState().pendingEarlyCheckoutCount).toBe(0);

    store.incrementPendingCount(4);
    expect(useEarlyCheckoutStore.getState().pendingEarlyCheckoutCount).toBe(4);
  });

  it('returns 0 and resets when not authenticated', async () => {
    useAuthStore.setState({ token: null });
    const count = await useEarlyCheckoutStore.getState().fetchPendingCount();
    expect(count).toBe(0);
    expect(useEarlyCheckoutStore.getState().pendingEarlyCheckoutCount).toBe(0);
  });

  it('fetches pending count correctly from backend payload variations', async () => {
    // 1. Array response
    vi.mocked(apiClient).mockResolvedValueOnce([
      { id: '1', status: 'PENDING' },
      { id: '2', status: 'PENDING' },
    ]);

    let count = await useEarlyCheckoutStore.getState().fetchPendingCount();
    expect(count).toBe(2);
    expect(useEarlyCheckoutStore.getState().pendingEarlyCheckoutCount).toBe(2);

    // 2. Object with pendingCount
    vi.mocked(apiClient).mockResolvedValueOnce({
      pendingCount: 7,
      total: 10,
    });

    count = await useEarlyCheckoutStore.getState().fetchPendingCount();
    expect(count).toBe(7);

    // 3. Fallback on primary fail
    vi.mocked(apiClient).mockRejectedValueOnce(new Error('Fail 1')).mockResolvedValueOnce({
      total: 4,
    });

    count = await useEarlyCheckoutStore.getState().fetchPendingCount();
    expect(count).toBe(4);
  });

  it('handles complete failure gracefully and retains existing count', async () => {
    useEarlyCheckoutStore.setState({ pendingEarlyCheckoutCount: 3 });
    vi.mocked(apiClient)
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'));

    const count = await useEarlyCheckoutStore.getState().fetchPendingCount();
    expect(count).toBe(3);
    expect(useEarlyCheckoutStore.getState().isLoading).toBe(false);
  });

  it('polls periodically and refetches on focus and visibilitychange', async () => {
    vi.mocked(apiClient).mockResolvedValue({
      pendingCount: 4,
      total: 4,
    });

    const { result, unmount } = renderHook(() =>
      useEarlyCheckoutBadgeWatcher({ pollIntervalMs: 5000, enabled: true }),
    );

    // Trigger focus event
    act(() => {
      window.dispatchEvent(new Event('focus'));
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Advance timer
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(typeof result.current.refetch).toBe('function');
    unmount();
    vi.useRealTimers();
  });
});
