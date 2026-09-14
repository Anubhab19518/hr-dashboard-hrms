import { NextResponse } from 'next/server';
import type { ApiErrorResponse, ApiSuccessResponse } from '@/types/common';
import { CORRELATION_HEADER } from './correlation';

export function createSuccessResponse<T>(
  data: T,
  requestId: string,
  status: number = 200,
): NextResponse<ApiSuccessResponse<T>> {
  const payload: ApiSuccessResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  return NextResponse.json(payload, {
    status,
    headers: {
      [CORRELATION_HEADER]: requestId,
    },
  });
}

export function createErrorResponse(
  code: string,
  message: string,
  requestId: string,
  status: number = 400,
  details?: Record<string, unknown> | readonly string[],
): NextResponse<ApiErrorResponse> {
  const payload: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  return NextResponse.json(payload, {
    status,
    headers: {
      [CORRELATION_HEADER]: requestId,
    },
  });
}
