'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/molecules/modal';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Plus, Trash2, AlertCircle } from '@/components/atoms/icons';
import { AccrualType, type LeaveType, type LeavePolicy } from '../types/leave.types';
import { LeaveService } from '../services/leave.service';

interface CreateEditPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaveTypes: LeaveType[];
  onSaved: (policy: LeavePolicy) => void;
}

interface EntitlementRow {
  leaveTypeId: string;
  quotaDays: number;
  accrualType: AccrualType;
}

export function CreateEditPolicyModal({
  isOpen,
  onClose,
  leaveTypes,
  onSaved,
}: CreateEditPolicyModalProps) {
  const currentYear = new Date().getFullYear();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(`${currentYear}-01-01`);
  const [effectiveTo, setEffectiveTo] = useState(`${currentYear}-12-31`);
  const [entitlements, setEntitlements] = useState<EntitlementRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(`Annual Leave Policy ${currentYear}`);
      setDescription('Standard full-time workforce leave entitlement policy');
      setEffectiveFrom(`${currentYear}-01-01`);
      setEffectiveTo(`${currentYear}-12-31`);

      // Prepopulate rows from available leave types
      if (leaveTypes.length > 0) {
        setEntitlements(
          leaveTypes.map((lt) => ({
            leaveTypeId: lt.id,
            quotaDays: lt.code === 'CL' ? 12 : lt.code === 'SL' ? 10 : lt.code === 'EL' ? 18 : 12,
            accrualType: lt.code === 'EL' ? AccrualType.MONTHLY : AccrualType.UPFRONT,
          })),
        );
      } else {
        setEntitlements([]);
      }
      setError(null);
    }
  }, [isOpen, leaveTypes, currentYear]);

  const handleAddEntitlement = () => {
    const first = leaveTypes[0];
    if (!first) return;
    setEntitlements((prev) => [
      ...prev,
      {
        leaveTypeId: first.id,
        quotaDays: 12,
        accrualType: AccrualType.UPFRONT,
      },
    ]);
  };

  const handleRemoveEntitlement = (index: number) => {
    setEntitlements((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateEntitlement = (index: number, patch: Partial<EntitlementRow>) => {
    setEntitlements((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (leaveTypes.length === 0) {
      setError('Please create at least one Leave Type before configuring policies.');
      return;
    }
    if (!name.trim()) {
      setError('Please provide a policy name');
      return;
    }
    if (entitlements.length === 0) {
      setError('Policy must contain at least one leave quota entitlement');
      return;
    }
    const hasInvalidEntitlement = entitlements.some(
      (ent) => !ent.leaveTypeId || isNaN(ent.quotaDays) || ent.quotaDays < 0,
    );
    if (hasInvalidEntitlement) {
      setError('Each quota row must have a valid Leave Type and non-negative Quota Days.');
      return;
    }
    if (effectiveTo && new Date(effectiveFrom) > new Date(effectiveTo)) {
      setError('Effective To date cannot be earlier than Effective From date.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const saved = await LeaveService.createPolicy({
        name: name.trim(),
        description: description.trim() || undefined,
        effectiveFrom,
        effectiveTo: effectiveTo ? effectiveTo : undefined,
        entitlements: entitlements.map((ent) => ({
          leaveTypeId: ent.leaveTypeId,
          annualQuota: Number(ent.quotaDays),
          quotaDays: Number(ent.quotaDays),
          accrualType: ent.accrualType,
        })),
      });

      onSaved(saved);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create policy';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Leave Policy & Quotas" size="lg">
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
      >
        {error && (
          <div
            style={{
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'hsl(var(--color-danger) / 0.1)',
              color: 'hsl(var(--color-danger))',
              fontSize: 'var(--font-size-xs)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label
            style={{
              display: 'block',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              color: 'hsl(var(--text-primary))',
              marginBottom: '6px',
            }}
          >
            Policy Name <span style={{ color: 'hsl(var(--color-danger))' }}>*</span>
          </label>
          <Input
            type="text"
            placeholder="e.g. Standard Corporate Leave Policy 2026"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)' }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'hsl(var(--text-primary))',
                marginBottom: '6px',
              }}
            >
              Effective From <span style={{ color: 'hsl(var(--color-danger))' }}>*</span>
            </label>
            <Input
              type="date"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
              required
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'hsl(var(--text-primary))',
                marginBottom: '6px',
              }}
            >
              Effective To
            </label>
            <Input
              type="date"
              value={effectiveTo}
              onChange={(e) => setEffectiveTo(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              color: 'hsl(var(--text-primary))',
              marginBottom: '6px',
            }}
          >
            Description
          </label>
          <Input
            type="text"
            placeholder="Brief overview of applicability and rules..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Entitlement Quotas Builder */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--space-2)',
            }}
          >
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 700,
                color: 'hsl(var(--text-primary))',
              }}
            >
              Leave Quotas & Accruals ({entitlements.length})
            </span>
            <Button type="button" variant="outline" size="sm" onClick={handleAddEntitlement}>
              <Plus size={13} style={{ marginRight: '4px' }} />
              Add Quota
            </Button>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)',
              maxHeight: '260px',
              overflowY: 'auto',
              border: '1px solid hsl(var(--border-subtle))',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-2)',
              backgroundColor: 'hsl(var(--bg-secondary) / 0.3)',
            }}
          >
            {leaveTypes.length === 0 ? (
              <div
                style={{
                  padding: 'var(--space-4)',
                  textAlign: 'center',
                  fontSize: 'var(--font-size-xs)',
                  color: 'hsl(var(--color-warning, 38 92% 50%))',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                }}
              >
                <AlertCircle size={20} />
                <span>
                  No Leave Types exist in this workspace yet. Please create at least one Leave Type
                  (under the &quot;Leave Types&quot; tab) before creating a policy.
                </span>
              </div>
            ) : entitlements.length === 0 ? (
              <div
                style={{
                  padding: 'var(--space-4)',
                  textAlign: 'center',
                  fontSize: 'var(--font-size-xs)',
                  color: 'hsl(var(--text-muted))',
                }}
              >
                No quotas configured. Click &quot;Add Quota&quot; to define entitlements.
              </div>
            ) : (
              entitlements.map((row, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1.5fr auto',
                    gap: 'var(--space-2)',
                    alignItems: 'center',
                    padding: 'var(--space-2)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'hsl(var(--bg-surface))',
                    border: '1px solid hsl(var(--border-subtle))',
                  }}
                >
                  <select
                    value={row.leaveTypeId}
                    onChange={(e) => handleUpdateEntitlement(idx, { leaveTypeId: e.target.value })}
                    style={{
                      height: '34px',
                      padding: '0 var(--space-2)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid hsl(var(--border-subtle))',
                      fontSize: 'var(--font-size-xs)',
                    }}
                  >
                    {leaveTypes.map((lt) => (
                      <option key={lt.id} value={lt.id}>
                        {lt.name} ({lt.code})
                      </option>
                    ))}
                  </select>

                  <Input
                    type="number"
                    min={0}
                    max={365}
                    value={row.quotaDays}
                    onChange={(e) =>
                      handleUpdateEntitlement(idx, { quotaDays: Number(e.target.value) })
                    }
                    placeholder="Days"
                    style={{ height: '34px' }}
                  />

                  <select
                    value={row.accrualType}
                    onChange={(e) =>
                      handleUpdateEntitlement(idx, { accrualType: e.target.value as AccrualType })
                    }
                    style={{
                      height: '34px',
                      padding: '0 var(--space-2)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid hsl(var(--border-subtle))',
                      fontSize: 'var(--font-size-xs)',
                    }}
                  >
                    <option value={AccrualType.UPFRONT}>Upfront (Annual)</option>
                    <option value={AccrualType.MONTHLY}>Monthly Accrual</option>
                    <option value={AccrualType.QUARTERLY}>Quarterly Accrual</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => handleRemoveEntitlement(idx)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'hsl(var(--color-danger))',
                      cursor: 'pointer',
                      padding: 'var(--space-2)',
                    }}
                    title="Remove quota"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 'var(--space-3)',
            marginTop: 'var(--space-2)',
          }}
        >
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Create Leave Policy'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
