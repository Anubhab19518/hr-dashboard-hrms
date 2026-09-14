import { describe, it, expect } from 'vitest';
import { GET } from '../route';

describe('Health Check Endpoint (AGENTS.md Rule 53)', () => {
  it('should return HTTP 200 with liveness and readiness status', async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const json = (await response.json()) as {
      success: boolean;
      data: {
        status: string;
        checks: { liveness: string; readiness: string };
      };
      meta: { requestId: string };
    };

    expect(json.success).toBe(true);
    expect(json.data.status).toBe('healthy');
    expect(json.data.checks.liveness).toBe('UP');
    expect(json.data.checks.readiness).toBe('UP');
    expect(json.meta.requestId).toBeDefined();
    expect(response.headers.get('x-request-id')).toBeDefined();
  });
});
