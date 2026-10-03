import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast, toastListeners } from '../toast';

describe('Toast Utility Unit Tests', () => {
  beforeEach(() => {
    toastListeners.clear();
  });

  it('notifies all registered listeners for success, error, warning, and info', () => {
    const listener = vi.fn();
    toastListeners.add(listener);

    toast.success('Success message', 'Success Title');
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        message: 'Success message',
        title: 'Success Title',
      }),
    );

    toast.error('Error message');
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        message: 'Error message',
      }),
    );

    toast.warning('Warning message');
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'warning',
        message: 'Warning message',
      }),
    );

    toast.info('Info message');
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'info',
        message: 'Info message',
      }),
    );
  });
});
