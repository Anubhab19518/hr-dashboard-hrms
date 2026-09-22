import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/env/server', () => ({
  serverEnv: {
    AUTH_SECRET: 'test-secret-key-12345678',
  },
}));

import { getAuthSecret } from '../secrets';

describe('Server Secrets Boundary (AGENTS.md Rule 9)', () => {
  it('should return auth secret from verified server env', () => {
    expect(getAuthSecret()).toBe('test-secret-key-12345678');
  });
});
