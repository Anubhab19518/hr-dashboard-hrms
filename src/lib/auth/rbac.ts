export type Role = 'admin' | 'hr_manager' | 'supervisor' | 'viewer';

export type Permission =
  | 'employees:read'
  | 'employees:create'
  | 'employees:update'
  | 'employees:delete'
  | 'attendance:read'
  | 'attendance:create'
  | 'organization:read'
  | 'organization:manage'
  | 'safety:read'
  | 'safety:resolve'
  | 'workspaces:create'
  | 'workspaces:manage';

export interface UserSession {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly role: Role;
}

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  admin: [
    'employees:read',
    'employees:create',
    'employees:update',
    'employees:delete',
    'attendance:read',
    'attendance:create',
    'organization:read',
    'organization:manage',
    'safety:read',
    'safety:resolve',
    'workspaces:create',
    'workspaces:manage',
  ],
  hr_manager: [
    'employees:read',
    'employees:create',
    'employees:update',
    'attendance:read',
    'attendance:create',
    'organization:read',
    'organization:manage',
    'safety:read',
    'safety:resolve',
  ],
  supervisor: [
    'employees:read',
    'attendance:read',
    'attendance:create',
    'organization:read',
    'safety:read',
  ],
  viewer: ['employees:read', 'attendance:read', 'organization:read', 'safety:read'],
};

/**
 * Validates whether a user has a specific permission.
 */
export function hasPermission(user: UserSession, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[user.role] ?? [];
  return permissions.includes(permission);
}

/**
 * Asserts authorization, throwing an error if the user lacks the permission.
 */
export function assertAuthorized(user: UserSession, permission: Permission): void {
  if (!hasPermission(user, permission)) {
    throw new Error(`Unauthorized: Role '${user.role}' lacks permission '${permission}'`);
  }
}
