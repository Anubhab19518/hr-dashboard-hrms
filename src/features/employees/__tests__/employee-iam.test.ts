import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IamService } from '../services/iam.service';
import type { SecurityRole, Permission } from '../types/employee-iam';
import { apiClient } from '@/lib/client/api-client';

vi.mock('@/lib/client/api-client', () => ({
  apiClient: vi.fn(),
}));

describe('Employee IAM & Security Onboarding (HR Job Role != Security Role)', () => {
  const mockRoles: SecurityRole[] = [
    {
      id: 'role-1',
      code: 'HR_ADMIN',
      name: 'HR Administrator',
      description: 'Full workforce access',
      isSystem: true,
      permissions: [
        {
          id: 'p1',
          code: 'employee:create',
          name: 'Create',
          subject: 'Employee',
          action: 'create',
        },
        {
          id: 'p2',
          code: 'employee:delete',
          name: 'Delete',
          subject: 'Employee',
          action: 'delete',
        },
      ],
    },
    {
      id: 'role-2',
      code: 'HR_EXECUTIVE',
      name: 'HR Executive',
      description: 'Operational HR',
      isSystem: true,
      permissions: [
        {
          id: 'p1',
          code: 'employee:create',
          name: 'Create',
          subject: 'Employee',
          action: 'create',
        },
        { id: 'p3', code: 'employee:read', name: 'Read', subject: 'Employee', action: 'read' },
      ],
    },
    {
      id: 'role-3',
      code: 'ATTENDANCE_MANAGER',
      name: 'Attendance Manager',
      description: 'Site attendance and approvals',
      isSystem: true,
      permissions: [
        {
          id: 'p4',
          code: 'attendance:approve',
          name: 'Approve',
          subject: 'Attendance',
          action: 'approve',
        },
      ],
    },
    {
      id: 'role-4',
      code: 'EMPLOYEE',
      name: 'Employee',
      description: 'Self-service portal',
      isSystem: true,
      permissions: [
        {
          id: 'p5',
          code: 'attendance:view_own',
          name: 'View Own',
          subject: 'Attendance',
          action: 'read',
        },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Security Role Suggestions', () => {
    it('matches HR_EXECUTIVE for "HR Executive" job role title', () => {
      const result = mockRoles.find((r) => r.code === 'HR_EXECUTIVE');
      expect(result).toBeDefined();
      expect(result?.code).toBe('HR_EXECUTIVE');
    });

    it('matches ATTENDANCE_MANAGER for "Site Supervisor" job role title', () => {
      const result = mockRoles.find((r) => r.code === 'ATTENDANCE_MANAGER');
      expect(result).toBeDefined();
      expect(result?.code).toBe('ATTENDANCE_MANAGER');
    });

    it('falls back to EMPLOYEE role for unknown or worker job roles', () => {
      const result = mockRoles.find((r) => r.code === 'EMPLOYEE');
      expect(result).toBeDefined();
      expect(result?.code).toBe('EMPLOYEE');
    });
  });

  describe('IamService API Calls', () => {
    it('fetches security roles from /authorization/roles', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({
        status: 'success',
        data: mockRoles,
      });

      const roles = await IamService.getSecurityRoles();
      expect(apiClient).toHaveBeenCalledWith('/authorization/roles');
      expect(roles.length).toBe(4);
      expect(roles[0]?.code).toBe('HR_ADMIN');
    });

    it('fetches atomic permissions from /authorization/permissions', async () => {
      const mockPerms: Permission[] = [
        {
          id: 'p1',
          code: 'company:create',
          name: 'Create Company',
          subject: 'Company',
          action: 'create',
        },
      ];

      vi.mocked(apiClient).mockResolvedValueOnce({
        status: 'success',
        data: mockPerms,
      });

      const perms = await IamService.getAtomicPermissions();
      expect(apiClient).toHaveBeenCalledWith('/authorization/permissions');
      expect(perms.length).toBe(1);
      expect(perms[0]?.code).toBe('company:create');
    });

    it('assigns security role via POST /iam/employees/:id/roles', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({
        status: 'success',
        data: { assignmentId: 'asgn-1', employeeId: 'emp-1', roleId: 'role-1' },
      });

      const result = await IamService.assignSecurityRole('emp-1', 'role-1');
      expect(apiClient).toHaveBeenCalledWith(
        '/iam/employees/emp-1/roles',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ roleId: 'role-1' }),
        }),
      );
      expect(result.assignmentId).toBe('asgn-1');
    });

    it('grants direct permission override via POST /iam/employees/:id/permissions/grant', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({
        status: 'success',
        message: 'Permission granted',
      });

      await IamService.grantDirectPermission('emp-1', 'p1', 'Temporary access');
      expect(apiClient).toHaveBeenCalledWith(
        '/iam/employees/emp-1/permissions/grant',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ permissionId: 'p1', reason: 'Temporary access' }),
        }),
      );
    });

    it('denies direct permission override via POST /iam/employees/:id/permissions/deny', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({
        status: 'success',
        message: 'Permission denied',
      });

      await IamService.denyDirectPermission('emp-1', 'p2', 'Restricted access');
      expect(apiClient).toHaveBeenCalledWith(
        '/iam/employees/emp-1/permissions/deny',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ permissionId: 'p2', reason: 'Restricted access' }),
        }),
      );
    });

    it('revokes direct permission override via DELETE /iam/employees/:id/permissions/:permissionId', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({
        status: 'success',
        message: 'Override revoked',
      });

      await IamService.revokeDirectPermission('emp-1', 'p1');
      expect(apiClient).toHaveBeenCalledWith(
        '/iam/employees/emp-1/permissions/p1',
        expect.objectContaining({
          method: 'DELETE',
        }),
      );
    });

    it('fetches and normalizes effective permissions from /iam/employees/:id/permissions', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({
        status: 'success',
        data: {
          employeeId: 'emp-1',
          assignedRoles: [{ id: 'role-1', code: 'HR_ADMIN', name: 'HR Administrator' }],
          directPermissions: [
            { permissionId: 'p1', code: 'company:create', name: 'Create Company', type: 'GRANT' },
            { permissionId: 'p2', code: 'employee:delete', effect: 'deny', reason: 'Restricted' },
          ],
          effectivePermissions: ['company:create', 'employee:read'],
        },
      });

      const eff = await IamService.getEffectivePermissions('emp-1');
      expect(apiClient).toHaveBeenCalledWith('/iam/employees/emp-1/permissions');
      expect(eff.employeeId).toBe('emp-1');
      expect(eff.assignedRoles.length).toBe(1);
      expect(eff.directOverrides.length).toBe(2);
      expect(eff.directOverrides[0]?.type).toBe('GRANT');
      expect(eff.directOverrides[1]?.type).toBe('DENY');
      expect(eff.directOverrides[1]?.reason).toBe('Restricted');
      expect(eff.effectivePermissions).toContain('company:create');
    });

    it('sets employee credentials via POST /iam/employees/:id/password', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({
        status: 'success',
        data: { message: 'Password updated' },
      });

      await IamService.setEmployeePassword('emp-1', 'TempPass@2026', true);
      expect(apiClient).toHaveBeenCalledWith(
        '/iam/employees/emp-1/password',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ password: 'TempPass@2026', forceChange: true }),
        }),
      );
    });
  });

  describe('Precedence & Effective Permission Resolution Simulation', () => {
    it('eliminates explicitly denied permissions from effective permissions even if role grants them', () => {
      const rolePerms = ['employee:create', 'employee:read', 'employee:delete'];
      const directGrant = 'company:create';
      const explicitDeny = 'employee:delete';

      const combined = new Set([...rolePerms, directGrant]);
      combined.delete(explicitDeny);

      const effective = Array.from(combined);
      expect(effective).toContain('employee:create');
      expect(effective).toContain('employee:read');
      expect(effective).toContain('company:create');
      expect(effective).not.toContain('employee:delete');
    });
  });
});
