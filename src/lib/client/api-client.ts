import { clientEnv } from '@/lib/env/client';
import { useAuthStore } from './auth-store';

/**
 * Custom API error with typed code and details from backend.
 */
export class ApiClientError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: unknown;

  constructor(
    message: string,
    code: string = 'CLIENT_ERROR',
    status: number = 0,
    details?: unknown,
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

interface ApiClientOptions extends Omit<RequestInit, 'headers'> {
  /** Override token (for SSR or when not using store) */
  token?: string;
  /** Override workspace ID */
  workspaceId?: string;
  /** Additional headers */
  headers?: Record<string, string>;
  /** Skip auto-injecting auth headers and skip 401 refresh */
  skipAuth?: boolean;
  /** Internal flag to avoid infinite refresh retry loops */
  _retry?: boolean;
}

// Token refresh mutex and waiting queue
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

/**
 * Centralized API client for the HR backend.
 *
 * - Reads `NEXT_PUBLIC_API_BASE_URL` from validated env
 * - Transmits credentials ('include') for HttpOnly session cookie rotation
 * - Auto-injects `Authorization` and `x-workspace-id` from Zustand auth store
 * - Auto-refreshes 15-minute access token on 401 via /auth/refresh
 * - Returns `T` from `response.data` (backend wraps all responses in `{ status, data }`)
 */
export async function apiClient<T>(endpoint: string, options: ApiClientOptions = {}): Promise<T> {
  const {
    token: overrideToken,
    workspaceId: overrideWorkspaceId,
    headers: extraHeaders,
    skipAuth,
    _retry,
    ...fetchOptions
  } = options;

  const headers: Record<string, string> = {
    ...extraHeaders,
  };

  if (!(fetchOptions.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (!skipAuth) {
    const storeState = useAuthStore.getState();
    const token = overrideToken ?? storeState.token;
    const workspaceId = overrideWorkspaceId ?? storeState.activeWorkspaceId;

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (workspaceId) {
      headers['x-workspace-id'] = workspaceId;
    }
  }

  const url = `${clientEnv.NEXT_PUBLIC_API_BASE_URL}${endpoint}`;

  // Disable browser caching for GET requests so re-fetches after mutations
  // always get fresh data from the server (prevents 304 returning stale state).
  const method = (fetchOptions.method ?? 'GET').toUpperCase();
  const cachePolicy: RequestCache = method === 'GET' ? 'no-store' : 'default';

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials: fetchOptions.credentials ?? 'include',
    cache: fetchOptions.cache ?? cachePolicy,
  });

  // Handle 401 — token expired or unauthorized
  const isAuthEndpoint =
    endpoint.includes('/auth/admin/login') ||
    endpoint.includes('/auth/employee/login') ||
    endpoint.includes('/auth/refresh') ||
    endpoint.includes('/auth/logout');

  if (response.status === 401 && !skipAuth && !isAuthEndpoint && !_retry) {
    if (isRefreshing) {
      // Queue this request until the in-flight refresh completes
      return new Promise<string | null>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((newToken) => {
        return apiClient<T>(endpoint, {
          ...options,
          token: newToken ?? undefined,
          _retry: true,
        });
      });
    }

    isRefreshing = true;

    try {
      // Attempt silent token refresh via POST /auth/refresh with HttpOnly cookie
      const refreshUrl = `${clientEnv.NEXT_PUBLIC_API_BASE_URL}/auth/refresh`;
      const refreshRes = await fetch(refreshUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });

      if (!refreshRes.ok) {
        throw new Error('Refresh token invalid or expired');
      }

      const refreshBody = (await refreshRes.json()) as {
        status?: string;
        data?: { accessToken?: string; user?: unknown };
      };

      const newAccessToken = refreshBody.data?.accessToken;
      if (!newAccessToken) {
        throw new Error('No access token returned from refresh endpoint');
      }

      // Update access token in store
      useAuthStore.getState().setToken(newAccessToken);
      processQueue(null, newAccessToken);

      // Retry original request with new token
      return apiClient<T>(endpoint, {
        ...options,
        token: newAccessToken,
        _retry: true,
      });
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new ApiClientError(
        'Session expired. Please sign in again.',
        'UNAUTHORIZED',
        401,
        refreshErr,
      );
    } finally {
      isRefreshing = false;
    }
  }

  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok) {
    let message: string | null = null;
    if (typeof body['message'] === 'string') {
      message = body['message'];
    } else if (Array.isArray(body['message'])) {
      message = (body['message'] as unknown[]).map(String).join(', ');
    } else if (typeof body['error'] === 'string') {
      message = body['error'];
    }

    // Check for nested validation issues in context.issues or details (Zod / backend validation format)
    const context = (body['context'] ?? body['details']) as
      { issues?: Array<{ path?: string[]; message?: string }> } | undefined;
    if (context?.issues && Array.isArray(context.issues) && context.issues.length > 0) {
      const formattedIssues = context.issues
        .map((issue) => `${issue.path?.join('.') || 'field'}: ${issue.message || 'Invalid'}`)
        .join(', ');
      message = `${message || 'Validation failed'}: ${formattedIssues}`;
    }

    message = message ?? `API Error: ${response.status}`;
    const code = typeof body['code'] === 'string' ? body['code'] : `HTTP_${response.status}`;
    throw new ApiClientError(
      message,
      code,
      response.status,
      body['details'] ?? body['errors'] ?? body['context'],
    );
  }

  // The backend wraps data in { status: "success", data: { ... } }
  // Some endpoints return { data: { ... } } directly
  return (body['data'] as T) ?? (body as unknown as T);
}
