'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, Sparkles, ChevronDown, ChevronRight } from '@/components/atoms/icons';
import { IamService } from '../../services/iam.service';
import { useSuggestedSecurityRole } from '../../hooks/useSuggestedSecurityRole';
import type { SecurityRole, EmployeeSecurityFormValues } from '../../types/employee-iam';

interface Step3SecurityRolePickerProps {
  values: EmployeeSecurityFormValues;
  onChange: (patch: Partial<EmployeeSecurityFormValues>) => void;
  jobRoleTitle?: string;
  error?: string | null;
}

export function Step3SecurityRolePicker({
  values,
  onChange,
  jobRoleTitle,
  error,
}: Step3SecurityRolePickerProps) {
  const [availableRoles, setAvailableRoles] = useState<SecurityRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    async function loadRoles() {
      try {
        setLoading(true);
        const roles = await IamService.getSecurityRoles();
        if (mounted) {
          setAvailableRoles(roles);
          if (!initializedRef.current && values.selectedRoleIds.length === 0 && roles.length > 0) {
            initializedRef.current = true;
            const employeeRole = roles.find((r) => r.code === 'EMPLOYEE') ?? roles[0];
            if (employeeRole) {
              onChange({ selectedRoleIds: [employeeRole.id] });
            }
          }
        }
      } catch (err) {
        console.error('Failed to load security roles', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void loadRoles();
    return () => {
      mounted = false;
    };
  }, [onChange, values.selectedRoleIds.length]);

  const suggestedRole = useSuggestedSecurityRole(jobRoleTitle, availableRoles);

  const isRoleSelected = (roleId: string) => values.selectedRoleIds.includes(roleId);

  const toggleRole = (roleId: string) => {
    const isSelected = isRoleSelected(roleId);
    let updated: string[];
    if (isSelected) {
      updated = values.selectedRoleIds.filter((id) => id !== roleId);
    } else {
      updated = [...values.selectedRoleIds, roleId];
    }
    onChange({ selectedRoleIds: updated });
  };

  const applySuggestedRole = () => {
    if (suggestedRole && !isRoleSelected(suggestedRole.id)) {
      onChange({ selectedRoleIds: [...values.selectedRoleIds, suggestedRole.id] });
    }
  };

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
          Security Roles & System Access
        </h3>
        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'hsl(var(--text-muted))' }}>
          Assign one or more Security Roles. Security Roles bundle atomic backend API permissions.
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

      {/* Suggested Security Role Banner */}
      {suggestedRole && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={18} style={{ color: '#16a34a', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#14532d' }}>
                Suggested Security Role:{' '}
                <span style={{ textDecoration: 'underline' }}>{suggestedRole.name}</span> (
                {suggestedRole.code})
              </div>
              <div style={{ fontSize: '0.75rem', color: '#15803d' }}>
                Based on designated HR Job Role: {jobRoleTitle || 'General Staff'}
              </div>
            </div>
          </div>

          {!isRoleSelected(suggestedRole.id) ? (
            <button
              type="button"
              onClick={applySuggestedRole}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Check size={14} /> Add Role
            </button>
          ) : (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#15803d',
              }}
            >
              <Check size={14} /> Included
            </span>
          )}
        </div>
      )}

      {/* Security Roles Checkbox List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>
          Available Security Roles ({availableRoles.length})
        </div>

        {loading ? (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              color: 'hsl(var(--text-muted))',
              fontSize: '0.875rem',
            }}
          >
            Loading security roles catalog...
          </div>
        ) : availableRoles.length === 0 ? (
          <div
            style={{
              padding: '16px',
              textAlign: 'center',
              color: 'hsl(var(--text-muted))',
              fontSize: '0.8125rem',
            }}
          >
            No security roles found. Default EMPLOYEE role will be assigned.
          </div>
        ) : (
          availableRoles.map((role) => {
            const isSelected = isRoleSelected(role.id);
            const isExpanded = expandedRoleId === role.id;
            const isSuggested = suggestedRole?.id === role.id;

            // Extract all permissions in this role
            const permissionsList = role.policyModules
              ? role.policyModules.flatMap((pm) => pm.permissions || [])
              : role.permissions || [];

            return (
              <div
                key={role.id}
                style={{
                  border: isSelected
                    ? '1.5px solid hsl(var(--color-primary, 221 83% 53%))'
                    : '1px solid hsl(var(--border-subtle, 214 32% 91%))',
                  borderRadius: '8px',
                  backgroundColor: isSelected
                    ? 'hsl(var(--color-primary-bg, 221 83% 98%))'
                    : '#ffffff',
                  transition: 'all 0.15s ease',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    gap: '12px',
                    cursor: 'pointer',
                  }}
                  onClick={() => toggleRole(role.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
                    {/* Custom Checkbox */}
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        border: isSelected ? 'none' : '1.5px solid #cbd5e1',
                        backgroundColor: isSelected
                          ? 'hsl(var(--color-primary, 221 83% 53%))'
                          : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        marginTop: '2px',
                        flexShrink: 0,
                      }}
                    >
                      {isSelected && <Check size={14} />}
                    </div>

                    {/* Role Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: 'hsl(var(--text-primary))',
                          }}
                        >
                          {role.name}
                        </span>
                        <code
                          style={{
                            fontSize: '0.6875rem',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            backgroundColor: '#f1f5f9',
                            color: '#475569',
                            fontWeight: 600,
                          }}
                        >
                          {role.code}
                        </code>
                        {isSuggested && (
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: '#dcfce7',
                              color: '#15803d',
                              fontWeight: 700,
                            }}
                          >
                            Suggested
                          </span>
                        )}
                        {role.isSystem && (
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: '#f3e8ff',
                              color: '#7e22ce',
                              fontWeight: 600,
                            }}
                          >
                            System Role
                          </span>
                        )}
                      </div>

                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.8125rem',
                          color: 'hsl(var(--text-secondary))',
                        }}
                      >
                        {role.description || 'Standard security role privileges.'}
                      </p>
                    </div>
                  </div>

                  {/* Expand/Collapse Permissions Button */}
                  {permissionsList.length > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedRoleId(isExpanded ? null : role.id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'hsl(var(--text-muted))',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        padding: '4px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      <span>{permissionsList.length} perms</span>
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                  )}
                </div>

                {/* Expandable Permissions Drawer */}
                {isExpanded && permissionsList.length > 0 && (
                  <div
                    style={{
                      padding: '10px 14px 14px 46px',
                      borderTop: '1px dashed hsl(var(--border-subtle))',
                      backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.6)' : '#f8fafc',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        color: 'hsl(var(--text-secondary))',
                        marginBottom: '6px',
                      }}
                    >
                      INCLUDED ATOMIC PERMISSIONS:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {permissionsList.map((p) => (
                        <span
                          key={p.id || p.code}
                          style={{
                            fontSize: '0.6875rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: '#e2e8f0',
                            color: '#334155',
                            fontFamily: 'monospace',
                          }}
                        >
                          {p.code}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
