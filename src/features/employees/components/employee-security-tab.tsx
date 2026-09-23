'use client';

import { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/atoms/card';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import { Input } from '@/components/atoms/input';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Key,
  Lock,
  Search,
  Plus,
  Trash2,
  Check,
  Copy,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from '@/components/atoms/icons';
import { IamService } from '../services/iam.service';
import type { SecurityRole, Permission, EffectivePermissionsData } from '../types/employee-iam';

interface EmployeeSecurityTabProps {
  employeeId: string;
  employeeCode?: string;
  employeeName?: string;
}

const ROLE_METADATA: Record<string, { summary: string; scope: string; keyCapabilities: string[] }> =
  {
    SUPER_ADMIN: {
      summary:
        'Full workspace owner with unrestricted access across all modules, IAM, and settings.',
      scope: 'Workspace-wide (All modules)',
      keyCapabilities: [
        'Manage workspace settings & security policies',
        'Full administrative access over all modules',
        'Direct role & permission provisioning',
      ],
    },
    HR_ADMIN: {
      summary:
        'Comprehensive administrative control over workforce directory, departments, designations, and KYC records.',
      scope: 'Human Resources & Workforce Management',
      keyCapabilities: [
        'Create, edit, and archive employee records',
        'Manage organizational departments and job roles',
        'Audit statutory KYC and bank disbursement records',
      ],
    },
    HR_EXECUTIVE: {
      summary:
        'Operational HR permissions for talent onboarding, workforce profiling, and day-to-day employee maintenance.',
      scope: 'HR Operations & Employee Onboarding',
      keyCapabilities: [
        'Onboard employees into workspace talent pool',
        'Update demographic, address, and emergency info',
        'View workforce status and directory records',
      ],
    },
    ATTENDANCE_MANAGER: {
      summary:
        'Manage real-time site attendance, shift rosters, biometric/mobile punch validation, and muster roll reconciliation.',
      scope: 'Attendance, Rosters & Field Operations',
      keyCapabilities: [
        'Track real-time biometric & mobile punches',
        'Assign site shifts and recurring rosters',
        'Approve muster roll exceptions and timecards',
      ],
    },
    SITE_SUPERVISOR: {
      summary:
        'Field operations supervisor capable of managing site attendance, roster deployment, and real-time punch validation.',
      scope: 'Site / Client Deployment Operations',
      keyCapabilities: [
        'Mark field attendance and supervisor punches',
        'View site-assigned workforce details',
        'Report site incidents and headcounts',
      ],
    },
    PAYROLL_ADMIN: {
      summary:
        'Payroll processing, salary structures, payslip generation, and statutory compliance (PF, ESIC, PT).',
      scope: 'Payroll & Statutory Compliance',
      keyCapabilities: [
        'Configure wage structures & allowances',
        'Process & lock monthly payroll batches',
        'Export bank disbursement and compliance sheets',
      ],
    },
    SCM_ADMIN: {
      summary:
        'Supply chain and inventory management for uniform, safety gear, and equipment distribution.',
      scope: 'Inventory & Asset Management',
      keyCapabilities: [
        'Manage uniform and safety gear inventory',
        'Issue and return equipment per employee/site',
        'Track stock replenishment thresholds',
      ],
    },
    EMPLOYEE: {
      summary:
        'Employee self-service portal access for viewing personal profile, punch logs, shift schedules, and salary slips.',
      scope: 'Self-Service Portal (Own Record Only)',
      keyCapabilities: [
        'View personal profile and assigned documents',
        'Submit mobile check-in & check-out punches',
        'View monthly payslips and attendance records',
      ],
    },
  };

export function EmployeeSecurityTab({
  employeeId,
  employeeCode,
  employeeName,
}: EmployeeSecurityTabProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingRoles, setIsSavingRoles] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // IAM Data
  const [availableRoles, setAvailableRoles] = useState<SecurityRole[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [effectiveData, setEffectiveData] = useState<EffectivePermissionsData | null>(null);

  // Local assigned roles state
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  // Direct Overrides local state
  const [grantedOverrides, setGrantedOverrides] = useState<
    Array<{ permissionId: string; code?: string; name?: string; reason?: string; subject?: string }>
  >([]);
  const [deniedOverrides, setDeniedOverrides] = useState<
    Array<{ permissionId: string; code?: string; name?: string; reason?: string; subject?: string }>
  >([]);

  // Override Form state
  const [overrideEffect, setOverrideEffect] = useState<'GRANT' | 'DENY'>('GRANT');
  const [overridePermId, setOverridePermId] = useState<string>('');
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [isAddingOverride, setIsAddingOverride] = useState(false);

  // Credentials form state
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedCredentials, setCopiedCredentials] = useState(false);

  // Permissions Matrix Filter
  const [matrixSearch, setMatrixSearch] = useState('');
  const [matrixSubjectFilter, setMatrixSubjectFilter] = useState('ALL');

  // Expanded role for details inspection
  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null);

  const fetchIamData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [roles, perms, eff] = await Promise.all([
        IamService.getSecurityRoles().catch(() => []),
        IamService.getAtomicPermissions().catch(() => []),
        IamService.getEffectivePermissions(employeeId).catch(() => null),
      ]);

      const validRoles = Array.isArray(roles)
        ? Array.from(new Map(roles.map((r) => [r.id || r.code, r])).values())
        : [];
      const validPerms = Array.isArray(perms)
        ? Array.from(new Map(perms.map((p) => [p.id || p.code, p])).values())
        : [];

      setAvailableRoles(validRoles);
      setAllPermissions(validPerms);

      if (eff && typeof eff === 'object') {
        setEffectiveData(eff);
        const rawAssigned = Array.isArray(eff.assignedRoles)
          ? eff.assignedRoles
          : Array.isArray((eff as unknown as { roles?: unknown[] }).roles)
            ? (eff as unknown as { roles: unknown[] }).roles
            : [];

        setSelectedRoleIds(
          rawAssigned
            .map((r: unknown) => {
              if (typeof r === 'string') {
                const matched = validRoles.find((vr) => vr.id === r || vr.code === r);
                return matched?.id || r;
              }
              if (r && typeof r === 'object') {
                const obj = r as Record<string, unknown>;
                const idOrCode = (obj.id || obj.roleId || obj.code) as string | undefined;
                const matched = validRoles.find((vr) => vr.id === idOrCode || vr.code === idOrCode);
                return matched?.id || idOrCode;
              }
              return undefined;
            })
            .filter((id): id is string => Boolean(id)),
        );

        const directList = Array.isArray(eff.directOverrides) ? eff.directOverrides : [];
        const grantsMap = new Map<
          string,
          {
            permissionId: string;
            code?: string;
            name?: string;
            reason?: string;
            subject?: string;
          }
        >();
        const deniesMap = new Map<
          string,
          {
            permissionId: string;
            code?: string;
            name?: string;
            reason?: string;
            subject?: string;
          }
        >();

        for (const o of directList) {
          if (!o || typeof o !== 'object') continue;
          const match = validPerms.find(
            (p) =>
              p.id === o.permissionId ||
              (o.code && p.code === o.code) ||
              p.id === o.code ||
              p.code === o.permissionId,
          );

          const resolvedId = match?.id || o.permissionId;
          const resolvedCode = match?.code || o.code;
          const resolvedName = match?.name || o.name || resolvedCode || resolvedId;
          const resolvedSubject = match?.subject;

          const item = {
            permissionId: resolvedId,
            code: resolvedCode,
            name: resolvedName,
            reason: o.reason,
            subject: resolvedSubject,
          };

          const isDeny =
            o.type === 'DENY' ||
            String(o.type).toUpperCase() === 'DENY' ||
            String((o as unknown as { effect?: string }).effect).toUpperCase() === 'DENY';

          if (isDeny) {
            deniesMap.set(resolvedId, item);
          } else {
            grantsMap.set(resolvedId, item);
          }
        }

        setGrantedOverrides(Array.from(grantsMap.values()));
        setDeniedOverrides(Array.from(deniesMap.values()));
      } else {
        // Fallback default: EMPLOYEE role
        const empRole = validRoles.find((r) => r.code === 'EMPLOYEE');
        if (empRole) {
          setSelectedRoleIds([empRole.id]);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load security IAM data';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    void fetchIamData();
  }, [fetchIamData]);

  // Handle Role Toggle
  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId],
    );
  };

  // Save Assigned Roles
  const handleSaveRoles = async () => {
    setIsSavingRoles(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      // Find current assigned role IDs from effectiveData safely
      const rawAssigned = Array.isArray(effectiveData?.assignedRoles)
        ? effectiveData.assignedRoles
        : Array.isArray((effectiveData as unknown as { roles?: unknown[] })?.roles)
          ? (effectiveData as unknown as { roles: unknown[] }).roles
          : [];

      const currentAssigned = new Set(
        rawAssigned
          .map((r: unknown) => {
            if (typeof r === 'string') return r;
            if (r && typeof r === 'object') {
              const obj = r as Record<string, unknown>;
              return (obj.id || obj.roleId || obj.code) as string | undefined;
            }
            return undefined;
          })
          .filter((id): id is string => Boolean(id)),
      );
      const nextAssigned = new Set(selectedRoleIds);

      // Roles to assign
      const toAssign = selectedRoleIds.filter((id) => !currentAssigned.has(id));
      // Roles to revoke
      const toRevoke = Array.from(currentAssigned).filter((id) => !nextAssigned.has(id));

      await Promise.all([
        ...toAssign.map((roleId) => IamService.assignSecurityRole(employeeId, roleId)),
        ...toRevoke.map((roleId) => IamService.revokeSecurityRole(employeeId, roleId)),
      ]);

      setSuccessMessage('Security roles updated successfully.');
      await fetchIamData();
    } catch (err: unknown) {
      const errorObj = err as { status?: number; code?: string; message?: string };
      if (errorObj?.status === 403 || errorObj?.code === 'FORBIDDEN') {
        setErrorMessage(
          '403 Forbidden: Your logged-in admin account does not currently have permission to manage IAM security roles for this workspace. Please ensure your account has the SUPER_ADMIN / IAM_ADMIN role in this workspace.',
        );
      } else {
        const msg = err instanceof Error ? err.message : 'Failed to update security roles';
        setErrorMessage(msg);
      }
    } finally {
      setIsSavingRoles(false);
    }
  };

  // Add Direct Override
  const handleAddOverride = async (e: FormEvent) => {
    e.preventDefault();
    if (!overridePermId) return;

    setIsAddingOverride(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const perm = allPermissions.find((p) => p.id === overridePermId || p.code === overridePermId);
    const resolvedPermId = perm?.id || overridePermId;
    const reasonText = overrideReason.trim() || undefined;

    try {
      if (overrideEffect === 'GRANT') {
        await IamService.grantDirectPermission(employeeId, resolvedPermId, reasonText);
        setGrantedOverrides((prev) => [
          ...prev.filter(
            (p) =>
              p.permissionId !== resolvedPermId &&
              p.code !== perm?.code &&
              p.permissionId !== overridePermId,
          ),
          {
            permissionId: resolvedPermId,
            code: perm?.code,
            name: perm?.name,
            reason: reasonText,
            subject: perm?.subject,
          },
        ]);
        setDeniedOverrides((prev) =>
          prev.filter(
            (p) =>
              p.permissionId !== resolvedPermId &&
              p.code !== perm?.code &&
              p.permissionId !== overridePermId,
          ),
        );
      } else {
        await IamService.denyDirectPermission(employeeId, resolvedPermId, reasonText);
        setDeniedOverrides((prev) => [
          ...prev.filter(
            (p) =>
              p.permissionId !== resolvedPermId &&
              p.code !== perm?.code &&
              p.permissionId !== overridePermId,
          ),
          {
            permissionId: resolvedPermId,
            code: perm?.code,
            name: perm?.name,
            reason: reasonText,
            subject: perm?.subject,
          },
        ]);
        setGrantedOverrides((prev) =>
          prev.filter(
            (p) =>
              p.permissionId !== resolvedPermId &&
              p.code !== perm?.code &&
              p.permissionId !== overridePermId,
          ),
        );
      }

      setOverridePermId('');
      setOverrideReason('');
      setSuccessMessage(`Direct ${overrideEffect} override added successfully.`);
      await fetchIamData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `Failed to apply direct ${overrideEffect}`;
      setErrorMessage(msg);
    } finally {
      setIsAddingOverride(false);
    }
  };

  // Remove Direct Override
  const handleRemoveOverride = async (permissionId: string) => {
    setErrorMessage(null);
    try {
      await IamService.revokeDirectPermission(employeeId, permissionId);
      setGrantedOverrides((prev) =>
        prev.filter((p) => p.permissionId !== permissionId && p.code !== permissionId),
      );
      setDeniedOverrides((prev) =>
        prev.filter((p) => p.permissionId !== permissionId && p.code !== permissionId),
      );
      setSuccessMessage('Permission override removed.');
      await fetchIamData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to remove override';
      if (msg.toLowerCase().includes('not found') || msg.includes('404')) {
        // Record was already removed or not an active override; clear locally
        setGrantedOverrides((prev) =>
          prev.filter((p) => p.permissionId !== permissionId && p.code !== permissionId),
        );
        setDeniedOverrides((prev) =>
          prev.filter((p) => p.permissionId !== permissionId && p.code !== permissionId),
        );
        setSuccessMessage('Permission override cleared.');
        await fetchIamData();
      } else {
        setErrorMessage(msg);
      }
    }
  };

  // Load stored credentials from local cache on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && employeeId) {
      const saved = localStorage.getItem(`emp_pwd_${employeeId}`);
      if (saved) {
        setNewPassword(saved);
      }
    }
  }, [employeeId]);

  // Save / Update Password
  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsSavingPassword(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await IamService.setEmployeePassword(employeeId, newPassword, false);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`emp_pwd_${employeeId}`, newPassword);
      }
      setSuccessMessage('Employee portal credentials saved successfully.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to set employee password';
      setErrorMessage(msg);
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Regenerate & Auto-save new password
  const handleRegenerateAndSave = async () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let pwd = '';
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pwd);
    setIsSavingPassword(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await IamService.setEmployeePassword(employeeId, pwd, false);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`emp_pwd_${employeeId}`, pwd);
      }
      setSuccessMessage('New portal password generated and saved to backend successfully.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to regenerate password';
      setErrorMessage(msg);
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Copy full employee login credentials to clipboard
  const handleCopyCredentials = () => {
    if (!newPassword) return;
    const loginUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/login`
        : 'http://localhost:3003/login';
    const text = [
      `🔐 HRMS Employee Portal Login Credentials`,
      `Name: ${employeeName || 'Employee'}`,
      `Employee Code: ${employeeCode || employeeId}`,
      `Password: ${newPassword}`,
      `Portal URL: ${loginUrl}`,
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopiedCredentials(true);
    setTimeout(() => setCopiedCredentials(false), 2500);
  };

  // Compute Live Effective Permissions Matrix
  const liveEffectiveMatrix = useMemo(() => {
    const assignedRoleObjects = availableRoles.filter(
      (r) => selectedRoleIds.includes(r.id) || selectedRoleIds.includes(r.code),
    );

    // Permission IDs & Codes granted by selected roles
    const roleGrantedPermIds = new Set<string>();
    const roleGrantedPermCodes = new Set<string>();
    for (const role of assignedRoleObjects) {
      for (const p of role.permissions ?? []) {
        if (p.id) roleGrantedPermIds.add(p.id);
        if (p.code) roleGrantedPermCodes.add(p.code);
      }
      for (const mod of role.policyModules ?? []) {
        for (const p of mod.permissions ?? []) {
          if (p.id) roleGrantedPermIds.add(p.id);
          if (p.code) roleGrantedPermCodes.add(p.code);
        }
      }
    }

    return allPermissions.map((perm) => {
      let isGranted = false;
      let source: 'ROLE_GRANT' | 'DIRECT_GRANT' | 'EXPLICIT_DENY' | 'UNASSIGNED' = 'UNASSIGNED';
      let sourceLabel = 'No access';

      const directDeny = deniedOverrides.find(
        (d) =>
          (d.permissionId && d.permissionId === perm.id) ||
          (d.code && d.code === perm.code) ||
          d.permissionId === perm.code ||
          (d.code && d.code === perm.id),
      );

      const directGrant = grantedOverrides.find(
        (g) =>
          (g.permissionId && g.permissionId === perm.id) ||
          (g.code && g.code === perm.code) ||
          g.permissionId === perm.code ||
          (g.code && g.code === perm.id),
      );

      const isRoleGranted =
        roleGrantedPermIds.has(perm.id) || (perm.code && roleGrantedPermCodes.has(perm.code));

      if (directDeny) {
        isGranted = false;
        source = 'EXPLICIT_DENY';
        sourceLabel = `Explicit DENY${directDeny.reason ? ` (${directDeny.reason})` : ''}`;
      } else if (directGrant) {
        isGranted = true;
        source = 'DIRECT_GRANT';
        sourceLabel = `Direct GRANT${directGrant.reason ? ` (${directGrant.reason})` : ''}`;
      } else if (isRoleGranted) {
        isGranted = true;
        source = 'ROLE_GRANT';
        const grantingRoles = assignedRoleObjects.filter(
          (r) =>
            r.permissions?.some((p) => p.id === perm.id || (p.code && p.code === perm.code)) ||
            r.policyModules?.some((m) =>
              m.permissions?.some((p) => p.id === perm.id || (p.code && p.code === perm.code)),
            ),
        );
        sourceLabel =
          grantingRoles.length > 0
            ? `Role: ${grantingRoles.map((r) => r.name).join(', ')}`
            : 'Granted via Role';
      }

      return {
        ...perm,
        isGranted,
        source,
        sourceLabel,
      };
    });
  }, [allPermissions, availableRoles, selectedRoleIds, grantedOverrides, deniedOverrides]);

  // Unique Subjects for filter dropdown
  const uniqueSubjects = useMemo(() => {
    const subs = Array.from(new Set(allPermissions.map((p) => p.subject).filter(Boolean)));
    return ['ALL', ...subs];
  }, [allPermissions]);

  // Filtered Matrix
  const filteredMatrix = useMemo(() => {
    return liveEffectiveMatrix.filter((item) => {
      if (matrixSubjectFilter !== 'ALL' && item.subject !== matrixSubjectFilter) return false;
      if (!matrixSearch.trim()) return true;
      const q = matrixSearch.toLowerCase();
      return (
        item.code.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.subject.toLowerCase().includes(q) ||
        item.action.toLowerCase().includes(q)
      );
    });
  }, [liveEffectiveMatrix, matrixSearch, matrixSubjectFilter]);

  if (isLoading) {
    return (
      <Card variant="subtle" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <div style={{ fontSize: 'var(--font-size-md)', color: 'hsl(var(--text-secondary))' }}>
          Loading IAM Security & Permissions...
        </div>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Status Alerts */}
      {errorMessage && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'hsl(var(--color-danger) / 0.1)',
            border: '1px solid hsl(var(--color-danger) / 0.3)',
            borderRadius: 'var(--radius-md)',
            color: 'hsl(var(--color-danger))',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'hsl(var(--color-success) / 0.1)',
            border: '1px solid hsl(var(--color-success) / 0.3)',
            borderRadius: 'var(--radius-md)',
            color: 'hsl(var(--color-success))',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* SECTION 1: ASSIGNED SECURITY ROLES */}
      <Card variant="subtle">
        <CardHeader
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Shield size={20} style={{ color: 'hsl(var(--primary-color))' }} />
            <div>
              <CardTitle>Assigned Security Roles</CardTitle>
              <div
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'hsl(var(--text-muted))',
                  marginTop: '2px',
                }}
              >
                RBAC Security Roles grant bundles of atomic permissions to this employee.
              </div>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => void handleSaveRoles()}
            disabled={isSavingRoles}
          >
            {isSavingRoles ? 'Saving Roles...' : 'Save Role Changes'}
          </Button>
        </CardHeader>
        <CardContent>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            {availableRoles.map((role, rIdx) => {
              const isSelected = selectedRoleIds.includes(role.id);
              const meta = ROLE_METADATA[role.code.toUpperCase()] || {
                summary:
                  role.description || 'System access role with configured policy permissions.',
                scope: 'Operational Scope',
                keyCapabilities: ['Standard system permissions defined in policy bundle'],
              };
              const permCount =
                (role.permissions?.length ?? 0) +
                (role.policyModules?.reduce((acc, m) => acc + (m.permissions?.length ?? 0), 0) ??
                  0);

              const isExpanded = expandedRoleId === role.id;

              return (
                <div
                  key={`role-card-${role.id || role.code || rIdx}-${rIdx}`}
                  style={{
                    padding: 'var(--space-4)',
                    borderRadius: 'var(--radius-lg)',
                    border: `2px solid ${isSelected ? 'hsl(var(--primary-color))' : 'hsl(var(--border-subtle))'}`,
                    backgroundColor: isSelected
                      ? 'hsl(var(--primary-color) / 0.04)'
                      : 'hsl(var(--bg-secondary))',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-3)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Top Bar: Selection Checkbox & Name */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: 'var(--font-size-sm)',
                        color: 'hsl(var(--text-primary))',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRole(role.id)}
                        style={{
                          width: '18px',
                          height: '18px',
                          accentColor: 'hsl(var(--primary-color))',
                          cursor: 'pointer',
                        }}
                      />
                      <span>{role.name}</span>
                    </label>
                    <Badge variant={isSelected ? 'primary' : 'secondary'}>{role.code}</Badge>
                  </div>

                  {/* Rich Role Description */}
                  <p
                    style={{
                      margin: 0,
                      fontSize: 'var(--font-size-xs)',
                      color: 'hsl(var(--text-secondary))',
                      lineHeight: 1.45,
                    }}
                  >
                    {meta.summary}
                  </p>

                  {/* Scope & Capabilities */}
                  <div
                    style={{
                      backgroundColor: 'hsl(var(--bg-surface))',
                      borderRadius: 'var(--radius-md)',
                      padding: '8px 10px',
                      fontSize: '11px',
                      color: 'hsl(var(--text-muted))',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      border: '1px solid hsl(var(--border-subtle))',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: 'hsl(var(--text-primary))' }}>
                      Scope: <span style={{ fontWeight: 400 }}>{meta.scope}</span>
                    </div>
                    <div>
                      {meta.keyCapabilities.slice(0, 2).map((cap, i) => (
                        <div
                          key={`cap-item-${role.id || rIdx}-${i}`}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <span style={{ color: 'hsl(var(--primary-color))' }}>•</span>
                          <span>{cap}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer: Permission count & Expand Details */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 'auto',
                      paddingTop: '6px',
                      borderTop: '1px solid hsl(var(--border-subtle))',
                      fontSize: '11px',
                    }}
                  >
                    <span style={{ color: 'hsl(var(--text-muted))' }}>
                      {permCount > 0 ? `${permCount} permissions included` : 'Policy bundle'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setExpandedRoleId(isExpanded ? null : role.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'hsl(var(--primary-color))',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '11px',
                        padding: '2px 4px',
                      }}
                    >
                      {isExpanded ? 'Hide Policy ▲' : 'View Policy ▼'}
                    </button>
                  </div>

                  {/* Expanded Policy Modules list */}
                  {isExpanded && (
                    <div
                      style={{
                        marginTop: '4px',
                        padding: '8px',
                        backgroundColor: 'hsl(var(--bg-surface))',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '11px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ fontWeight: 600, color: 'hsl(var(--text-primary))' }}>
                        Policy Modules:
                      </div>
                      {role.policyModules && role.policyModules.length > 0 ? (
                        role.policyModules.map((m, mIdx) => (
                          <div
                            key={`role-mod-${role.id || rIdx}-${m.code || mIdx}-${mIdx}`}
                            style={{ display: 'flex', justifyContent: 'space-between' }}
                          >
                            <span style={{ color: 'hsl(var(--text-secondary))' }}>
                              {m.name || m.code}
                            </span>
                            <span style={{ color: 'hsl(var(--text-muted))' }}>
                              ({m.permissions?.length || 0} rules)
                            </span>
                          </div>
                        ))
                      ) : (
                        <span style={{ color: 'hsl(var(--text-muted))' }}>
                          Standard atomic permissions
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: GRANULAR DIRECT PERMISSION OVERRIDES */}
      <Card variant="subtle">
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <ShieldAlert size={20} style={{ color: '#d97706' }} />
            <div>
              <CardTitle>Granular Permission Overrides (Grant / Deny)</CardTitle>
              <div
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'hsl(var(--text-muted))',
                  marginTop: '2px',
                }}
              >
                Fine-grained overrides applied directly to this employee. Explicit DENY strictly
                overrides any assigned role.
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Add Override Form */}
          <form
            onSubmit={(e) => void handleAddOverride(e)}
            style={{
              display: 'grid',
              gridTemplateColumns: '130px 1fr 1fr auto',
              gap: 'var(--space-3)',
              alignItems: 'flex-end',
              backgroundColor: 'hsl(var(--bg-secondary))',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid hsl(var(--border-subtle))',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 600,
                  marginBottom: '4px',
                  color: 'hsl(var(--text-secondary))',
                }}
              >
                Override Effect
              </label>
              <select
                value={overrideEffect}
                onChange={(e) => setOverrideEffect(e.target.value as 'GRANT' | 'DENY')}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 8px',
                  borderRadius: '6px',
                  border: '1px solid hsl(var(--border-subtle))',
                  backgroundColor: 'hsl(var(--bg-surface))',
                  color: overrideEffect === 'GRANT' ? '#16a34a' : '#dc2626',
                  fontWeight: 600,
                  fontSize: '12px',
                }}
              >
                <option value="GRANT">+ Direct GRANT</option>
                <option value="DENY">- Explicit DENY</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 600,
                  marginBottom: '4px',
                  color: 'hsl(var(--text-secondary))',
                }}
              >
                Select Permission
              </label>
              <select
                value={overridePermId}
                onChange={(e) => setOverridePermId(e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 10px',
                  borderRadius: '6px',
                  border: '1px solid hsl(var(--border-subtle))',
                  backgroundColor: 'hsl(var(--bg-surface))',
                  color: 'hsl(var(--text-primary))',
                  fontSize: '12px',
                }}
              >
                <option value="">-- Choose Permission --</option>
                {allPermissions.map((p, pIdx) => (
                  <option key={`perm-select-opt-${p.id || p.code || pIdx}-${pIdx}`} value={p.id}>
                    [{p.subject}] {p.name || p.code} ({p.action})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 600,
                  marginBottom: '4px',
                  color: 'hsl(var(--text-secondary))',
                }}
              >
                Justification / Reason (Optional)
              </label>
              <Input
                placeholder="e.g. Special project clearance / Restricted access"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!overridePermId || isAddingOverride}
              style={{ height: '38px' }}
            >
              <Plus size={14} />
              <span>{isAddingOverride ? 'Adding...' : 'Add Override'}</span>
            </Button>
          </form>

          {/* Active Overrides List */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            {/* Direct GRANTS */}
            <div
              style={{
                border: '1px solid #bbf7d0',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#f0fdf4',
                padding: 'var(--space-4)',
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 'var(--font-size-xs)',
                  color: '#166534',
                  marginBottom: 'var(--space-2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <ShieldCheck size={16} />
                <span>Direct Grants ({grantedOverrides.length})</span>
              </div>
              {grantedOverrides.length === 0 ? (
                <div style={{ fontSize: '12px', color: '#166534', opacity: 0.7 }}>
                  No direct grants configured.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {grantedOverrides.map((g, idx) => (
                    <div
                      key={`grant-override-${g.permissionId || g.code || 'grant'}-${idx}`}
                      style={{
                        backgroundColor: '#ffffff',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #bbf7d0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        fontSize: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: '#166534',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            flexWrap: 'wrap',
                          }}
                        >
                          {g.subject && (
                            <span
                              style={{
                                fontSize: '10px',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                backgroundColor: '#dcfce7',
                                color: '#166534',
                                fontWeight: 700,
                              }}
                            >
                              {g.subject}
                            </span>
                          )}
                          <span>{g.name || g.code || g.permissionId}</span>
                        </div>
                        {g.code && (
                          <div
                            style={{
                              fontSize: '11px',
                              fontFamily: 'monospace',
                              color: '#15803d',
                            }}
                          >
                            {g.code}
                          </div>
                        )}
                        {g.reason && (
                          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                            Reason: {g.reason}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleRemoveOverride(g.permissionId)}
                        title="Revoke direct grant"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc2626',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Explicit DENIES */}
            <div
              style={{
                border: '1px solid #fecaca',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#fef2f2',
                padding: 'var(--space-4)',
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 'var(--font-size-xs)',
                  color: '#991b1b',
                  marginBottom: 'var(--space-2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <ShieldAlert size={16} />
                <span>Explicit Denies ({deniedOverrides.length})</span>
              </div>
              {deniedOverrides.length === 0 ? (
                <div style={{ fontSize: '12px', color: '#991b1b', opacity: 0.7 }}>
                  No explicit restrictions configured.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {deniedOverrides.map((d, idx) => (
                    <div
                      key={`deny-override-${d.permissionId || d.code || 'deny'}-${idx}`}
                      style={{
                        backgroundColor: '#ffffff',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #fecaca',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        fontSize: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: '#991b1b',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            flexWrap: 'wrap',
                          }}
                        >
                          {d.subject && (
                            <span
                              style={{
                                fontSize: '10px',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                backgroundColor: '#fee2e2',
                                color: '#991b1b',
                                fontWeight: 700,
                              }}
                            >
                              {d.subject}
                            </span>
                          )}
                          <span>{d.name || d.code || d.permissionId}</span>
                        </div>
                        {d.code && (
                          <div
                            style={{
                              fontSize: '11px',
                              fontFamily: 'monospace',
                              color: '#b91c1c',
                            }}
                          >
                            {d.code}
                          </div>
                        )}
                        {d.reason && (
                          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                            Reason: {d.reason}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleRemoveOverride(d.permissionId)}
                        title="Revoke explicit deny"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc2626',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 3: PORTAL LOGIN & PASSWORD CREDENTIALS */}
      <Card variant="subtle">
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Key size={20} style={{ color: 'hsl(var(--primary-color))' }} />
            <div>
              <CardTitle>Portal Access & Password Credentials</CardTitle>
              <div
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'hsl(var(--text-muted))',
                  marginTop: '2px',
                }}
              >
                Generate or update the employee self-service login password. Share their Employee
                Code and password directly with the employee.
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <form
            onSubmit={(e) => void handleUpdatePassword(e)}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto auto',
              gap: 'var(--space-3)',
              alignItems: 'flex-end',
              maxWidth: '680px',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '4px',
                  color: 'hsl(var(--text-secondary))',
                }}
              >
                Set Portal Password
              </label>
              <div style={{ position: 'relative' }}>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter min. 6 character password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'hsl(var(--text-muted))',
                    cursor: 'pointer',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void handleRegenerateAndSave()}
              disabled={isSavingPassword}
              style={{ height: '38px', gap: '6px' }}
            >
              <RefreshCw size={14} />
              <span>{isSavingPassword ? 'Generating...' : 'Regenerate & Save'}</span>
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!newPassword || isSavingPassword}
              style={{ height: '38px' }}
            >
              <Lock size={14} />
              <span>{isSavingPassword ? 'Saving...' : 'Save Password'}</span>
            </Button>
          </form>

          {/* Credentials Sharing Summary Card */}
          {newPassword && (
            <div
              style={{
                backgroundColor: 'hsl(var(--bg-surface))',
                border: '1px solid hsl(var(--border-subtle))',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3) var(--space-4)',
                maxWidth: '680px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 'var(--space-3)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  fontSize: 'var(--font-size-xs)',
                }}
              >
                <div style={{ fontWeight: 600, color: 'hsl(var(--text-primary))' }}>
                  Shareable Employee Credentials:
                </div>
                <div style={{ color: 'hsl(var(--text-secondary))' }}>
                  ID:{' '}
                  <strong style={{ color: 'hsl(var(--text-primary))' }}>
                    {employeeCode || employeeId}
                  </strong>{' '}
                  | Password:{' '}
                  <strong style={{ fontFamily: 'monospace', color: 'hsl(var(--text-primary))' }}>
                    {showPassword ? newPassword : '••••••••'}
                  </strong>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyCredentials}
                style={{
                  color: copiedCredentials ? '#16a34a' : 'hsl(var(--primary-color))',
                  borderColor: copiedCredentials ? '#16a34a' : undefined,
                  fontSize: '11px',
                  fontWeight: 600,
                  gap: '6px',
                }}
              >
                {copiedCredentials ? <Check size={14} /> : <Copy size={14} />}
                <span>
                  {copiedCredentials ? 'Credentials Copied!' : 'Copy Login Details for Employee'}
                </span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 4: LIVE EFFECTIVE PERMISSIONS MATRIX */}
      <Card variant="subtle">
        <CardHeader
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <ShieldCheck size={20} style={{ color: '#16a34a' }} />
            <div>
              <CardTitle>Live Effective Permissions Matrix</CardTitle>
              <div
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'hsl(var(--text-muted))',
                  marginTop: '2px',
                }}
              >
                Calculated outcome across Security Roles + Direct Grants - Explicit Denies.
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => void fetchIamData()}>
            <RefreshCw size={14} />
            <span>Refresh</span>
          </Button>
        </CardHeader>
        <CardContent style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Matrix Filter & Search Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '200px 1fr',
              gap: 'var(--space-3)',
            }}
          >
            <select
              value={matrixSubjectFilter}
              onChange={(e) => setMatrixSubjectFilter(e.target.value)}
              style={{
                height: '36px',
                padding: '0 10px',
                borderRadius: '6px',
                border: '1px solid hsl(var(--border-subtle))',
                backgroundColor: 'hsl(var(--bg-secondary))',
                color: 'hsl(var(--text-primary))',
                fontSize: '12px',
              }}
            >
              <option value="ALL">All Policy Modules ({uniqueSubjects.length - 1})</option>
              {uniqueSubjects
                .filter((s) => s !== 'ALL')
                .map((sub, sIdx) => (
                  <option key={`matrix-subject-opt-${sub}-${sIdx}`} value={sub}>
                    Module: {sub}
                  </option>
                ))}
            </select>

            <div style={{ position: 'relative' }}>
              <Input
                placeholder="Search permissions by code, name, or action..."
                value={matrixSearch}
                onChange={(e) => setMatrixSearch(e.target.value)}
                style={{ paddingLeft: '32px', height: '36px', fontSize: '12px' }}
              />
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'hsl(var(--text-muted))',
                }}
              />
            </div>
          </div>

          {/* Matrix Table */}
          <div
            style={{
              maxHeight: '420px',
              overflowY: 'auto',
              borderRadius: 'var(--radius-md)',
              border: '1px solid hsl(var(--border-subtle))',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: 'hsl(var(--bg-secondary))',
                    borderBottom: '1px solid hsl(var(--border-subtle))',
                    textAlign: 'left',
                    color: 'hsl(var(--text-muted))',
                  }}
                >
                  <th style={{ padding: '8px 12px', fontWeight: 600 }}>Policy Module</th>
                  <th style={{ padding: '8px 12px', fontWeight: 600 }}>Permission Code</th>
                  <th style={{ padding: '8px 12px', fontWeight: 600 }}>Action</th>
                  <th style={{ padding: '8px 12px', fontWeight: 600 }}>Effective Access</th>
                  <th style={{ padding: '8px 12px', fontWeight: 600 }}>Decision Source</th>
                </tr>
              </thead>
              <tbody>
                {filteredMatrix.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: '24px',
                        textAlign: 'center',
                        color: 'hsl(var(--text-muted))',
                      }}
                    >
                      No permissions match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredMatrix.map((item, mIdx) => (
                    <tr
                      key={`matrix-row-${item.id || item.code || mIdx}-${mIdx}`}
                      style={{
                        borderBottom: '1px solid hsl(var(--border-subtle))',
                        backgroundColor: item.isGranted
                          ? 'transparent'
                          : item.source === 'EXPLICIT_DENY'
                            ? 'hsl(var(--color-danger) / 0.04)'
                            : 'hsl(var(--bg-secondary) / 0.4)',
                      }}
                    >
                      <td
                        style={{
                          padding: '8px 12px',
                          fontWeight: 600,
                          color: 'hsl(var(--text-primary))',
                        }}
                      >
                        {item.subject}
                      </td>
                      <td
                        style={{
                          padding: '8px 12px',
                          fontFamily: 'monospace',
                          color: 'hsl(var(--text-secondary))',
                        }}
                      >
                        {item.code}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <Badge variant="outline">{item.action}</Badge>
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        {item.isGranted ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: '#16a34a',
                              fontWeight: 600,
                            }}
                          >
                            <CheckCircle2 size={14} /> GRANTED
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              color:
                                item.source === 'EXPLICIT_DENY'
                                  ? '#dc2626'
                                  : 'hsl(var(--text-muted))',
                              fontWeight: 600,
                            }}
                          >
                            <AlertCircle size={14} />{' '}
                            {item.source === 'EXPLICIT_DENY' ? 'DENIED' : 'UNASSIGNED'}
                          </span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: '8px 12px',
                          color: 'hsl(var(--text-secondary))',
                          fontSize: '11px',
                        }}
                      >
                        {item.sourceLabel}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
