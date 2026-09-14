export type Role = 'admin' | 'manager' | 'viewer';

export type Permission =
  | 'orders:read'
  | 'orders:create'
  | 'orders:update'
  | 'orders:delete'
  | 'orders:approve_high_value'
  | 'users:manage';

export interface UserSession {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly role: Role;
}

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  admin: [
    'orders:read',
    'orders:create',
    'orders:update',
    'orders:delete',
    'orders:approve_high_value',
    'users:manage',
  ],
  manager: ['orders:read', 'orders:create', 'orders:update', 'orders:approve_high_value'],
  viewer: ['orders:read'],
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
