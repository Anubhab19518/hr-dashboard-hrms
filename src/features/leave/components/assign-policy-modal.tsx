'use client';

import { useState } from 'react';
import { Modal } from '@/components/molecules/modal';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { AlertCircle } from '@/components/atoms/icons';
import type { LeavePolicy, LeavePolicyAssignment } from '../types/leave.types';
import { LeaveService } from '../services/leave.service';

interface AssignPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  policy: LeavePolicy | null;
  employees: Array<{
    id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    employeeCode?: string;
  }>;
  onAssigned: (assignment: LeavePolicyAssignment) => void;
}

export function AssignPolicyModal({
  isOpen,
  onClose,
  policy,
  employees,
  onAssigned,
}: AssignPolicyModalProps) {
  const currentYear = new Date().getFullYear();
  const [employeeId, setEmployeeId] = useState<string>(employees[0]?.id || '');
  const [effectiveFrom, setEffectiveFrom] = useState(`${currentYear}-01-01`);
  const [effectiveTo, setEffectiveTo] = useState(`${currentYear}-12-31`);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!policy) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) {
      setError('Please select an employee to assign this custom override policy');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const assignment = await LeaveService.assignPolicy(policy.id, {
        employeeId,
        effectiveFrom,
        effectiveTo: effectiveTo || undefined,
      });

      onAssigned(assignment);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to assign policy';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign Custom Override: ${policy.name}`}
      size="md"
    >
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

        <div
          style={{
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'hsl(var(--bg-secondary) / 0.5)',
            border: '1px solid hsl(var(--border-subtle))',
            fontSize: 'var(--font-size-xs)',
            color: 'hsl(var(--text-secondary))',
          }}
        >
          <strong>Note:</strong> Company-wide policies are assigned directly inside each Client
          Company Profile (<strong>Organization → Companies → Leave Policies</strong>). Use this
          modal to configure individual employee overrides.
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              marginBottom: '6px',
            }}
          >
            Select Employee (Override) <span style={{ color: 'hsl(var(--color-danger))' }}>*</span>
          </label>
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            required
            style={{
              width: '100%',
              height: '38px',
              padding: '0 var(--space-3)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid hsl(var(--border-subtle))',
              backgroundColor: 'hsl(var(--bg-secondary))',
              fontSize: 'var(--font-size-xs)',
            }}
          >
            {employees.length === 0 ? (
              <option value="">No employees found</option>
            ) : (
              employees.map((emp) => {
                const name =
                  emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee';
                const code = emp.employeeCode ? ` (${emp.employeeCode})` : '';
                return (
                  <option key={emp.id} value={emp.id}>
                    {name}
                    {code}
                  </option>
                );
              })
            )}
          </select>
        </div>

        <div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)' }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
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
            {isSubmitting ? 'Assigning...' : 'Confirm Assignment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
