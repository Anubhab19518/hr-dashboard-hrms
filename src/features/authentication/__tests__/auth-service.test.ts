import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hasPermission, assertAuthorized } from '@/lib/auth/rbac';
import { AuthService } from '../services/auth.service';
import { apiClient } from '@/lib/client/api-client';

vi.mock('@/lib/client/api-client', () => ({
  apiClient: vi.fn(),
}));

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

describe('AuthService API Methods & Fallbacks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls adminLogin with primary and fallback endpoints', async () => {
    const mockAdminRes = {
      user: { id: 'u1', email: 'admin@acme.com', name: 'Admin' },
      tokens: { accessToken: 'acc-1', refreshToken: 'ref-1' },
      workspaces: [{ id: 'w1', name: 'Acme', slug: 'acme', role: 'ADMIN' }],
    };

    // Primary succeeds
    vi.mocked(apiClient).mockResolvedValueOnce(mockAdminRes);
    const primaryRes = await AuthService.adminLogin({
      email: 'admin@acme.com',
      password: 'password123',
    });
    expect(primaryRes.user.email).toBe('admin@acme.com');

    // Primary fails, fallback succeeds
    vi.mocked(apiClient)
      .mockRejectedValueOnce(new Error('404'))
      .mockResolvedValueOnce(mockAdminRes);
    const fallbackRes = await AuthService.adminLogin({
      email: 'admin@acme.com',
      password: 'password123',
    });
    expect(fallbackRes.user.email).toBe('admin@acme.com');

    // Both fail
    vi.mocked(apiClient)
      .mockRejectedValueOnce(new Error('Primary failed'))
      .mockRejectedValueOnce(new Error('Fallback failed'));
    await expect(
      AuthService.adminLogin({ email: 'admin@acme.com', password: 'password123' }),
    ).rejects.toThrow('Primary failed');
  });

  it('calls employeeLogin with endpoint cascade', async () => {
    const mockEmpRes = {
      user: { id: 'u2', email: 'emp@acme.com', name: 'Employee' },
      tokens: { accessToken: 'acc-2', refreshToken: 'ref-2' },
      workspaces: [],
    };

    // Fails first 2 endpoints, succeeds on 3rd
    vi.mocked(apiClient)
      .mockRejectedValueOnce(new Error('Endpoint 1 failed'))
      .mockRejectedValueOnce(new Error('Endpoint 2 failed'))
      .mockResolvedValueOnce(mockEmpRes);

    const res = await AuthService.employeeLogin({
      employeeCode: 'EMP001',
      password: 'secret',
    });
    expect(res.user.name).toBe('Employee');

    // All endpoints fail
    vi.mocked(apiClient).mockRejectedValue(new Error('Endpoint failed'));

    await expect(
      AuthService.employeeLogin({ employeeCode: 'EMP001', password: 'bad' }),
    ).rejects.toThrow('Endpoint failed');
  });

  it('tests unified login cross-fallback logic', async () => {
    const mockRes = {
      user: { id: 'u1', email: 'user@acme.com', name: 'User' },
      tokens: { accessToken: 'acc', refreshToken: 'ref' },
      workspaces: [],
    };

    // When identifier is email, but admin fails and employee succeeds
    vi.mocked(apiClient)
      .mockRejectedValueOnce(new Error('Not admin'))
      .mockRejectedValueOnce(new Error('Not admin fallback'))
      .mockResolvedValueOnce(mockRes);

    const emailEmp = await AuthService.login({
      identifier: 'user@acme.com',
      password: 'password',
    });
    expect(emailEmp.user.name).toBe('User');

    // When identifier is code, but employee fails and admin succeeds
    vi.mocked(apiClient)
      .mockRejectedValueOnce(new Error('Not emp 1'))
      .mockRejectedValueOnce(new Error('Not emp 2'))
      .mockRejectedValueOnce(new Error('Not emp 3'))
      .mockRejectedValueOnce(new Error('Not emp 4'))
      .mockResolvedValueOnce(mockRes);

    const codeAdmin = await AuthService.login({
      identifier: 'admin_username',
      password: 'password',
    });
    expect(codeAdmin.user.name).toBe('User');
  });

  it('handles refresh primary and fallback, and handles logout errors gracefully', async () => {
    // Refresh primary fails, fallback succeeds
    vi.mocked(apiClient)
      .mockRejectedValueOnce(new Error('Primary refresh failed'))
      .mockResolvedValueOnce({ accessToken: 'new-token' });

    const ref = await AuthService.refresh();
    expect(ref.accessToken).toBe('new-token');

    // Refresh both fail
    vi.mocked(apiClient)
      .mockRejectedValueOnce(new Error('Primary failed'))
      .mockRejectedValueOnce(new Error('Secondary failed'));
    await expect(AuthService.refresh()).rejects.toThrow('Primary failed');

    // Logout catches errors silently
    vi.mocked(apiClient)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error 2'));
    await expect(AuthService.logout()).resolves.toBeUndefined();
  });

  it('handles listWorkspaces with records wrapper or direct array', async () => {
    vi.mocked(apiClient).mockResolvedValueOnce({
      records: [{ id: 'w1', name: 'Acme', slug: 'acme', role: 'ADMIN' }],
    });
    const wrapped = await AuthService.listWorkspaces();
    expect(wrapped.length).toBe(1);

    vi.mocked(apiClient).mockResolvedValueOnce(null);
    const empty = await AuthService.listWorkspaces();
    expect(empty).toEqual([]);
  });
});
