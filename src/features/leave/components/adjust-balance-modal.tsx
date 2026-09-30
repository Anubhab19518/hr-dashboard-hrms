'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/molecules/modal';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { AlertCircle } from '@/components/atoms/icons';
import type { LeaveType, LeaveBalance } from '../types/leave.types';
import { LeaveService } from '../services/leave.service';
import { EmployeeService } from '@/features/employees/services/employee.service';

interface AdjustBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaveTypes: LeaveType[];
  employees?: Array<{
    id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    employeeCode?: string;
  }>;
  preselectedEmployeeId?: string;
  preselectedLeaveTypeId?: string;
  onAdjusted: (balance: LeaveBalance) => void;
}

export function AdjustBalanceModal({
  isOpen,
  onClose,
  leaveTypes,
  employees = [],
  preselectedEmployeeId,
  preselectedLeaveTypeId,
  onAdjusted,
}: AdjustBalanceModalProps) {
  const currentYear = new Date().getFullYear();
  const [employeeList, setEmployeeList] = useState(employees);
  const [employeeId, setEmployeeId] = useState<string>(
    preselectedEmployeeId || employees[0]?.id || '',
  );
  const [leaveTypeId, setLeaveTypeId] = useState<string>(
    preselectedLeaveTypeId || leaveTypes[0]?.id || '',
  );
  const [year, setYear] = useState<number>(currentYear);
  const [adjustment, setAdjustment] = useState<number | ''>('');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fallback fetch employees if not provided by parent
  useEffect(() => {
    if (employees && employees.length > 0) {
      setEmployeeList(employees);
    } else {
      void EmployeeService.getEmployees({ limit: 500 })
        .then((res) => {
          if (res.records && res.records.length > 0) {
            setEmployeeList(res.records);
          }
        })
        .catch(() => {});
    }
  }, [employees]);

  // Sync defaults when employee or leaveType list changes
  useEffect(() => {
    if (preselectedEmployeeId) {
      setEmployeeId(preselectedEmployeeId);
    } else if (!employeeId && employeeList.length > 0 && employeeList[0]?.id) {
      setEmployeeId(employeeList[0].id);
    }
  }, [preselectedEmployeeId, employeeList, employeeId]);

  useEffect(() => {
    if (preselectedLeaveTypeId) {
      setLeaveTypeId(preselectedLeaveTypeId);
    } else if (!leaveTypeId && leaveTypes.length > 0 && leaveTypes[0]?.id) {
      setLeaveTypeId(leaveTypes[0].id);
    }
  }, [preselectedLeaveTypeId, leaveTypes, leaveTypeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) {
      setError('Please select an employee');
      return;
    }
    if (!leaveTypeId) {
      setError('Please select a leave category');
      return;
    }
    if (adjustment === '' || Number(adjustment) === 0) {
      setError('Adjustment cannot be zero');
      return;
    }
    if (!reason.trim() || reason.trim().length < 3) {
      setError('Please provide a mandatory reason for adjustment (min 3 characters)');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const selectedEmp = employeeList.find((e) => e.id === employeeId);
      const empUserId =
        (selectedEmp as { userId?: string; user_id?: string })?.userId ||
        (selectedEmp as { userId?: string; user_id?: string })?.user_id;

      const balance = await LeaveService.adjustBalance({
        employeeId,
        userId: empUserId,
        leaveTypeId,
        year: Number(year),
        adjustment: Number(adjustment),
        reason: reason.trim(),
      });

      if (empUserId && empUserId !== employeeId) {
        await LeaveService.adjustBalance({
          employeeId: empUserId,
          leaveTypeId,
          year: Number(year),
          adjustment: Number(adjustment),
          reason: reason.trim(),
        }).catch(() => {});
      }

      onAdjusted(balance);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to adjust balance';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manual Leave Balance Adjustment" size="md">
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
              marginBottom: '6px',
            }}
          >
            Select Employee <span style={{ color: 'hsl(var(--color-danger))' }}>*</span>
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
            {employeeList.map((emp) => {
              const name =
                emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee';
              const code = emp.employeeCode ? ` (${emp.employeeCode})` : '';
              return (
                <option key={emp.id} value={emp.id}>
                  {name}
                  {code}
                </option>
              );
            })}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-3)' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                marginBottom: '6px',
              }}
            >
              Leave Category <span style={{ color: 'hsl(var(--color-danger))' }}>*</span>
            </label>
            <select
              value={leaveTypeId}
              onChange={(e) => setLeaveTypeId(e.target.value)}
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
              {leaveTypes.map((lt) => (
                <option key={lt.id} value={lt.id}>
                  {lt.name} ({lt.code})
                </option>
              ))}
            </select>
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
              Year
            </label>
            <Input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              required
            />
          </div>
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
            Adjustment Days <span style={{ color: 'hsl(var(--color-danger))' }}>*</span>
          </label>
          <Input
            type="number"
            step="0.5"
            placeholder="e.g. +2 for credit, -1 for deduction"
            value={adjustment}
            onChange={(e) => setAdjustment(e.target.value === '' ? '' : Number(e.target.value))}
            required
          />
          <span
            style={{
              fontSize: '11px',
              color: 'hsl(var(--text-muted))',
              marginTop: '4px',
              display: 'block',
            }}
          >
            Enter positive value to credit extra days (e.g. comp-off), or negative to debit.
          </span>
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
            Adjustment Reason <span style={{ color: 'hsl(var(--color-danger))' }}>*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Compensatory off granted for weekend deployment support"
            rows={3}
            required
            style={{
              width: '100%',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid hsl(var(--border-subtle))',
              backgroundColor: 'hsl(var(--bg-secondary))',
              fontSize: 'var(--font-size-xs)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
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
            {isSubmitting ? 'Adjusting...' : 'Save Adjustment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
