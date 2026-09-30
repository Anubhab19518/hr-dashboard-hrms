import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient, ApiClientError } from '../api-client';
import { useAuthStore } from '../auth-store';

describe('Centralized API Client (AGENTS.md Rule 14)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({
      token: null,
      activeWorkspaceId: null,
      user: null,
    });
  });

  it('should instantiate ApiClientError correctly with defaults and custom fields', () => {
    const defaultErr = new ApiClientError('Default error');
    expect(defaultErr.name).toBe('ApiClientError');
    expect(defaultErr.message).toBe('Default error');
    expect(defaultErr.code).toBe('CLIENT_ERROR');
    expect(defaultErr.status).toBe(0);
    expect(defaultErr.details).toBeUndefined();

    const customErr = new ApiClientError('Custom error', 'VALIDATION_ERR', 422, { field: 'email' });
    expect(customErr.code).toBe('VALIDATION_ERR');
    expect(customErr.status).toBe(422);
    expect(customErr.details).toEqual({ field: 'email' });
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

  it('should return raw body when body.data is absent', async () => {
    const mockRaw = { foo: 'bar' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockRaw,
    } as unknown as Response);

    const result = await apiClient<{ foo: string }>('/raw', { skipAuth: true });
    expect(result).toEqual(mockRaw);
  });

  it('should auto-inject store token and workspaceId when available', async () => {
    useAuthStore.setState({
      token: 'jwt-123',
      activeWorkspaceId: 'ws-456',
    });

    let capturedHeaders: Record<string, string> = {};
    global.fetch = vi.fn().mockImplementation(async (_url, opts) => {
      capturedHeaders = opts.headers;
      return {
        ok: true,
        status: 200,
        json: async () => ({ data: { success: true } }),
      };
    });

    await apiClient('/secure-endpoint');
    expect(capturedHeaders['Authorization']).toBe('Bearer jwt-123');
    expect(capturedHeaders['x-workspace-id']).toBe('ws-456');
    expect(capturedHeaders['Content-Type']).toBe('application/json');
  });

  it('should override token and workspaceId when options are passed', async () => {
    useAuthStore.setState({
      token: 'store-token',
      activeWorkspaceId: 'store-ws',
    });

    let capturedHeaders: Record<string, string> = {};
    global.fetch = vi.fn().mockImplementation(async (_url, opts) => {
      capturedHeaders = opts.headers;
      return {
        ok: true,
        status: 200,
        json: async () => ({ data: { success: true } }),
      };
    });

    await apiClient('/secure-endpoint', {
      token: 'override-token',
      workspaceId: 'override-ws',
    });
    expect(capturedHeaders['Authorization']).toBe('Bearer override-token');
    expect(capturedHeaders['x-workspace-id']).toBe('override-ws');
  });

  it('should not set Content-Type header when body is FormData', async () => {
    const formData = new FormData();
    formData.append('file', 'test');

    let capturedHeaders: Record<string, string> = {};
    global.fetch = vi.fn().mockImplementation(async (_url, opts) => {
      capturedHeaders = opts.headers;
      return {
        ok: true,
        status: 200,
        json: async () => ({ data: { ok: true } }),
      };
    });

    await apiClient('/upload', { method: 'POST', body: formData, skipAuth: true });
    expect(capturedHeaders['Content-Type']).toBeUndefined();
  });

  it('should format detailed validation errors from context.issues, arrays, and string errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        message: ['First error', 'Second error'],
        context: {
          issues: [{ path: ['user', 'email'], message: 'Invalid format' }],
        },
        errors: [
          'Simple string error',
          { path: ['password'], message: 'Too short' },
          { field: 'age', msg: 'Must be positive' },
        ],
      }),
    } as unknown as Response);

    await expect(apiClient('/complex-error', { skipAuth: true })).rejects.toThrow(ApiClientError);
  });

  it('should handle non-json error responses gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error('Bad Gateway');
      },
    } as unknown as Response);

    await expect(apiClient('/bad-gateway', { skipAuth: true })).rejects.toThrow('API Error: 502');
  });

  it('should attempt silent 401 refresh on unauthorized response and retry original request', async () => {
    useAuthStore.setState({ token: 'expired-token' });

    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      callCount++;
      if (url.includes('/auth/refresh')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            status: 'success',
            data: { accessToken: 'new-valid-token' },
          }),
        };
      }
      if (callCount === 1) {
        return {
          ok: false,
          status: 401,
          json: async () => ({ message: 'Token expired' }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ data: { message: 'recovered' } }),
      };
    });

    const result = await apiClient<{ message: string }>('/protected-resource');
    expect(result).toEqual({ message: 'recovered' });
    expect(useAuthStore.getState().token).toBe('new-valid-token');
  });

  it('should handle failed 401 refresh by clearing session and throwing ApiClientError', async () => {
    useAuthStore.setState({ token: 'expired-token' });

    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/auth/refresh')) {
        return {
          ok: false,
          status: 401,
          json: async () => ({ message: 'Refresh token expired' }),
        };
      }
      return {
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      };
    });

    await expect(apiClient('/protected-resource')).rejects.toThrow('Session expired');
    expect(useAuthStore.getState().token).toBeNull();
  });
});
