'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { unifiedLoginSchema } from '../schemas/login.schema';
import { AuthService } from '../services/auth.service';
import { apiClient } from '@/lib/client/api-client';
import { useAuthStore, type AuthUser } from '@/lib/client/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, AlertCircle, CheckCircle2, Shield, User } from '@/components/atoms/icons';

/**
 * LoginForm — Unified Admin / HR / Employee Portal authentication form.
 * Accepts either Email Address (Owner/SuperAdmin) or Employee Code (Staff/HR) + Password.
 */
export function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setWorkspaces = useAuthStore((s) => s.setWorkspaces);
  const setActiveWorkspace = useAuthStore((s) => s.setActiveWorkspace);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isEmailFormat = identifier.includes('@');

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanIdentifier = identifier.trim();
    const result = unifiedLoginSchema.safeParse({ identifier: cleanIdentifier, password });
    if (!result.success) {
      setErrorMessage(
        result.error.errors[0]?.message ?? 'Please check your login identifier and password',
      );
      return;
    }

    setIsLoading(true);
    try {
      const response = await AuthService.login({
        identifier: cleanIdentifier,
        password,
      });

      const fallbackName =
        (response.user.email ? response.user.email.split('@')[0] : null) ?? cleanIdentifier;
      const initialUser: AuthUser = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name ?? fallbackName,
        phoneNumber: response.user.phoneNumber ?? null,
        avatarUrl: response.user.avatarUrl ?? null,
        status: response.user.status,
        isSuperAdmin: response.user.isSuperAdmin,
        isEmailVerified: response.user.isEmailVerified,
        role: response.user.role ?? null,
        roles: (response.user as unknown as { roles?: string[] })?.roles,
        workspaceId:
          (response.user as unknown as { workspaceId?: string })?.workspaceId ||
          (response as unknown as { workspaceId?: string })?.workspaceId,
      };

      // 1. Store access token and user profile in auth store
      setAuth(response.accessToken, initialUser);

      // 2. Fetch available workspaces and ensure activeWorkspaceId is set
      try {
        let workspaces = await AuthService.listWorkspaces();
        const storedWsId =
          typeof window !== 'undefined' ? localStorage.getItem('hr-dashboard-workspace-id') : null;
        const targetWsId = initialUser.workspaceId || storedWsId;

        if ((!workspaces || workspaces.length === 0) && targetWsId) {
          workspaces = [
            {
              id: targetWsId,
              name: 'Main Workspace',
              slug: 'main-workspace',
              role: initialUser.role || 'ADMIN',
            },
          ];
        }

        if (workspaces && workspaces.length > 0) {
          setWorkspaces(workspaces);
          const chosenWs =
            (targetWsId && workspaces.find((w) => w.id === targetWsId)) || workspaces[0];
          if (chosenWs) {
            setActiveWorkspace(chosenWs.id);
          }
        }
      } catch {
        // Fallback if workspace listing fails
      }

      // 3. For Employee logins, enrich with employee profile, full name, and assigned security roles
      try {
        const empSearch = await apiClient<
          { records?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>
        >(`/hr/employees?search=${encodeURIComponent(cleanIdentifier)}`);
        const records = Array.isArray(empSearch) ? empSearch : empSearch?.records || [];
        const matched = records.find((e: Record<string, unknown>) => {
          const code = (e.employeeCode || e.employee_code) as string | undefined;
          return code?.toUpperCase() === cleanIdentifier.toUpperCase() || e.id === response.user.id;
        });

        if (matched) {
          const empId = matched.id as string;
          const firstName = (matched.firstName || matched.first_name || '') as string;
          const lastName = (matched.lastName || matched.last_name || '') as string;
          const fullName = `${firstName} ${lastName}`.trim();
          const empWsId = (matched.workspaceId || matched.workspace_id) as string | undefined;

          let assignedRoleCodes: string[] = [];
          try {
            const eff = await apiClient<{
              assignedRoles?: Array<{ code?: string; name?: string }>;
            }>(`/iam/employees/${empId}/permissions`);
            if (eff && Array.isArray(eff.assignedRoles)) {
              assignedRoleCodes = eff.assignedRoles
                .map((r: { code?: string; name?: string }) => r.code || r.name || '')
                .filter(Boolean);
            }
          } catch {
            // Ignore IAM permissions fetch error on login
          }

          if (empWsId) {
            setActiveWorkspace(empWsId);
          }

          const enrichedUser: AuthUser = {
            ...initialUser,
            name: fullName || initialUser.name,
            employeeId: empId,
            employeeCode: (matched.employeeCode ||
              matched.employee_code ||
              cleanIdentifier) as string,
            workspaceId: empWsId || initialUser.workspaceId,
            roles: assignedRoleCodes.length > 0 ? assignedRoleCodes : initialUser.roles,
          };

          useAuthStore.getState().setUser(enrichedUser);
        }
      } catch {
        // Ignore employee profile enrichment error
      }

      setSuccessMessage(
        `Authenticated successfully! Welcome, ${useAuthStore.getState().user?.name || initialUser.name}. Redirecting...`,
      );

      // 4. Direct navigation to dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Login failed. Please check your email / employee code and password.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', width: '100%' }}>
      {/* Error Alert */}
      {errorMessage && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'hsl(var(--color-danger-bg, 0 84% 96%))',
            border: '1px solid hsl(var(--color-danger, 0 72% 51%) / 0.3)',
            color: 'hsl(var(--color-danger, 0 72% 51%))',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 500,
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Success Alert */}
      {successMessage && (
        <div
          role="status"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'hsl(var(--color-success-bg, 142 76% 96%))',
            border: '1px solid hsl(var(--color-success, 142 71% 36%) / 0.3)',
            color: 'hsl(var(--color-success, 142 71% 36%))',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 500,
          }}
        >
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Unified Login Form */}
      <form
        onSubmit={handleLogin}
        noValidate
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label
              htmlFor="login-identifier"
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'hsl(var(--text-secondary))',
              }}
            >
              Email Address or Employee Code
            </label>
            {identifier.trim().length > 0 && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: isEmailFormat
                    ? 'hsl(var(--primary-color))'
                    : 'hsl(var(--color-success, 142 71% 36%))',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {isEmailFormat ? <Shield size={12} /> : <User size={12} />}
                {isEmailFormat ? 'Admin Login' : 'Employee Login'}
              </span>
            )}
          </div>
          <Input
            type="text"
            id="login-identifier"
            name="identifier"
            placeholder="e.g. admin@company.com or EMP4991"
            autoComplete="username"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-1)',
            position: 'relative',
          }}
        >
          <label
            htmlFor="login-password"
            style={{
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              color: 'hsl(var(--text-secondary))',
            }}
          >
            Password
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              style={{
                width: '100%',
                height: '42px',
                padding: '0 40px 0 12px',
                fontSize: 'var(--font-size-sm)',
                color: 'hsl(var(--text-primary))',
                backgroundColor: 'hsl(var(--bg-secondary))',
                border: '1px solid hsl(var(--border-subtle))',
                borderRadius: 'var(--radius-md)',
                outline: 'none',
                transition: 'border-color var(--transition-fast)',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute',
                right: '10px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'hsl(var(--text-muted))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div style={{ marginTop: 'var(--space-2)' }}>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            style={{ width: '100%', height: '44px', fontWeight: 600 }}
          >
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </Button>
        </div>
      </form>
    </div>
  );
}
