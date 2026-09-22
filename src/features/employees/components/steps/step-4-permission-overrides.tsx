'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Trash2, ShieldAlert, ShieldCheck, Info } from '@/components/atoms/icons';
import { IamService } from '../../services/iam.service';
import type { Permission, EmployeeSecurityFormValues } from '../../types/employee-iam';

interface Step4PermissionOverridesProps {
  values: EmployeeSecurityFormValues;
  onChange: (patch: Partial<EmployeeSecurityFormValues>) => void;
  error?: string | null;
}

export function Step4PermissionOverrides({
  values,
  onChange,
  error,
}: Step4PermissionOverridesProps) {
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'GRANT' | 'DENY'>('GRANT');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPermissionId, setSelectedPermissionId] = useState<string>('');
  const [reasonInput, setReasonInput] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    async function loadPermissions() {
      try {
        setLoading(true);
        const perms = await IamService.getAtomicPermissions();
        if (mounted) {
          setAllPermissions(perms);
        }
      } catch (err) {
        console.error('Failed to load atomic permissions catalog', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadPermissions();
    return () => {
      mounted = false;
    };
  }, []);

  // Filtered available permissions for the dropdown picker
  const filteredPermissions = useMemo(() => {
    const existingGrantedIds = new Set(values.grantedOverrides.map((g) => g.permissionId));
    const existingDeniedIds = new Set(values.deniedOverrides.map((d) => d.permissionId));

    return allPermissions.filter((p) => {
      // Exclude if already in current list
      if (activeTab === 'GRANT' && existingGrantedIds.has(p.id)) return false;
      if (activeTab === 'DENY' && existingDeniedIds.has(p.id)) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.code.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.subject.toLowerCase().includes(q)
      );
    });
  }, [allPermissions, values.grantedOverrides, values.deniedOverrides, activeTab, searchQuery]);

  const handleAddOverride = () => {
    if (!selectedPermissionId) return;

    if (activeTab === 'GRANT') {
      // If was in denied, remove from denied
      const newDenied = values.deniedOverrides.filter(
        (d) => d.permissionId !== selectedPermissionId,
      );
      const newGranted = [
        ...values.grantedOverrides,
        { permissionId: selectedPermissionId, reason: reasonInput.trim() || undefined },
      ];
      onChange({ grantedOverrides: newGranted, deniedOverrides: newDenied });
    } else {
      // If was in granted, remove from granted
      const newGranted = values.grantedOverrides.filter(
        (g) => g.permissionId !== selectedPermissionId,
      );
      const newDenied = [
        ...values.deniedOverrides,
        { permissionId: selectedPermissionId, reason: reasonInput.trim() || undefined },
      ];
      onChange({ grantedOverrides: newGranted, deniedOverrides: newDenied });
    }

    setSelectedPermissionId('');
    setReasonInput('');
  };

  const handleRemoveGranted = (permissionId: string) => {
    onChange({
      grantedOverrides: values.grantedOverrides.filter((g) => g.permissionId !== permissionId),
    });
  };

  const handleRemoveDenied = (permissionId: string) => {
    onChange({
      deniedOverrides: values.deniedOverrides.filter((d) => d.permissionId !== permissionId),
    });
  };

  const getPermissionObj = (id: string) => allPermissions.find((p) => p.id === id);

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
          Granular Permission Overrides (Optional)
        </h3>
        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'hsl(var(--text-muted))' }}>
          Configure direct per-employee permission grants or explicit denies. Overrides take
          precedence over security roles.
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

      {/* Precedence Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 14px',
          borderRadius: '8px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          fontSize: '0.75rem',
          color: '#475569',
        }}
      >
        <Info size={16} style={{ color: '#64748b', flexShrink: 0 }} />
        <div>
          <strong>Evaluation Precedence:</strong>{' '}
          <span style={{ color: '#b91c1c', fontWeight: 600 }}>Explicit DENY</span> overrides{' '}
          <span style={{ color: '#2563eb', fontWeight: 600 }}>Role GRANT</span> overrides{' '}
          <span style={{ color: '#16a34a', fontWeight: 600 }}>Direct GRANT</span>.
        </div>
      </div>

      {/* Tab Switcher: Direct Grants vs Explicit Denies */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-2)',
          borderBottom: '1px solid hsl(var(--border-subtle))',
          paddingBottom: '2px',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('GRANT')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px 6px 0 0',
            border: 'none',
            borderBottom: activeTab === 'GRANT' ? '2px solid #16a34a' : '2px solid transparent',
            backgroundColor: activeTab === 'GRANT' ? '#f0fdf4' : 'transparent',
            color: activeTab === 'GRANT' ? '#15803d' : '#64748b',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <ShieldCheck size={16} />
          <span>Additional Granted Permissions</span>
          {values.grantedOverrides.length > 0 && (
            <span
              style={{
                padding: '1px 6px',
                borderRadius: '10px',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                fontSize: '0.6875rem',
              }}
            >
              {values.grantedOverrides.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('DENY')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px 6px 0 0',
            border: 'none',
            borderBottom: activeTab === 'DENY' ? '2px solid #dc2626' : '2px solid transparent',
            backgroundColor: activeTab === 'DENY' ? '#fef2f2' : 'transparent',
            color: activeTab === 'DENY' ? '#b91c1c' : '#64748b',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <ShieldAlert size={16} />
          <span>Restricted / Denied Permissions</span>
          {values.deniedOverrides.length > 0 && (
            <span
              style={{
                padding: '1px 6px',
                borderRadius: '10px',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                fontSize: '0.6875rem',
              }}
            >
              {values.deniedOverrides.length}
            </span>
          )}
        </button>
      </div>

      {/* Add Override Form */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr auto',
          gap: 'var(--space-2)',
          alignItems: 'flex-end',
          padding: '14px',
          borderRadius: '8px',
          backgroundColor: activeTab === 'GRANT' ? '#f0fdf4' : '#fef2f2',
          border: activeTab === 'GRANT' ? '1px solid #bbf7d0' : '1px solid #fecaca',
        }}
      >
        {/* Permission Search & Select */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>
              Select Atomic Permission to {activeTab === 'GRANT' ? 'Grant' : 'Restrict'}
            </label>
            <div style={{ position: 'relative', width: '130px' }}>
              <Search
                size={12}
                style={{ position: 'absolute', left: '6px', top: '7px', color: '#94a3b8' }}
              />
              <input
                type="text"
                placeholder="Filter perms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '2px 6px 2px 22px',
                  borderRadius: '4px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.6875rem',
                }}
              />
            </div>
          </div>
          <select
            value={selectedPermissionId}
            onChange={(e) => setSelectedPermissionId(e.target.value)}
            disabled={loading}
            style={{
              padding: '8px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '0.8125rem',
              height: '38px',
            }}
          >
            <option value="">-- Choose Permission ({filteredPermissions.length}) --</option>
            {filteredPermissions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} ({p.name || p.subject})
              </option>
            ))}
          </select>
        </div>

        {/* Reason Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>
            Business Justification (Optional)
          </label>
          <input
            type="text"
            placeholder={
              activeTab === 'GRANT'
                ? 'e.g. Temporary project access'
                : 'e.g. Prevent deletion of company records'
            }
            value={reasonInput}
            onChange={(e) => setReasonInput(e.target.value)}
            style={{
              padding: '8px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '0.8125rem',
              height: '38px',
            }}
          />
        </div>

        {/* Add Button */}
        <button
          type="button"
          onClick={handleAddOverride}
          disabled={!selectedPermissionId}
          style={{
            height: '38px',
            padding: '0 16px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: !selectedPermissionId
              ? '#94a3b8'
              : activeTab === 'GRANT'
                ? '#16a34a'
                : '#dc2626',
            color: '#ffffff',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: !selectedPermissionId ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Plus size={16} /> Add Override
        </button>
      </div>

      {/* Configured Overrides List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {activeTab === 'GRANT' ? (
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#15803d',
                marginBottom: '8px',
              }}
            >
              Direct Grants Configured ({values.grantedOverrides.length})
            </div>

            {values.grantedOverrides.length === 0 ? (
              <div
                style={{
                  padding: '16px',
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontSize: '0.8125rem',
                }}
              >
                No extra permissions directly granted. The employee will receive standard
                permissions from their assigned security roles.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {values.grantedOverrides.map((override) => {
                  const perm = getPermissionObj(override.permissionId);
                  return (
                    <div
                      key={override.permissionId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <code
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: '#15803d',
                            backgroundColor: '#dcfce7',
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          + {perm?.code || override.permissionId}
                        </code>
                        <span style={{ fontSize: '0.8125rem', color: '#334155' }}>
                          {perm?.name || perm?.subject}
                        </span>
                        {override.reason && (
                          <span
                            style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}
                          >
                            ({override.reason})
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveGranted(override.permissionId)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                        title="Remove override"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#b91c1c',
                marginBottom: '8px',
              }}
            >
              Explicit Denies Configured ({values.deniedOverrides.length})
            </div>

            {values.deniedOverrides.length === 0 ? (
              <div
                style={{
                  padding: '16px',
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontSize: '0.8125rem',
                }}
              >
                No explicit permission restrictions configured.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {values.deniedOverrides.map((override) => {
                  const perm = getPermissionObj(override.permissionId);
                  return (
                    <div
                      key={override.permissionId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <code
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: '#b91c1c',
                            backgroundColor: '#fee2e2',
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          DENY {perm?.code || override.permissionId}
                        </code>
                        <span style={{ fontSize: '0.8125rem', color: '#334155' }}>
                          {perm?.name || perm?.subject}
                        </span>
                        {override.reason && (
                          <span
                            style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}
                          >
                            ({override.reason})
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDenied(override.permissionId)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                        title="Remove restriction"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
