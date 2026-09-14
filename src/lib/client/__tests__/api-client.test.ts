import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchApi, ApiClientError } from '../api-client';

describe('Centralized API Client (AGENTS.md Rule 14)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should unwrap successful data payload', async () => {
    const mockData = { message: 'ok' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: mockData }),
    } as unknown as Response);

    const result = await fetchApi<{ message: string }>('/api/test');
    expect(result).toEqual(mockData);
  });

  it('should throw ApiClientError on unsuccessful response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Name is required' },
      }),
    } as unknown as Response);

    await expect(fetchApi('/api/test')).rejects.toThrow(ApiClientError);
    await expect(fetchApi('/api/test')).rejects.toThrow('Name is required');
  });
});
