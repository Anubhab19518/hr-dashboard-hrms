import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient, ApiClientError } from '../api-client';

describe('Centralized API Client (AGENTS.md Rule 14)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should unwrap successful data payload', async () => {
    const mockData = { message: 'ok' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'success', data: mockData }),
    } as unknown as Response);

    const result = await apiClient<{ message: string }>('/test', { skipAuth: true });
    expect(result).toEqual(mockData);
  });

  it('should throw ApiClientError on unsuccessful response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        status: 'error',
        message: 'Name is required',
        code: 'INVALID_INPUT',
      }),
    } as unknown as Response);

    await expect(apiClient('/test', { skipAuth: true })).rejects.toThrow(ApiClientError);
  });
});
