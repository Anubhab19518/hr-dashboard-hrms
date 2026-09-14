import type { UserSession } from '@/lib/auth/rbac';

export interface AuthState {
  readonly user: UserSession | null;
  readonly isAuthenticated: boolean;
}

export type AuthActionResult =
  | { readonly success: true; readonly user: UserSession }
  | {
      readonly success: false;
      readonly error: string;
      readonly fieldErrors?: Record<string, string[]>;
    };
