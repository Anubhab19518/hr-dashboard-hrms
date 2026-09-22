import { describe, it, expect } from 'vitest';
import { hasPermission, assertAuthorized } from '@/lib/auth/rbac';

describe('HR Domain RBAC (AGENTS.md Rule 16)', () => {
  it('should enforce role-based permissions correctly for HR domain', () => {
    const adminUser = {
      id: '1',
      email: 'admin@test.com',
      name: 'Admin',
      role: 'admin' as const,
    };
    const supervisorUser = {
      id: '2',
      email: 'supervisor@test.com',
      name: 'Supervisor',
      role: 'supervisor' as const,
    };
    const viewerUser = {
      id: '3',
      email: 'viewer@test.com',
      name: 'Viewer',
      role: 'viewer' as const,
    };

    expect(hasPermission(adminUser, 'employees:create')).toBe(true);
    expect(hasPermission(adminUser, 'workspaces:create')).toBe(true);
    expect(hasPermission(supervisorUser, 'attendance:create')).toBe(true);
    expect(hasPermission(supervisorUser, 'workspaces:create')).toBe(false);
    expect(hasPermission(viewerUser, 'employees:read')).toBe(true);
    expect(hasPermission(viewerUser, 'employees:delete')).toBe(false);

    expect(() => assertAuthorized(viewerUser, 'employees:delete')).toThrow(/Unauthorized/);
    expect(() => assertAuthorized(adminUser, 'employees:delete')).not.toThrow();
  });
});

describe('Authentication Schemas (Admin & Employee)', () => {
  it('validates admin login schema for email and password', async () => {
    const { adminLoginSchema } = await import('../schemas/login.schema');

    const valid = adminLoginSchema.safeParse({
      email: 'admin@example.com',
      password: 'StrongPassword123',
    });
    expect(valid.success).toBe(true);

    const invalidEmail = adminLoginSchema.safeParse({
      email: 'not-an-email',
      password: 'StrongPassword123',
    });
    expect(invalidEmail.success).toBe(false);

    const emptyPassword = adminLoginSchema.safeParse({
      email: 'admin@example.com',
      password: '',
    });
    expect(emptyPassword.success).toBe(false);
  });

  it('validates unified login schema with both email and employee code', async () => {
    const { unifiedLoginSchema } = await import('../schemas/login.schema');

    // Admin Email
    const emailLogin = unifiedLoginSchema.safeParse({
      identifier: 'admin@company.com',
      password: 'ValidPassword123',
    });
    expect(emailLogin.success).toBe(true);

    // Employee Code (e.g., EMP4991)
    const empCodeLogin = unifiedLoginSchema.safeParse({
      identifier: 'EMP4991',
      password: 'x*RCfQhHyE6B',
    });
    expect(empCodeLogin.success).toBe(true);

    // Empty identifier
    const invalidLogin = unifiedLoginSchema.safeParse({
      identifier: '',
      password: 'ValidPassword123',
    });
    expect(invalidLogin.success).toBe(false);
  });
});
