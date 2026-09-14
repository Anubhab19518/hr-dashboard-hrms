import { describe, it, expect } from 'vitest';
import { AuthService } from '../services/auth-service';
import { hasPermission, assertAuthorized } from '@/lib/auth/rbac';

describe('Auth Service & RBAC (AGENTS.md Rule 16)', () => {
  it('should authenticate valid demo user with correct credentials', async () => {
    const user = await AuthService.authenticate({
      email: 'admin@example.com',
      password: 'Password123!',
    });

    expect(user).not.toBeNull();
    expect(user?.email).toBe('admin@example.com');
    expect(user?.role).toBe('admin');
  });

  it('should reject invalid password for existing user', async () => {
    const user = await AuthService.authenticate({
      email: 'admin@example.com',
      password: 'WrongPassword!',
    });

    expect(user).toBeNull();
  });

  it('should reject non-existent user email', async () => {
    const user = await AuthService.authenticate({
      email: 'ghost@example.com',
      password: 'Password123!',
    });

    expect(user).toBeNull();
  });

  it('should enforce role-based permissions correctly', () => {
    const adminUser = {
      id: '1',
      email: 'admin@test.com',
      name: 'Admin',
      role: 'admin' as const,
    };
    const viewerUser = {
      id: '2',
      email: 'viewer@test.com',
      name: 'Viewer',
      role: 'viewer' as const,
    };

    expect(hasPermission(adminUser, 'orders:approve_high_value')).toBe(true);
    expect(hasPermission(viewerUser, 'orders:approve_high_value')).toBe(false);
    expect(hasPermission(viewerUser, 'orders:read')).toBe(true);

    expect(() => assertAuthorized(viewerUser, 'orders:delete')).toThrow(/Unauthorized/);
    expect(() => assertAuthorized(adminUser, 'orders:delete')).not.toThrow();
  });
});
