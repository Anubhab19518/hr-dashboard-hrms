'use client';

import { useState, useMemo } from 'react';
import {
  Key,
  Eye,
  EyeOff,
  Sparkles,
  Copy,
  Check,
  ShieldCheck,
  Search,
} from '@/components/atoms/icons';
import type {
  SecurityRole,
  Permission,
  EmployeeSecurityFormValues,
} from '../../types/employee-iam';

interface Step5CredentialsReviewProps {
  values: EmployeeSecurityFormValues;
  onChange: (patch: Partial<EmployeeSecurityFormValues>) => void;
  availableRoles: SecurityRole[];
  allPermissions: Permission[];
  departmentName?: string;
  jobRoleName?: string;
  error?: string | null;
}

export function Step5CredentialsReview({
  values,
  onChange,
  availableRoles,
  allPermissions,
  departmentName,
  jobRoleName,
  error,
}: Step5CredentialsReviewProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [permSearch, setPermSearch] = useState('');

  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let pass = 'Temp@2026';
    for (let i = 0; i < 4; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    onChange({ initialPassword: pass });
  };

  const copyPassword = () => {
    if (values.initialPassword) {
      navigator.clipboard.writeText(values.initialPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Compute Live Simulated Effective Permissions
  const effectivePermissionsMatrix = useMemo(() => {
    const deniedIds = new Set(values.deniedOverrides.map((d) => d.permissionId));
    const grantedIds = new Set(values.grantedOverrides.map((g) => g.permissionId));

    // 1. Gather all permissions from selected roles
    const selectedRoles = availableRoles.filter((r) => values.selectedRoleIds.includes(r.id));
    const rolePermissions: Permission[] = selectedRoles.flatMap((role) => {
      const pmPerms = role.policyModules?.flatMap((pm) => pm.permissions || []) || [];
      const directPerms = role.permissions || [];
      return [...pmPerms, ...directPerms];
    });

    // 2. Combine and deduplicate
    const permMap = new Map<string, Permission>();
    for (const p of rolePermissions) {
      if (p && p.id && !deniedIds.has(p.id)) {
        permMap.set(p.code || p.id, p);
      }
    }

    // 3. Add direct grants
    for (const grantId of grantedIds) {
      if (!deniedIds.has(grantId)) {
        const p = allPermissions.find((perm) => perm.id === grantId);
        if (p) {
          permMap.set(p.code || p.id, p);
        }
      }
    }

    return Array.from(permMap.values());
  }, [
    availableRoles,
    allPermissions,
    values.selectedRoleIds,
    values.grantedOverrides,
    values.deniedOverrides,
  ]);

  const filteredEffectivePerms = useMemo(() => {
    if (!permSearch.trim()) return effectivePermissionsMatrix;
    const q = permSearch.toLowerCase();
    return effectivePermissionsMatrix.filter(
      (p) =>
        p.code.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.subject.toLowerCase().includes(q),
    );
  }, [effectivePermissionsMatrix, permSearch]);

  const selectedRolesList = useMemo(() => {
    return availableRoles.filter((r) => values.selectedRoleIds.includes(r.id));
  }, [availableRoles, values.selectedRoleIds]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Section Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <h3
          style={{
            margin: 0,
            fontSize: '1rem',
            fontWeight: 600,
            color: 'hsl(var(--text-primary))',
          }}
        >
          Credentials Setup & Permissions Review
        </h3>
        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'hsl(var(--text-muted))' }}>
          Configure employee portal login credentials and verify the live computed effective
          permissions.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            fontSize: '0.8125rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Grid: Credentials Setup on Left / Summary on Right */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        {/* Credentials Box */}
        <div
          style={{
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: '#ffffff',
            border: '1px solid hsl(var(--border-subtle))',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Key size={18} style={{ color: 'hsl(var(--color-primary))' }} />
              <span
                style={{ fontSize: '0.875rem', fontWeight: 600, color: 'hsl(var(--text-primary))' }}
              >
                Initial Employee Password
              </span>
            </div>

            <button
              type="button"
              onClick={generateStrongPassword}
              style={{
                background: 'none',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '0.75rem',
                color: 'hsl(var(--color-primary))',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 600,
              }}
            >
              <Sparkles size={12} /> Auto Generate
            </button>
          </div>

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter temporary password..."
              value={values.initialPassword || ''}
              onChange={(e) => onChange({ initialPassword: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 70px 10px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.875rem',
                fontFamily: showPassword ? 'inherit' : 'monospace',
              }}
            />

            <div
              style={{
                position: 'absolute',
                right: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {values.initialPassword && (
                <button
                  type="button"
                  onClick={copyPassword}
                  title="Copy password"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  {copied ? <Check size={16} style={{ color: '#16a34a' }} /> : <Copy size={16} />}
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Force Password Change Toggle */}
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              fontSize: '0.8125rem',
              color: 'hsl(var(--text-secondary))',
              cursor: 'pointer',
              marginTop: '4px',
            }}
          >
            <input
              type="checkbox"
              checked={values.forceChangePassword}
              onChange={(e) => onChange({ forceChangePassword: e.target.checked })}
              style={{ marginTop: '3px' }}
            />
            <div>
              <strong>Require password change on first login (Recommended)</strong>
              <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                Forces the employee to set a private password upon accessing the Employee Portal.
              </div>
            </div>
          </label>
        </div>

        {/* Profile Summary Card */}
        <div
          style={{
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: 'hsl(var(--surface-secondary, 210 40% 98%))',
            border: '1px solid hsl(var(--border-subtle))',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'hsl(var(--text-secondary))',
              textTransform: 'uppercase',
            }}
          >
            Account Overview
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
            <span style={{ color: 'hsl(var(--text-muted))' }}>Full Name:</span>
            <strong>
              {values.firstName} {values.middleName ? `${values.middleName} ` : ''}
              {values.lastName}
            </strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
            <span style={{ color: 'hsl(var(--text-muted))' }}>Employee Code:</span>
            <code>{values.employeeCode}</code>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
            <span style={{ color: 'hsl(var(--text-muted))' }}>Official Email:</span>
            <span>{values.email}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
            <span style={{ color: 'hsl(var(--text-muted))' }}>Department:</span>
            <span>{departmentName || 'General / None'}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
            <span style={{ color: 'hsl(var(--text-muted))' }}>HR Job Role:</span>
            <span>{jobRoleName || 'General Staff'}</span>
          </div>
        </div>
      </div>

      {/* Security Roles & Overrides Summary Badges */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 'var(--space-2)',
        }}
      >
        <div
          style={{
            padding: '10px',
            borderRadius: '6px',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
          }}
        >
          <div style={{ fontSize: '0.6875rem', color: '#1e40af', fontWeight: 600 }}>
            SECURITY ROLES
          </div>
          <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e3a8a' }}>
            {selectedRolesList.length}
          </div>
        </div>

        <div
          style={{
            padding: '10px',
            borderRadius: '6px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
          }}
        >
          <div style={{ fontSize: '0.6875rem', color: '#166534', fontWeight: 600 }}>
            DIRECT GRANTS
          </div>
          <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#14532d' }}>
            {values.grantedOverrides.length}
          </div>
        </div>

        <div
          style={{
            padding: '10px',
            borderRadius: '6px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
          }}
        >
          <div style={{ fontSize: '0.6875rem', color: '#991b1b', fontWeight: 600 }}>
            EXPLICIT DENIES
          </div>
          <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#7f1d1d' }}>
            {values.deniedOverrides.length}
          </div>
        </div>

        <div
          style={{
            padding: '10px',
            borderRadius: '6px',
            backgroundColor: '#f5f3ff',
            border: '1px solid #ddd6fe',
          }}
        >
          <div style={{ fontSize: '0.6875rem', color: '#5b21b6', fontWeight: 600 }}>
            EFFECTIVE PERMISSIONS
          </div>
          <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#4c1d95' }}>
            {effectivePermissionsMatrix.length}
          </div>
        </div>
      </div>

      {/* Live Effective Permission Matrix Drawer */}
      <div
        style={{
          border: '1px solid hsl(var(--border-subtle))',
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
        }}
      >
        <div
          style={{
            padding: '12px 14px',
            backgroundColor: 'hsl(var(--surface-secondary, 210 40% 98%))',
            borderBottom: '1px solid hsl(var(--border-subtle))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} style={{ color: '#16a34a' }} />
            <span
              style={{ fontSize: '0.875rem', fontWeight: 600, color: 'hsl(var(--text-primary))' }}
            >
              Computed Effective Permissions Matrix ({effectivePermissionsMatrix.length})
            </span>
          </div>

          <div style={{ position: 'relative', width: '200px' }}>
            <Search
              size={14}
              style={{ position: 'absolute', left: '8px', top: '10px', color: '#94a3b8' }}
            />
            <input
              type="text"
              placeholder="Search permissions..."
              value={permSearch}
              onChange={(e) => setPermSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px 6px 28px',
                borderRadius: '4px',
                border: '1px solid #cbd5e1',
                fontSize: '0.75rem',
              }}
            />
          </div>
        </div>

        <div
          style={{
            padding: '12px',
            maxHeight: '180px',
            overflowY: 'auto',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
          }}
        >
          {filteredEffectivePerms.length === 0 ? (
            <div
              style={{
                padding: '12px',
                textAlign: 'center',
                color: '#94a3b8',
                fontSize: '0.8125rem',
                width: '100%',
              }}
            >
              No matching effective permissions found.
            </div>
          ) : (
            filteredEffectivePerms.map((p) => (
              <span
                key={p.id || p.code}
                style={{
                  fontSize: '0.75rem',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  backgroundColor: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #e2e8f0',
                  fontFamily: 'monospace',
                }}
              >
                {p.code}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
