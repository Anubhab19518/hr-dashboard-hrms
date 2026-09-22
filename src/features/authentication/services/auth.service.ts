import { apiClient } from '@/lib/client/api-client';
import type { Workspace, AuthUser } from '@/lib/client/auth-store';
import type {
  AdminLoginResponse,
  RefreshResponse,
  CreateWorkspaceResponse,
} from '../types/auth.types';
import type {
  AdminLoginInput,
  EmployeeLoginInput,
  UnifiedLoginInput,
  CreateWorkspaceInput,
} from '../schemas/login.schema';

/**
 * AuthService — client-side service for authentication and workspace session management.
 * All methods call the external backend API via the centralized apiClient.
 */
export class AuthService {
  /**
   * POST /auth/admin/login
   * Authenticates an admin using email and password.
   */
  static async adminLogin(input: AdminLoginInput): Promise<AdminLoginResponse> {
    const payload = {
      email: input.email.trim().toLowerCase(),
      password: input.password,
    };

    try {
      return await apiClient<AdminLoginResponse>('/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify(payload),
        skipAuth: true,
      });
    } catch (err: unknown) {
      // Fallback endpoint if nested under /users/auth/admin/login
      try {
        return await apiClient<AdminLoginResponse>('/users/auth/admin/login', {
          method: 'POST',
          body: JSON.stringify(payload),
          skipAuth: true,
        });
      } catch {
        throw err;
      }
    }
  }

  /**
   * POST /auth/employee/login
   * Authenticates an employee / staff using employee code and password.
   */
  static async employeeLogin(input: EmployeeLoginInput): Promise<AdminLoginResponse> {
    const cleanCode = input.employeeCode.trim();
    const payload = {
      employeeCode: cleanCode,
      code: cleanCode,
      loginIdentifier: cleanCode,
      password: input.password,
    };

    const endpoints = [
      '/auth/employee/login',
      '/users/auth/employee/login',
      '/auth/login',
      '/users/auth/login',
    ];

    let lastError: unknown = null;
    for (const endpoint of endpoints) {
      try {
        return await apiClient<AdminLoginResponse>(endpoint, {
          method: 'POST',
          body: JSON.stringify(payload),
          skipAuth: true,
        });
      } catch (err: unknown) {
        lastError = err;
      }
    }

    throw lastError;
  }

  /**
   * Unified login supporting either Email Address or Employee Code.
   */
  static async login(input: UnifiedLoginInput): Promise<AdminLoginResponse> {
    const identifier = input.identifier.trim();
    const isEmail = identifier.includes('@');

    if (isEmail) {
      try {
        return await AuthService.adminLogin({
          email: identifier,
          password: input.password,
        });
      } catch (err) {
        // In case an employee login uses email
        try {
          return await AuthService.employeeLogin({
            employeeCode: identifier,
            password: input.password,
          });
        } catch {
          throw err;
        }
      }
    } else {
      try {
        return await AuthService.employeeLogin({
          employeeCode: identifier,
          password: input.password,
        });
      } catch (err) {
        // In case an admin username was passed
        try {
          return await AuthService.adminLogin({
            email: identifier,
            password: input.password,
          });
        } catch {
          throw err;
        }
      }
    }
  }

  /**
   * POST /auth/refresh
   * Rotates the session token using the HttpOnly refresh_token cookie.
   */
  static async refresh(): Promise<RefreshResponse> {
    try {
      return await apiClient<RefreshResponse>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({}),
        skipAuth: true,
      });
    } catch (err: unknown) {
      try {
        return await apiClient<RefreshResponse>('/users/auth/refresh', {
          method: 'POST',
          body: JSON.stringify({}),
          skipAuth: true,
        });
      } catch {
        throw err;
      }
    }
  }

  /**
   * POST /auth/logout
   * Revokes the session family and clears backend refresh tokens.
   */
  static async logout(): Promise<void> {
    try {
      await apiClient('/auth/logout', {
        method: 'POST',
      });
    } catch {
      try {
        await apiClient('/users/auth/logout', {
          method: 'POST',
        });
      } catch {
        // Ignore logout errors during network disconnect
      }
    }
  }

  /**
   * GET /users/me
   * Fetches the current user profile.
   */
  static async getMe(): Promise<AuthUser> {
    return apiClient<AuthUser>('/users/me');
  }

  /**
   * PATCH /users/profile
   * Updates user profile fields.
   */
  static async updateProfile(data: { name?: string; phoneNumber?: string }): Promise<void> {
    await apiClient('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * GET /workspaces
   * Lists all workspaces the current user belongs to.
   */
  static async listWorkspaces(): Promise<Workspace[]> {
    const res = await apiClient<Workspace[] | { records: Workspace[] }>('/workspaces');
    if (Array.isArray(res)) return res;
    if (res && 'records' in res && Array.isArray(res.records)) return res.records;
    return [];
  }

  /**
   * POST /workspaces
   * Creates a new workspace.
   */
  static async createWorkspace(input: CreateWorkspaceInput): Promise<CreateWorkspaceResponse> {
    return apiClient<CreateWorkspaceResponse>('/workspaces', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  /**
   * GET /workspaces/current
   * Gets information about the currently active workspace.
   */
  static async getCurrentWorkspace(): Promise<{ id: string; name: string; slug: string }> {
    return apiClient('/workspaces/current');
  }
}
