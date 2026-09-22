import { apiClient } from '@/lib/client/api-client';
import type { SecurityRole, Permission, EffectivePermissionsData } from '../types/employee-iam';

function unwrapList<T>(res: unknown, fallbackKey?: string): T[] {
  if (Array.isArray(res)) return res;
  if (typeof res === 'object' && res !== null) {
    const obj = res as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as T[];
    if (Array.isArray(obj.records)) return obj.records as T[];
    if (fallbackKey && Array.isArray(obj[fallbackKey])) return obj[fallbackKey] as T[];
  }
  return [];
}

function unwrapData<T>(res: unknown): T {
  if (typeof res === 'object' && res !== null) {
    const obj = res as Record<string, unknown>;
    if (obj.data && typeof obj.data === 'object') return obj.data as T;
  }
  return res as T;
}

export class IamService {
  /**
   * Fetches all available security roles from the catalog.
   * Route: GET /api/v1/authorization/roles
   */
  static async getSecurityRoles(): Promise<SecurityRole[]> {
    try {
      const res = await apiClient<unknown>('/authorization/roles');
      return unwrapList<SecurityRole>(res, 'roles');
    } catch (err) {
      console.warn('Failed to load authorization roles, returning fallback roles', err);
      return [];
    }
  }

  /**
   * Fetches all atomic permissions from the catalog.
   * Route: GET /api/v1/authorization/permissions
   */
  static async getAtomicPermissions(): Promise<Permission[]> {
    try {
      const res = await apiClient<unknown>('/authorization/permissions');
      return unwrapList<Permission>(res, 'permissions');
    } catch (err) {
      console.warn('Failed to load permissions catalog', err);
      return [];
    }
  }

  /**
   * Assigns a security role to an employee.
   * Route: POST /api/v1/iam/employees/:id/roles
   */
  static async assignSecurityRole(
    employeeId: string,
    roleId: string,
    scope?: string | null,
  ): Promise<{ assignmentId: string; employeeId: string; roleId: string }> {
    const payload: Record<string, unknown> = { roleId };
    if (scope) {
      payload.scope = scope;
    }

    const res = await apiClient<unknown>(`/iam/employees/${employeeId}/roles`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return unwrapData(res);
  }

  /**
   * Revokes a security role from an employee.
   * Route: DELETE /api/v1/iam/employees/:id/roles/:roleId
   */
  static async revokeSecurityRole(employeeId: string, roleId: string): Promise<void> {
    await apiClient<unknown>(`/iam/employees/${employeeId}/roles/${roleId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Adds a direct GRANT permission override for an employee.
   * Route: POST /api/v1/iam/employees/:id/permissions/grant
   */
  static async grantDirectPermission(
    employeeId: string,
    permissionId: string,
    reason?: string,
  ): Promise<void> {
    await apiClient<unknown>(`/iam/employees/${employeeId}/permissions/grant`, {
      method: 'POST',
      body: JSON.stringify({ permissionId, reason: reason ?? 'Direct permission grant' }),
    });
  }

  /**
   * Adds an explicit DENY permission override for an employee.
   * Route: POST /api/v1/iam/employees/:id/permissions/deny
   */
  static async denyDirectPermission(
    employeeId: string,
    permissionId: string,
    reason?: string,
  ): Promise<void> {
    await apiClient<unknown>(`/iam/employees/${employeeId}/permissions/deny`, {
      method: 'POST',
      body: JSON.stringify({ permissionId, reason: reason ?? 'Explicit permission restriction' }),
    });
  }

  /**
   * Removes a direct permission override (GRANT or DENY).
   * Route: DELETE /api/v1/iam/employees/:id/permissions/:permissionId
   */
  static async revokeDirectPermission(employeeId: string, permissionId: string): Promise<void> {
    await apiClient<unknown>(`/iam/employees/${employeeId}/permissions/${permissionId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Sets or updates employee credentials.
   * Route: POST /api/v1/iam/employees/:id/password
   */
  static async setEmployeePassword(
    employeeId: string,
    password: string,
    forceChange = true,
  ): Promise<{ message: string }> {
    const res = await apiClient<unknown>(`/iam/employees/${employeeId}/password`, {
      method: 'POST',
      body: JSON.stringify({ password, forceChange }),
    });
    return unwrapData(res);
  }

  /**
   * Fetches real-time computed effective permissions for an employee.
   * Route: GET /api/v1/iam/employees/:id/permissions
   */
  static async getEffectivePermissions(employeeId: string): Promise<EffectivePermissionsData> {
    try {
      const res = await apiClient<unknown>(`/iam/employees/${employeeId}/permissions`);
      const raw = (unwrapData<Record<string, unknown>>(res) || {}) as Record<string, unknown>;

      let assignedRoles: unknown[] = [];
      if (Array.isArray(raw)) {
        // Direct array response
      } else if (typeof raw === 'object' && raw !== null) {
        if (Array.isArray(raw.assignedRoles)) assignedRoles = raw.assignedRoles;
        else if (Array.isArray(raw.roles)) assignedRoles = raw.roles;
        else if (Array.isArray(raw.userRoles)) assignedRoles = raw.userRoles;
        else if (Array.isArray(raw.user_roles)) assignedRoles = raw.user_roles;
        else if (Array.isArray(raw.securityRoles)) assignedRoles = raw.securityRoles;
      }

      let rawOverridesList: unknown[] = [];
      if (Array.isArray(raw)) {
        rawOverridesList = raw;
      } else if (typeof raw === 'object' && raw !== null) {
        if (Array.isArray(raw.directOverrides)) rawOverridesList = raw.directOverrides;
        else if (Array.isArray(raw.directPermissions)) rawOverridesList = raw.directPermissions;
        else if (Array.isArray(raw.direct_permissions)) rawOverridesList = raw.direct_permissions;
        else if (Array.isArray(raw.overrides)) rawOverridesList = raw.overrides;
        else if (Array.isArray(raw.userPermissions)) rawOverridesList = raw.userPermissions;
        else if (Array.isArray(raw.user_permissions)) rawOverridesList = raw.user_permissions;
        else if (Array.isArray(raw.granularPermissions)) rawOverridesList = raw.granularPermissions;
        else if (Array.isArray(raw.customPermissions)) rawOverridesList = raw.customPermissions;
        else if (
          Array.isArray(raw.permissions) &&
          raw.permissions.some(
            (p) =>
              p &&
              typeof p === 'object' &&
              ('type' in p || 'effect' in p || 'isGranted' in p || 'granted' in p || 'action' in p),
          )
        ) {
          rawOverridesList = raw.permissions;
        }
      }

      const normalizedOverrides = rawOverridesList
        .map((item: unknown) => {
          if (!item || typeof item !== 'object') return null;
          const obj = item as Record<string, unknown>;
          const nestedPerm = (obj.permission ?? obj.perm ?? {}) as Record<string, unknown>;

          const permissionId = (obj.permissionId ??
            obj.permission_id ??
            nestedPerm.id ??
            obj.permId ??
            (obj.type || obj.effect ? obj.id : undefined)) as string | undefined;

          const code = (obj.code ??
            obj.permissionCode ??
            obj.permission_code ??
            nestedPerm.code ??
            '') as string;

          const name = (obj.name ??
            obj.permissionName ??
            obj.permission_name ??
            nestedPerm.name ??
            code) as string;

          let explicitType = '';
          if (obj.type != null) explicitType = String(obj.type);
          else if (obj.effect != null) explicitType = String(obj.effect);
          else if (obj.action != null) explicitType = String(obj.action);
          else if (obj.isGranted === true || obj.granted === true || obj.grant === true)
            explicitType = 'GRANT';
          else if (obj.isGranted === false || obj.granted === false || obj.grant === false)
            explicitType = 'DENY';
          else explicitType = 'GRANT';

          const rawType = explicitType.toUpperCase();

          const type: 'GRANT' | 'DENY' =
            rawType.includes('DENY') || rawType.includes('REVOKE') || rawType.includes('RESTRICT')
              ? 'DENY'
              : 'GRANT';

          const reason = (obj.reason ?? obj.justification ?? '') as string | undefined;

          if (!permissionId && !code) return null;

          return {
            permissionId: permissionId || code,
            code,
            name,
            type,
            reason: reason || undefined,
          };
        })
        .filter(Boolean) as EffectivePermissionsData['directOverrides'];

      let effectivePermissions: string[] = [];
      if (typeof raw === 'object' && raw !== null) {
        if (Array.isArray(raw.effectivePermissions)) {
          effectivePermissions = (raw.effectivePermissions as unknown[])
            .map((p: unknown): string => {
              if (typeof p === 'string') return p;
              if (p && typeof p === 'object') {
                const rec = p as Record<string, unknown>;
                return String(rec.code || rec.id || '');
              }
              return String(p ?? '');
            })
            .filter((s: string) => Boolean(s));
        } else if (
          Array.isArray(raw.permissions) &&
          (!rawOverridesList.length || rawOverridesList !== raw.permissions)
        ) {
          effectivePermissions = (raw.permissions as unknown[])
            .map((p: unknown): string => {
              if (typeof p === 'string') return p;
              if (p && typeof p === 'object') {
                const rec = p as Record<string, unknown>;
                return String(rec.code || rec.id || '');
              }
              return String(p ?? '');
            })
            .filter((s: string) => Boolean(s));
        }
      }

      return {
        employeeId: (raw.employeeId as string) || employeeId,
        userId: raw.userId as string | undefined,
        assignedRoles: assignedRoles as EffectivePermissionsData['assignedRoles'],
        directOverrides: normalizedOverrides,
        effectivePermissions,
      };
    } catch (err) {
      console.warn('Failed to load effective permissions', err);
      return {
        employeeId,
        assignedRoles: [],
        directOverrides: [],
        effectivePermissions: [],
      };
    }
  }
}
