'use client';

import { useState, useMemo, useCallback } from 'react';
import { Modal } from '@/components/molecules/modal';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Clock, Upload, AlertCircle } from '@/components/atoms/icons';
import {
  HalfDayType,
  type LeaveType,
  type LeaveBalance,
  type LeaveApplication,
  type LeavePolicy,
} from '../types/leave.types';
import { LeaveService } from '../services/leave.service';

interface ApplyLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaveTypes: LeaveType[];
  balances?: LeaveBalance[];
  policies?: LeavePolicy[];
  onSuccess?: (app: LeaveApplication) => void;
}

export function ApplyLeaveModal({
  isOpen,
  onClose,
  leaveTypes,
  balances = [],
  policies = [],
  onSuccess,
}: ApplyLeaveModalProps) {
  const [leaveTypeId, setLeaveTypeId] = useState<string>(leaveTypes[0]?.id || '');
  const [fromDate, setFromDate] = useState<string>(
    () => new Date().toISOString().split('T')[0] || '',
  );
  const [toDate, setToDate] = useState<string>(() => new Date().toISOString().split('T')[0] || '');
  const [fromHalf, setFromHalf] = useState<HalfDayType>(HalfDayType.FULL);
  const [toHalf, setToHalf] = useState<HalfDayType>(HalfDayType.FULL);
  const [reason, setReason] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected leave type metadata
  const activeLeaveType = useMemo(
    () => leaveTypes.find((lt) => lt.id === leaveTypeId) || leaveTypes[0],
    [leaveTypes, leaveTypeId],
  );

  // Helper to resolve policy quota for a leave type
  const getPolicyQuota = useCallback(
    (ltId: string): number | null => {
      const allEntitlements = (policies || []).flatMap(
        (p) =>
          p.entitlements ||
          ((p as unknown as Record<string, unknown>)
            ?.policyEntitlements as typeof p.entitlements) ||
          [],
      );
      const ent = allEntitlements.find((e) => e && e.leaveTypeId === ltId);
      if (!ent) return null;

      const annualQuota = ent.annualQuota ?? ent.quotaDays ?? 0;
      const currentMonth = new Date().getMonth() + 1;
      if (ent.accrualType === 'MONTHLY') {
        return Math.round((annualQuota / 12) * currentMonth * 10) / 10;
      }
      if (ent.accrualType === 'QUARTERLY') {
        const currentQuarter = Math.ceil(currentMonth / 3);
        return Math.round((annualQuota / 4) * currentQuarter * 10) / 10;
      }
      return annualQuota;
    },
    [policies],
  );

  // Matching balance for selected leave type (fallback to policy entitlement quota if balance record not yet created)
  const matchingBalance = useMemo(() => {
    const existing = balances.find((b) => b && b.leaveTypeId === leaveTypeId);
    if (existing !== undefined) return existing;

    const quota = getPolicyQuota(leaveTypeId);
    if (quota !== null) {
      return {
        id: `virtual-${leaveTypeId}`,
        employeeId: '',
        leaveTypeId,
        year: new Date().getFullYear(),
        openingBalance: quota,
        accrued: quota,
        used: 0,
        closingBalance: quota,
        lopDays: 0,
      } as LeaveBalance;
    }

    return undefined;
  }, [balances, leaveTypeId, getPolicyQuota]);

  // Approximate working days calculation preview
  const estimatedDays = useMemo(() => {
    if (!fromDate || !toDate) return 0;
    const start = new Date(fromDate);
    const end = new Date(toDate);
    if (end < start) return 0;

    const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
    let days = diffDays;

    if (diffDays === 1) {
      if (fromHalf !== HalfDayType.FULL) days = 0.5;
    } else {
      if (fromHalf !== HalfDayType.FULL) days -= 0.5;
      if (toHalf !== HalfDayType.FULL) days -= 0.5;
    }

    return Math.max(0.5, days);
  }, [fromDate, toDate, fromHalf, toHalf]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveTypeId) {
      setError('Please select a leave category');
      return;
    }
    if (!fromDate || !toDate) {
      setError('Please specify valid start and end dates');
      return;
    }
    if (new Date(toDate) < new Date(fromDate)) {
      setError('End date must be on or after start date');
      return;
    }
    if (!reason.trim() || reason.trim().length < 3) {
      setError('Please provide a reason for leave (minimum 3 characters)');
      return;
    }
    if (activeLeaveType?.requiresDocument && !selectedFile) {
      setError(`Supporting documentation is mandatory for ${activeLeaveType.name}`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const application = await LeaveService.applyLeave({
        leaveTypeId,
        fromDate,
        toDate,
        fromHalf,
        toHalf,
        reason: reason.trim(),
      });

      // If supporting document was uploaded, upload it to application
      if (selectedFile && application?.id) {
        try {
          await LeaveService.uploadApplicationDocument(application.id, selectedFile);
        } catch {
          // Document upload warning
        }
      }

      if (onSuccess) onSuccess(application);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit leave application';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Apply for Leave" size="lg">
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

        {/* Leave Type Selector */}
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
            Leave Type & Category <span style={{ color: 'hsl(var(--color-danger))' }}>*</span>
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
              color: 'hsl(var(--text-primary))',
              fontSize: 'var(--font-size-xs)',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {leaveTypes.map((lt) => {
              const b = balances.find((bal) => bal && bal.leaveTypeId === lt.id);
              const quota = getPolicyQuota(lt.id);
              const availableDays =
                b !== undefined ? b.closingBalance : quota !== null ? quota : null;
              const balText = availableDays !== null ? ` • (${availableDays} days available)` : '';
              return (
                <option key={lt.id} value={lt.id}>
                  {lt.name} ({lt.code}) — {lt.isPaid ? 'Paid' : 'Unpaid'}
                  {balText}
                </option>
              );
            })}
          </select>
        </div>

        {/* Selected Leave Type Information Card */}
        {activeLeaveType && (
          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${
                matchingBalance && matchingBalance.closingBalance < estimatedDays
                  ? 'hsl(var(--color-warning) / 0.4)'
                  : 'hsl(var(--border-subtle))'
              }`,
              backgroundColor:
                matchingBalance && matchingBalance.closingBalance < estimatedDays
                  ? 'hsl(var(--color-warning) / 0.05)'
                  : 'hsl(var(--bg-secondary) / 0.3)',
              fontSize: 'var(--font-size-xs)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 'var(--space-2)',
              }}
            >
              <div>
                <span style={{ fontWeight: 600, color: 'hsl(var(--text-primary))' }}>
                  {activeLeaveType.name}:
                </span>{' '}
                <span style={{ color: 'hsl(var(--text-secondary))' }}>
                  {activeLeaveType.isPaid ? 'Paid leave category' : 'Loss of Pay / Unpaid'}
                  {activeLeaveType.requiresDocument ? ' • Supporting proof required' : ''}
                </span>
              </div>
              <div
                style={{
                  fontWeight: 700,
                  color:
                    matchingBalance && matchingBalance.closingBalance >= estimatedDays
                      ? 'hsl(var(--color-success))'
                      : 'hsl(var(--color-danger))',
                }}
              >
                Available Balance:{' '}
                {matchingBalance !== undefined
                  ? `${matchingBalance.closingBalance} Days`
                  : '0 Days'}
              </div>
            </div>

            {matchingBalance && matchingBalance.closingBalance < estimatedDays && (
              <div
                style={{
                  fontSize: '11px',
                  color: 'hsl(var(--color-warning, 38 92% 50%))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-1)',
                }}
              >
                <AlertCircle size={13} />
                <span>
                  You have {matchingBalance.closingBalance} days available. Requesting{' '}
                  {estimatedDays} days will require an HR balance adjustment (credit).
                </span>
              </div>
            )}
          </div>
        )}

        {/* Date Selection & Half-Day Schedule */}
        <div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)' }}
        >
          {/* From Date */}
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
              From Date <span style={{ color: 'hsl(var(--color-danger))' }}>*</span>
            </label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              required
            />
            <div style={{ marginTop: '6px' }}>
              <select
                value={fromHalf}
                onChange={(e) => setFromHalf(e.target.value as HalfDayType)}
                style={{
                  width: '100%',
                  height: '32px',
                  padding: '0 var(--space-2)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid hsl(var(--border-subtle))',
                  backgroundColor: 'hsl(var(--bg-secondary))',
                  color: 'hsl(var(--text-secondary))',
                  fontSize: '11px',
                }}
              >
                <option value={HalfDayType.FULL}>Full Day</option>
                <option value={HalfDayType.FIRST_HALF}>1st Half Only</option>
                <option value={HalfDayType.SECOND_HALF}>2nd Half Only</option>
              </select>
            </div>
          </div>

          {/* To Date */}
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
              To Date <span style={{ color: 'hsl(var(--color-danger))' }}>*</span>
            </label>
            <Input
              type="date"
              value={toDate}
              min={fromDate}
              onChange={(e) => setToDate(e.target.value)}
              required
            />
            <div style={{ marginTop: '6px' }}>
              <select
                value={toHalf}
                onChange={(e) => setToHalf(e.target.value as HalfDayType)}
                style={{
                  width: '100%',
                  height: '32px',
                  padding: '0 var(--space-2)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid hsl(var(--border-subtle))',
                  backgroundColor: 'hsl(var(--bg-secondary))',
                  color: 'hsl(var(--text-secondary))',
                  fontSize: '11px',
                }}
              >
                <option value={HalfDayType.FULL}>Full Day</option>
                <option value={HalfDayType.FIRST_HALF}>1st Half Only</option>
                <option value={HalfDayType.SECOND_HALF}>2nd Half Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Estimated Duration Banner */}
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'hsl(var(--primary-color) / 0.08)',
            border: '1px solid hsl(var(--primary-color) / 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Clock size={16} style={{ color: 'hsl(var(--primary-color))' }} />
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-primary))' }}>
              Estimated Applied Duration:
            </span>
          </div>
          <span
            style={{
              fontWeight: 800,
              fontSize: 'var(--font-size-base)',
              color: 'hsl(var(--primary-color))',
            }}
          >
            {estimatedDays} {estimatedDays === 1 ? 'Day' : 'Days'}
          </span>
        </div>

        {/* Reason Textarea */}
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
            Reason for Leave <span style={{ color: 'hsl(var(--color-danger))' }}>*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please provide details or reason for taking leave..."
            rows={3}
            required
            style={{
              width: '100%',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid hsl(var(--border-subtle))',
              backgroundColor: 'hsl(var(--bg-secondary))',
              color: 'hsl(var(--text-primary))',
              fontSize: 'var(--font-size-xs)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Supporting Document Upload */}
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
            Supporting Document{' '}
            {activeLeaveType?.requiresDocument && (
              <span style={{ color: 'hsl(var(--color-danger))' }}>*</span>
            )}
          </label>
          <div
            style={{
              border: '1px dashed hsl(var(--border-subtle))',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
              textAlign: 'center',
              backgroundColor: 'hsl(var(--bg-secondary) / 0.2)',
              cursor: 'pointer',
            }}
            onClick={() => document.getElementById('leave-file-input')?.click()}
          >
            <Upload
              size={20}
              style={{ color: 'hsl(var(--text-muted))', margin: '0 auto 6px auto' }}
            />
            <input
              id="leave-file-input"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setSelectedFile(file);
              }}
            />
            {selectedFile ? (
              <div
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'hsl(var(--primary-color))',
                }}
              >
                Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
              </div>
            ) : (
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}>
                Click to upload medical certificate or proof (Max 10 MB, PDF, PNG, JPG)
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
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
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
