'use client';

import { useState } from 'react';
import { Modal } from '@/components/molecules/modal';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import { AlertCircle } from '@/components/atoms/icons';
import type { LeaveApplication } from '../types/leave.types';
import { LeaveService } from '../services/leave.service';

interface RejectLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: LeaveApplication | null;
  onRejected: () => void;
}

export function RejectLeaveModal({
  isOpen,
  onClose,
  application,
  onRejected,
}: RejectLeaveModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!application) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await LeaveService.rejectApplication(application.id, reason.trim() || undefined);
      onRejected();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reject leave application';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reject Leave Application" size="md">
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

        {/* Application Summary Box */}
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'hsl(var(--bg-secondary) / 0.4)',
            border: '1px solid hsl(var(--border-subtle))',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--space-2)',
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: 'var(--font-size-sm)',
                color: 'hsl(var(--text-primary))',
              }}
            >
              {application.employeeName || 'Employee'}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <Badge variant="outline">
                {application.leaveTypeName || application.leaveTypeCode || 'Leave'}
              </Badge>
              <Badge variant="warning">
                {application.appliedDays} {application.appliedDays === 1 ? 'Day' : 'Days'}
              </Badge>
            </div>
          </div>

          <div
            style={{
              fontSize: '11px',
              color: 'hsl(var(--text-secondary))',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            {application.employeeCode && (
              <span>
                Code: <strong>{application.employeeCode}</strong>
              </span>
            )}
            {application.companyName && <span>• 🏢 {application.companyName}</span>}
            {application.departmentName && <span>• Dept: {application.departmentName}</span>}
            {application.jobRoleName && <span>• Role: {application.jobRoleName}</span>}
          </div>

          <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
            Schedule: {application.fromDate} &rarr; {application.toDate}{' '}
            {application.reason ? `• "${application.reason}"` : ''}
          </div>
        </div>

        {/* Rejection Reason Textarea */}
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
            Rejection Reason / Remarks{' '}
            <span style={{ color: 'hsl(var(--text-muted))', fontWeight: 400 }}>(Optional)</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Critical project milestone scheduled on these dates, please reschedule."
            rows={4}
            autoFocus
            style={{
              width: '100%',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid hsl(var(--border-subtle))',
              backgroundColor: 'hsl(var(--bg-surface))',
              color: 'hsl(var(--text-primary))',
              fontSize: 'var(--font-size-xs)',
              outline: 'none',
              boxSizing: 'border-box',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Action Buttons */}
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
          <Button type="submit" variant="danger" disabled={isSubmitting}>
            {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
