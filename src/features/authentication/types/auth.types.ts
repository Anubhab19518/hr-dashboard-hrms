import type { AuthUser, Workspace } from '@/lib/client/auth-store';

/**
 * Admin / Employee login response from backend identity endpoints
 */
export interface AdminLoginResponse {
  readonly accessToken: string;
  readonly refreshToken?: string;
  readonly forceChange?: boolean;
  readonly user: AuthUser;
}

export type EmployeeLoginResponse = AdminLoginResponse;

/**
 * Refresh token response from POST /api/v1/auth/refresh
 */
export interface RefreshResponse {
  readonly accessToken: string;
  readonly refreshToken?: string;
  readonly user?: AuthUser;
}

/**
 * Login form state tracking.
 */
export interface UnifiedLoginState {
  readonly identifier: string;
  readonly password: string;
  readonly isLoading: boolean;
  readonly errorMessage: string | null;
  readonly successMessage: string | null;
}

export type AdminLoginState = UnifiedLoginState;

/**
 * Response from GET /users/me
 */
export type MeResponse = AuthUser & {
  readonly workspaces?: Workspace[];
};

/**
 * Response from POST /workspaces
 */
export interface CreateWorkspaceResponse {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
}
