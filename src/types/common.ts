/**
 * Result pattern for robust, predictable error handling without throwing unhandled exceptions.
 */
export type Result<T, E = Error> =
  { readonly success: true; readonly data: T } | { readonly success: false; readonly error: E };

export const createResult = {
  ok: <T>(data: T): Result<T, never> => ({ success: true, data }),
  fail: <E>(error: E): Result<never, E> => ({ success: false, error }),
} as const;

/**
 * Standard API error contract conforming to AGENTS.md Rule 43.
 */
export interface ApiErrorResponse {
  readonly success: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: Record<string, unknown> | readonly string[];
  };
  readonly meta: {
    readonly timestamp: string;
    readonly requestId: string;
  };
}

/**
 * Standard API success contract.
 */
export interface ApiSuccessResponse<T> {
  readonly success: true;
  readonly data: T;
  readonly meta: {
    readonly timestamp: string;
    readonly requestId: string;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PaginationParams {
  readonly page: number;
  readonly limit: number;
}

export interface PaginatedResult<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}
