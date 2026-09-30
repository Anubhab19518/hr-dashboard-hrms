import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore, getUserDisplayRole, type AuthUser } from '../auth-store';

describe('Auth Store & Role Utilities', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      token: null,
      user: null,
      workspaces: [],
      activeWorkspaceId: null,
      hydrated: false,
    });
  });

  describe('getUserDisplayRole', () => {
    it('returns Guest for null user', () => {
      expect(getUserDisplayRole(null)).toBe('Guest');
    });

    it('returns Super Admin for isSuperAdmin flag', () => {
      const user: AuthUser = {
        id: 'u1',
        email: 'admin@acme.com',
        name: 'Admin',
        isSuperAdmin: true,
      };
      expect(getUserDisplayRole(user)).toBe('Super Admin');
    });

    it('derives role from roles array with standard security roles and custom roles', () => {
      expect(getUserDisplayRole({ id: '1', email: 'a', name: 'a', roles: ['SUPER_ADMIN'] })).toBe(
        'Super Admin',
      );
      expect(getUserDisplayRole({ id: '1', email: 'a', name: 'a', roles: ['HR_ADMIN'] })).toBe(
        'HR Administrator',
      );
      expect(getUserDisplayRole({ id: '1', email: 'a', name: 'a', roles: ['HR_EXECUTIVE'] })).toBe(
        'HR Executive',
      );
      expect(
        getUserDisplayRole({ id: '1', email: 'a', name: 'a', roles: [{ code: 'PAYROLL_ADMIN' }] }),
      ).toBe('Payroll Admin');
      expect(
        getUserDisplayRole({ id: '1', email: 'a', name: 'a', roles: ['ATTENDANCE_MANAGER'] }),
      ).toBe('Attendance Manager');
      expect(getUserDisplayRole({ id: '1', email: 'a', name: 'a', roles: ['SCM_ADMIN'] })).toBe(
        'SCM Admin',
      );
      expect(
        getUserDisplayRole({ id: '1', email: 'a', name: 'a', roles: ['SITE_SUPERVISOR'] }),
      ).toBe('Site Supervisor');
      expect(getUserDisplayRole({ id: '1', email: 'a', name: 'a', roles: ['EMPLOYEE'] })).toBe(
        'Employee',
      );
      expect(
        getUserDisplayRole({ id: '1', email: 'a', name: 'a', roles: [{ name: 'Custom Auditor' }] }),
      ).toBe('Custom Auditor');
      expect(
        getUserDisplayRole({ id: '1', email: 'a', name: 'a', roles: ['CUSTOM_UNKNOWN'] }),
      ).toBe('CUSTOM_UNKNOWN');
    });

    it('falls back to jobTitle, designation, or role', () => {
      expect(
        getUserDisplayRole({
          id: 'u1',
          email: 'test@acme.com',
          name: 'Test',
          jobTitle: 'Senior Recruiter',
        }),
      ).toBe('Senior Recruiter');

      expect(
        getUserDisplayRole({
          id: 'u1',
          email: 'test@acme.com',
          name: 'Test',
          designation: 'Operations Lead',
        }),
      ).toBe('Operations Lead');

      expect(getUserDisplayRole({ id: '1', email: 'a', name: 'a', role: 'ADMIN' })).toBe(
        'Super Admin',
      );
      expect(getUserDisplayRole({ id: '1', email: 'a', name: 'a', role: 'SUPER_ADMIN' })).toBe(
        'Super Admin',
      );
      expect(getUserDisplayRole({ id: '1', email: 'a', name: 'a', role: 'HR_ADMIN' })).toBe(
        'HR Administrator',
      );
      expect(getUserDisplayRole({ id: '1', email: 'a', name: 'a', role: 'HR_EXECUTIVE' })).toBe(
        'HR Executive',
      );
      expect(getUserDisplayRole({ id: '1', email: 'a', name: 'a', role: 'EMPLOYEE' })).toBe(
        'Employee',
      );
      expect(getUserDisplayRole({ id: '1', email: 'a', name: 'a', role: 'CUSTOM_ROLE' })).toBe(
        'CUSTOM_ROLE',
      );
      expect(getUserDisplayRole({ id: '1', email: 'a', name: 'a' })).toBe('Employee');
    });
  });

  describe('useAuthStore State Management', () => {
    it('sets auth credentials with and without workspaceId', () => {
      const userWithWs: AuthUser = {
        id: 'u1',
        email: 'user@example.com',
        name: 'Jane Doe',
        workspaceId: 'ws-123',
      };

      useAuthStore.getState().setAuth('jwt-token-abc', userWithWs);

      let state = useAuthStore.getState();
      expect(state.token).toBe('jwt-token-abc');
      expect(state.user?.name).toBe('Jane Doe');
      expect(state.activeWorkspaceId).toBe('ws-123');
      expect(state.workspaces.length).toBe(1);

      // Without workspaceId
      localStorage.clear();
      const userNoWs: AuthUser = { id: 'u2', email: 'u2@example.com', name: 'No Ws' };
      useAuthStore.getState().setAuth('jwt-token-xyz', userNoWs);
      state = useAuthStore.getState();
      expect(state.token).toBe('jwt-token-xyz');
    });

    it('updates token and user', () => {
      useAuthStore.getState().setToken('new-token');
      expect(useAuthStore.getState().token).toBe('new-token');

      useAuthStore.getState().setUser({ id: 'u2', email: 'u2@example.com', name: 'User Two' });
      expect(useAuthStore.getState().user?.name).toBe('User Two');
    });

    it('handles workspaces management (set, add, switch, mongo _id format)', () => {
      // Test invalid workspaces input
      useAuthStore.getState().setWorkspaces(null as unknown as []);
      expect(useAuthStore.getState().workspaces).toEqual([]);

      // Test with Mongo _id format and activeId fallback
      localStorage.setItem('hr-dashboard-workspace-id', 'ws-active');
      useAuthStore.getState().setWorkspaces([
        { _id: 'ws-mongo-1', name: 'Mongo Ws' } as unknown as {
          id: string;
          name: string;
          slug: string;
          role: string;
        },
      ]);
      expect(useAuthStore.getState().workspaces[0]?.id).toBe('ws-mongo-1');

      // Normal set
      useAuthStore.getState().setWorkspaces([
        { id: 'ws-1', name: 'First', slug: 'first', role: 'ADMIN' },
        { id: 'ws-2', name: 'Second', slug: 'second', role: 'MEMBER' },
      ]);

      expect(useAuthStore.getState().workspaces.length).toBe(2);
      expect(useAuthStore.getState().activeWorkspaceId).toBe('ws-1');

      useAuthStore.getState().setActiveWorkspace('ws-2');
      expect(useAuthStore.getState().activeWorkspaceId).toBe('ws-2');

      useAuthStore.getState().addWorkspace({
        id: 'ws-3',
        name: 'Third',
        slug: 'third',
        role: 'ADMIN',
      });
      expect(useAuthStore.getState().workspaces.length).toBe(3);
      expect(useAuthStore.getState().activeWorkspaceId).toBe('ws-3');
    });

    it('handles hydration and logout', () => {
      localStorage.setItem('hr-dashboard-token', 'stored-token');
      localStorage.setItem('hr-dashboard-workspace-id', 'stored-ws');

      useAuthStore.getState().setHydrated();
      expect(useAuthStore.getState().token).toBe('stored-token');
      expect(useAuthStore.getState().activeWorkspaceId).toBe('stored-ws');
      expect(useAuthStore.getState().hydrated).toBe(true);

      useAuthStore.getState().logout();
      expect(useAuthStore.getState().token).toBeNull();
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().workspaces).toEqual([]);
      expect(useAuthStore.getState().activeWorkspaceId).toBeNull();
    });
  });
});
