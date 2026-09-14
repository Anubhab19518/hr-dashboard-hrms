import type { ApiResponse } from '@/types/common';

export class ApiClientError extends Error {
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, code: string = 'CLIENT_ERROR', details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.details = details;
  }
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !data.success) {
    const errorMessage = !data.success ? data.error.message : 'An unexpected error occurred';
    const errorCode = !data.success ? data.error.code : `HTTP_${response.status}`;
    const details = !data.success ? data.error.details : undefined;
    throw new ApiClientError(errorMessage, errorCode, details);
  }

  return data.data;
}
