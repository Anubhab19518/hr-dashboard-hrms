'use client';

import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/lib/client/auth-store';
import { apiClient } from '@/lib/client/api-client';
import type { AuthUser, Workspace } from '@/lib/client/auth-store';

/**
 * AuthProvider
 *
 * Hydrates the Zustand auth store from localStorage on mount,
 * then validates the stored token by calling GET /users/me and GET /workspaces.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const hydrated = useAuthStore((s) => s.hydrated);
  const setHydrated = useAuthStore((s) => s.setHydrated);
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);
  const setWorkspaces = useAuthStore((s) => s.setWorkspaces);
  const setActiveWorkspace = useAuthStore((s) => s.setActiveWorkspace);
  const logout = useAuthStore((s) => s.logout);

  // Step 1: Hydrate from localStorage
  useEffect(() => {
    if (!hydrated) {
      setHydrated();
    }
  }, [hydrated, setHydrated]);

  // Step 2: Validate stored token or restore session via refresh cookie against backend
  useEffect(() => {
    if (!hydrated) return;

    let cancelled = false;

    const validateOrRestoreSession = async () => {
      try {
        let currentToken = token;

        // If no token in memory/storage, attempt transparent cookie-based refresh
        if (!currentToken) {
          try {
            const refreshRes = await apiClient<{ accessToken?: string; user?: unknown }>(
              '/auth/refresh',
              {
                method: 'POST',
                skipAuth: true,
                body: JSON.stringify({}),
              },
            );
            if (refreshRes?.accessToken) {
              currentToken = refreshRes.accessToken;
              useAuthStore.getState().setToken(currentToken);
            }
          } catch {
            // No valid refresh cookie session — user remains unauthenticated
            return;
          }
        }

        if (!currentToken) return;

        const rawUserData = await apiClient<unknown>('/users/me', {
          token: currentToken,
        });
        if (cancelled) return;

        const rawObj = rawUserData as Record<string, unknown> | null;
        const userObj =
          rawObj && typeof rawObj === 'object' && 'user' in rawObj
            ? (rawObj.user as Record<string, unknown>)
            : (rawObj as Record<string, unknown> | null);

        if (!userObj) {
          throw new Error('Invalid user payload');
        }

        const user: AuthUser = {
          id: (userObj.id as string) || (userObj._id as string) || 'user-current',
          email: (userObj.email as string) || '',
          name: (userObj.name as string) ?? (userObj.email as string)?.split('@')[0] ?? 'User',
          phoneNumber: userObj.phoneNumber as string | undefined,
          avatarUrl: userObj.avatarUrl as string | undefined,
          status: userObj.status as string | undefined,
          isSuperAdmin: Boolean(userObj.isSuperAdmin),
          isEmailVerified: Boolean(userObj.isEmailVerified),
        };

        setAuth(currentToken, user);

        // Check if workspaces were returned inside the user object
        let workspacesList: Workspace[] = [];
        if (Array.isArray(userObj.workspaces) && userObj.workspaces.length > 0) {
          workspacesList = userObj.workspaces as Workspace[];
        }

        // Otherwise fetch /workspaces
        if (workspacesList.length === 0) {
          try {
            const workspacesData = await apiClient<unknown>('/workspaces', {
              token: currentToken,
            });
            if (Array.isArray(workspacesData)) {
              workspacesList = workspacesData as Workspace[];
            } else if (
              typeof workspacesData === 'object' &&
              workspacesData !== null &&
              'workspaces' in workspacesData &&
              Array.isArray((workspacesData as { workspaces: unknown[] }).workspaces)
            ) {
              workspacesList = (workspacesData as { workspaces: Workspace[] }).workspaces;
            } else if (
              typeof workspacesData === 'object' &&
              workspacesData !== null &&
              'records' in workspacesData &&
              Array.isArray((workspacesData as { records: unknown[] }).records)
            ) {
              workspacesList = (workspacesData as { records: Workspace[] }).records;
            }
          } catch {
            // No workspaces configured yet
          }
        }

        if (workspacesList.length > 0) {
          setWorkspaces(workspacesList);
          const currentStoredWsId = useAuthStore.getState().activeWorkspaceId;
          const matchingWs = workspacesList.find(
            (w) =>
              w &&
              (w.id === currentStoredWsId ||
                (w as unknown as { _id?: string })._id === currentStoredWsId),
          );
          if (matchingWs) {
            setActiveWorkspace(matchingWs.id || (matchingWs as unknown as { _id: string })._id);
          } else {
            const firstWs = workspacesList[0];
            if (firstWs) {
              setActiveWorkspace(firstWs.id || (firstWs as unknown as { _id: string })._id);
            }
          }
        }
      } catch {
        if (!cancelled) {
          logout();
        }
      }
    };

    void validateOrRestoreSession();

    return () => {
      cancelled = true;
    };
    // Only run when hydration completes or token changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, token]);

  return <>{children}</>;
}
