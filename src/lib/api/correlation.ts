import { headers } from 'next/headers';

export const CORRELATION_HEADER = 'x-request-id';

/**
 * Retrieves the request ID from incoming headers or generates a new one.
 */
export async function getRequestId(): Promise<string> {
  try {
    const headersList = await headers();
    const existing = headersList.get(CORRELATION_HEADER);
    if (existing && existing.trim().length > 0) {
      return existing;
    }
  } catch {
    // Fallback when headers() is called outside request context
  }
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}
