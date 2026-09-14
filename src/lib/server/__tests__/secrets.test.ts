import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/env/server', () => ({
  serverEnv: {
    AUTH_SECRET: 'test-secret-key-12345678',
    DATABASE_URL: 'postgresql://localhost:5432/test',
  },
}));

import { getAuthSecret, getDatabaseUrl } from '../secrets';

describe('Server Secrets Boundary (AGENTS.md Rule 9)', () => {
  it('should return auth secret and db url from verified server env', () => {
    expect(getAuthSecret()).toBe('test-secret-key-12345678');
    expect(getDatabaseUrl()).toBe('postgresql://localhost:5432/test');
  });
});
