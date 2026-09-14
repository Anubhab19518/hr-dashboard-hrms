import { describe, it, expect } from 'vitest';
import { createSuccessResponse, createErrorResponse } from '../response';
import { CORRELATION_HEADER } from '../correlation';

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
});
