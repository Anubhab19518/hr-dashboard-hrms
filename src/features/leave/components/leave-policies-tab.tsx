'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import { Plus, Layers, Building2 } from '@/components/atoms/icons';
import type { LeavePolicy, LeaveType } from '../types/leave.types';
import { CreateEditPolicyModal } from './create-edit-policy-modal';

interface LeavePoliciesTabProps {
  policies: LeavePolicy[];
  leaveTypes: LeaveType[];
  isLoading: boolean;
  onRefresh: () => void;
  canManage?: boolean;
}

export function LeavePoliciesTab({
  policies,
  leaveTypes,
  isLoading,
  onRefresh,
  canManage = true,
}: LeavePoliciesTabProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Filter for Workspace Standard Templates only (exclude dedicated custom company policies)
  const workspaceTemplatePolicies = useMemo(() => {
    return (policies || []).filter((pol) => {
      if (pol.isCustomCompanyPolicy) return false;
      if (pol.companyId) return false;
      const name = String(pol.name || '').toLowerCase();
      if (name.includes('custom')) return false;
      return true;
    });
  }, [policies]);

  return (
    <div
      style={{
        backgroundColor: 'hsl(var(--bg-surface))',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid hsl(var(--border-subtle))',
        padding: 'var(--space-5)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
      }}
    >
      {/* 1. Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 'var(--font-size-base)',
              fontWeight: 700,
              color: 'hsl(var(--text-primary))',
              margin: 0,
            }}
          >
            Leave Policy Templates & Quotas
          </h2>
          <p
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'hsl(var(--text-secondary))',
              margin: '2px 0 0 0',
            }}
          >
            Define reusable annual quota templates and accrual rules across your workspace
          </p>
        </div>

        {canManage && (
          <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={14} style={{ marginRight: '6px' }} />
            Create Leave Policy
          </Button>
        )}
      </div>

      {/* Info Guide */}
      <div
        style={{
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'hsl(var(--primary-color) / 0.04)',
          border: '1px solid hsl(var(--primary-color) / 0.15)',
          fontSize: 'var(--font-size-xs)',
          color: 'hsl(var(--text-secondary))',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
        }}
      >
        <Building2 size={16} style={{ color: 'hsl(var(--primary-color))', flexShrink: 0 }} />
        <span>
          <strong>Company-Specific Leave Policies:</strong> To assign a policy to a client company,
          navigate to <strong>Organization → Companies → [Company Name] → Leave Policies</strong>.
          Use this page to define global policy templates and quotas.
        </span>
      </div>

      {/* 2. Policies Grid */}
      {isLoading ? (
        <div
          style={{
            padding: 'var(--space-8)',
            textAlign: 'center',
            color: 'hsl(var(--text-muted))',
            fontSize: 'var(--font-size-xs)',
          }}
        >
          Loading leave policies...
        </div>
      ) : workspaceTemplatePolicies.length === 0 ? (
        <div
          style={{
            padding: 'var(--space-8)',
            textAlign: 'center',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed hsl(var(--border-subtle))',
            backgroundColor: 'hsl(var(--bg-secondary) / 0.4)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}
        >
          <Layers size={28} style={{ color: 'hsl(var(--text-muted))' }} />
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}>
            No workspace template policies created yet. Create a policy to assign quotas.
          </div>
          {canManage && (
            <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={13} style={{ marginRight: '4px' }} />
              Create Policy
            </Button>
          )}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {workspaceTemplatePolicies.map((pol) => (
            <div
              key={pol.id}
              style={{
                borderRadius: 'var(--radius-lg)',
                border: '1px solid hsl(var(--border-subtle))',
                backgroundColor: 'hsl(var(--bg-secondary) / 0.4)',
                padding: 'var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 'var(--space-3)',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 'var(--font-size-sm)',
                        color: 'hsl(var(--text-primary))',
                      }}
                    >
                      {pol.name}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'hsl(var(--text-muted))',
                        marginTop: '2px',
                      }}
                    >
                      Effective: {pol.effectiveFrom}{' '}
                      {pol.effectiveTo ? `to ${pol.effectiveTo}` : '(Open)'}
                    </div>
                  </div>
                  <Badge variant={pol.isActive !== false ? 'success' : 'secondary'}>
                    {pol.isActive !== false ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {pol.description && (
                  <p
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'hsl(var(--text-secondary))',
                      margin: 'var(--space-2) 0',
                    }}
                  >
                    {pol.description}
                  </p>
                )}

                {/* Entitlements Breakdown */}
                <div style={{ marginTop: 'var(--space-3)' }}>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'hsl(var(--text-muted))',
                      textTransform: 'uppercase',
                      marginBottom: '6px',
                    }}
                  >
                    Configured Quotas:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {pol.entitlements && pol.entitlements.length > 0 ? (
                      pol.entitlements.map((ent, idx) => {
                        const lt = leaveTypes.find((t) => t.id === ent.leaveTypeId);
                        return (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '4px 8px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: 'hsl(var(--bg-surface))',
                              border: '1px solid hsl(var(--border-subtle))',
                              fontSize: '11px',
                            }}
                          >
                            <span style={{ fontWeight: 600, color: 'hsl(var(--text-primary))' }}>
                              {lt?.name || ent.leaveType?.name || 'Leave Type'}
                            </span>
                            <span style={{ fontWeight: 700, color: 'hsl(var(--primary-color))' }}>
                              {ent.annualQuota ?? ent.quotaDays ?? 0} Days / Year (
                              {ent.accrualType.toLowerCase()})
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
                        No quotas listed.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: 'var(--space-3)',
                  borderTop: '1px solid hsl(var(--border-subtle))',
                }}
              >
                <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
                  {pol.assignmentsCount !== undefined
                    ? `${pol.assignmentsCount} assignments`
                    : 'Template active'}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    color: 'hsl(var(--text-secondary))',
                    fontStyle: 'italic',
                  }}
                >
                  Assigned via Company Profiles
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Creating Policy */}
      {isCreateModalOpen && (
        <CreateEditPolicyModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          leaveTypes={leaveTypes}
          onSaved={() => onRefresh()}
        />
      )}
    </div>
  );
}
