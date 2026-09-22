'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/organisms/sidebar';
import { Topbar } from '@/components/organisms/topbar';
import { DashboardShellTemplate } from '@/components/templates/dashboard-shell-template';
import { useAuthStore } from '@/lib/client/auth-store';

/**
 * Dashboard layout — wraps all authenticated routes with the sidebar shell.
 * Redirects to /login if no auth token is present after hydration.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (hydrated && !token) {
      router.replace('/login');
    } else if (hydrated && token) {
      const state = useAuthStore.getState();
      const wsId =
        state.activeWorkspaceId ||
        (typeof window !== 'undefined' ? localStorage.getItem('hr-dashboard-workspace-id') : null);
      if (wsId && state.workspaces.length === 0) {
        useAuthStore.getState().setWorkspaces([
          {
            id: wsId,
            name: 'Main Workspace',
            slug: 'main-workspace',
            role: state.user?.role || 'ADMIN',
          },
        ]);
      }
    }
  }, [hydrated, token, router]);

  // Show nothing until hydration completes (prevents flash)
  if (!hydrated) {
    return (
      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid hsl(var(--border-subtle))',
            borderTopColor: 'hsl(var(--color-brand-accent))',
            borderRadius: 'var(--radius-full)',
            animation: 'spin 0.8s linear infinite',
          }}
        />
      </div>
    );
  }

  // Redirect in progress
  if (!token) {
    return null;
  }

  return (
    <DashboardShellTemplate
      sidebarSlot={<Sidebar />}
      topbarSlot={<Topbar />}
      contentSlot={children}
    />
  );
}
