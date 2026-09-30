import { describe, it, expect, vi } from 'vitest';
import { createSuccessResponse, createErrorResponse } from '../response';
import { CORRELATION_HEADER, getRequestId } from '../correlation';
import { headers } from 'next/headers';

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

describe('API Standard Response Contracts (AGENTS.md Rule 43)', () => {
  it('should format successful response conforming to ApiResponse contract', async () => {
    const data = { id: 123, name: 'Sample Item' };
    const res = createSuccessResponse(data, 'req-abc-123', 200);

    expect(res.status).toBe(200);
    expect(res.headers.get(CORRELATION_HEADER)).toBe('req-abc-123');

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toEqual(data);
    expect(json.meta.requestId).toBe('req-abc-123');
    expect(json.meta.timestamp).toBeDefined();
  });

  it('should format error response conforming to ApiErrorResponse contract', async () => {
    const res = createErrorResponse('NOT_FOUND', 'Entity not found', 'req-err-456', 404, {
      resource: 'orders',
    });

    expect(res.status).toBe(404);
    expect(res.headers.get(CORRELATION_HEADER)).toBe('req-err-456');

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('NOT_FOUND');
    expect(json.error.message).toBe('Entity not found');
    expect(json.error.details).toEqual({ resource: 'orders' });
    expect(json.meta.requestId).toBe('req-err-456');
  });

  it('should extract or generate request id in getRequestId', async () => {
    // 1. Existing header
    const mockHeaders = new Headers();
    mockHeaders.set(CORRELATION_HEADER, 'existing-req-id');
    vi.mocked(headers).mockResolvedValueOnce(
      mockHeaders as unknown as Awaited<ReturnType<typeof headers>>,
    );

    const id1 = await getRequestId();
    expect(id1).toBe('existing-req-id');

    // 2. Empty header
    const emptyHeaders = new Headers();
    vi.mocked(headers).mockResolvedValueOnce(
      emptyHeaders as unknown as Awaited<ReturnType<typeof headers>>,
    );
    const id2 = await getRequestId();
    expect(id2.startsWith('req_')).toBe(true);

    // 3. Exception outside request context
    vi.mocked(headers).mockRejectedValueOnce(new Error('Outside request'));
    const id3 = await getRequestId();
    expect(id3.startsWith('req_')).toBe(true);
  });
});
