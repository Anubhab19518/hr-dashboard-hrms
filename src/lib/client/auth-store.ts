'use client';

import { create } from 'zustand';
import { clientEnv } from '@/lib/env/client';

/**
 * Workspace — a tenant context returned by the backend.
 */
export interface Workspace {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly role: string;
}

/**
 * AuthUser — authenticated user profile.
 */
export interface AuthUser {
  readonly id: string;
  readonly email: string;
  readonly name: string | null;
  readonly phoneNumber?: string | null;
  readonly avatarUrl?: string | null;
  readonly status?: string;
  readonly isSuperAdmin?: boolean;
  readonly isEmailVerified?: boolean;
  readonly role?: string | null;
  readonly roles?: string[] | Array<{ id?: string; name?: string; code?: string }>;
  readonly employeeId?: string | null;
  readonly employeeCode?: string | null;
  readonly jobTitle?: string | null;
  readonly designation?: string | null;
  readonly workspaceId?: string | null;
}

/**
 * Derives the human-readable display role from user attributes and security roles.
 */
export function getUserDisplayRole(user: AuthUser | null): string {
  if (!user) return 'Guest';
  if (user.isSuperAdmin) return 'Super Admin';

  if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
    const roleCodes = user.roles.map((r) =>
      typeof r === 'string' ? r.toUpperCase() : (r.code || r.name || '').toUpperCase(),
    );
    if (roleCodes.includes('SUPER_ADMIN')) return 'Super Admin';
    if (roleCodes.includes('HR_ADMIN')) return 'HR Administrator';
    if (roleCodes.includes('HR_EXECUTIVE')) return 'HR Executive';
    if (roleCodes.includes('PAYROLL_ADMIN')) return 'Payroll Admin';
    if (roleCodes.includes('ATTENDANCE_MANAGER')) return 'Attendance Manager';
    if (roleCodes.includes('SCM_ADMIN')) return 'SCM Admin';
    if (roleCodes.includes('SITE_SUPERVISOR')) return 'Site Supervisor';
    if (roleCodes.includes('EMPLOYEE')) return 'Employee';

    const firstRole = user.roles[0];
    const name = typeof firstRole === 'string' ? firstRole : firstRole?.name || firstRole?.code;
    if (name) return name;
  }

  if (user.jobTitle) return user.jobTitle;
  if (user.designation) return user.designation;
  if (user.role) {
    const r = user.role.toUpperCase();
    if (r === 'ADMIN' || r === 'SUPER_ADMIN') return 'Super Admin';
    if (r === 'HR_ADMIN') return 'HR Administrator';
    if (r === 'HR_EXECUTIVE') return 'HR Executive';
    if (r === 'EMPLOYEE') return 'Employee';
    return user.role;
  }

  return 'Employee';
}

interface AuthState {
  /** JWT access token from OTP verification */
  token: string | null;
  /** Authenticated user profile */
  user: AuthUser | null;
  /** Workspaces the user belongs to */
  workspaces: Workspace[];
  /** Currently active workspace ID (sent in x-workspace-id header) */
  activeWorkspaceId: string | null;
  /** Whether initial hydration from localStorage is complete */
  hydrated: boolean;
}

interface AuthActions {
  /** Persist auth credentials after login */
  setAuth: (token: string, user: AuthUser) => void;
  /** Update in-memory / storage access token after transparent refresh */
  setToken: (token: string) => void;
  /** Set available workspaces after fetching /users/me or /workspaces */
  setWorkspaces: (workspaces: Workspace[]) => void;
  /** Add a newly created workspace and make it active */
  addWorkspace: (workspace: Workspace) => void;
  /** Switch active workspace */
  setActiveWorkspace: (id: string) => void;
  /** Update user profile data */
  setUser: (user: AuthUser) => void;
  /** Clear all auth state and localStorage */
  logout: () => void;
  /** Mark hydration as complete */
  setHydrated: () => void;
}

const STORAGE_KEYS = {
  token: 'hr-dashboard-token',
  workspaceId: 'hr-dashboard-workspace-id',
} as const;

function readStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  } catch {
    // Storage unavailable (e.g. incognito with quota exceeded)
  }
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  token: null,
  user: null,
  workspaces: [],
  activeWorkspaceId: null,
  hydrated: false,

  setAuth: (token, user) => {
    writeStorage(STORAGE_KEYS.token, token);
    const existingWsId = readStorage(STORAGE_KEYS.workspaceId);
    const wsId = user.workspaceId || existingWsId;
    if (wsId) {
      writeStorage(STORAGE_KEYS.workspaceId, wsId);
      set((state) => ({
        token,
        user,
        activeWorkspaceId: wsId,
        workspaces:
          state.workspaces.length > 0
            ? state.workspaces
            : [
                {
                  id: wsId,
                  name: 'Main Workspace',
                  slug: 'main-workspace',
                  role: user.role || 'ADMIN',
                },
              ],
      }));
    } else {
      set({ token, user });
    }
  },

  setToken: (token) => {
    writeStorage(STORAGE_KEYS.token, token);
    set({ token });
  },

  setWorkspaces: (workspaces) => {
    const valid = Array.isArray(workspaces)
      ? workspaces
          .filter((w): w is Workspace =>
            Boolean(w && (w.id || (w as unknown as { _id?: string })._id)),
          )
          .map((w) => ({
            id: w.id || (w as unknown as { _id?: string })._id || '',
            name: w.name || 'Workspace',
            slug: w.slug || 'workspace',
            role: w.role || 'ADMIN',
          }))
      : [];

    const currentWsId = readStorage(STORAGE_KEYS.workspaceId);
    let activeId = currentWsId;

    if (valid.length > 0) {
      if (!activeId || !valid.some((w) => w.id === activeId)) {
        activeId = valid[0]?.id || null;
      }
    } else if (activeId) {
      valid.push({
        id: activeId,
        name: 'Main Workspace',
        slug: 'main-workspace',
        role: 'ADMIN',
      });
    }

    if (activeId) {
      writeStorage(STORAGE_KEYS.workspaceId, activeId);
    }
    set({ workspaces: valid, activeWorkspaceId: activeId ?? null });
  },

  addWorkspace: (workspace) => {
    if (!workspace) return;
    const wsId =
      workspace.id || (workspace as unknown as { _id?: string })._id || `ws-${Date.now()}`;
    const normalized: Workspace = {
      id: wsId,
      name: workspace.name || 'Workspace',
      slug: workspace.slug || 'workspace',
      role: workspace.role || 'ADMIN',
    };
    writeStorage(STORAGE_KEYS.workspaceId, wsId);
    set((state) => ({
      workspaces: [...state.workspaces.filter((w) => w && w.id && w.id !== wsId), normalized],
      activeWorkspaceId: wsId,
    }));
  },

  setActiveWorkspace: (id) => {
    writeStorage(STORAGE_KEYS.workspaceId, id);
    set({ activeWorkspaceId: id });
  },

  setUser: (user) => {
    set({ user });
  },

  logout: () => {
    // Attempt backend session revocation via /auth/logout
    if (typeof window !== 'undefined') {
      try {
        const token = useAuthStore.getState().token;
        fetch(`${clientEnv.NEXT_PUBLIC_API_BASE_URL}/auth/logout`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }).catch(() => {});
      } catch {
        // Ignore network errors during logout
      }
    }

    writeStorage(STORAGE_KEYS.token, null);
    writeStorage(STORAGE_KEYS.workspaceId, null);
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
      }
    } catch {
      // Ignore
    }
    set({
      token: null,
      user: null,
      workspaces: [],
      activeWorkspaceId: null,
    });
  },

  setHydrated: () => {
    const token = readStorage(STORAGE_KEYS.token);
    const activeWorkspaceId = readStorage(STORAGE_KEYS.workspaceId);
    set({ token, activeWorkspaceId, hydrated: true });
  },
}));
