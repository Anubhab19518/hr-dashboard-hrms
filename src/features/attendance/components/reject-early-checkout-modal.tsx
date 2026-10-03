'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/molecules/modal';
import { Button } from '@/components/atoms/button';
import { AlertCircle, Clock, XCircle } from '@/components/atoms/icons';
import type { EarlyCheckoutRequest } from '../types/attendance.types';

interface RejectEarlyCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: EarlyCheckoutRequest | null;
  onConfirmReject: (reason: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function RejectEarlyCheckoutModal({
  isOpen,
  onClose,
  request,
  onConfirmReject,
  isSubmitting = false,
}: RejectEarlyCheckoutModalProps) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setRejectionReason('');
      setError(null);
    }
  }, [isOpen, request]);

  if (!request) return null;

  const employeeName =
    request.employee?.name ||
    [request.employee?.firstName, request.employee?.lastName].filter(Boolean).join(' ') ||
    `Employee #${request.employeeId.slice(0, 8)}`;

  const employeeCode = request.employee?.code || request.employee?.employeeCode;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setError('Please provide a brief reason for rejecting this early check-out request.');
      return;
    }
    setError(null);
    await onConfirmReject(rejectionReason.trim());
  };

  const formatTimeDisplay = (timeVal?: string, fallbackTimestamp?: string) => {
    const val = (timeVal || '').trim();
    if (val && val !== '—') {
      if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(val)) {
        const parts = val.split(':');
        const hours = parseInt(parts[0] ?? '0', 10);
        const mins = parts[1] ?? '00';
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
        return `${String(formattedHours).padStart(2, '0')}:${mins} ${ampm}`;
      }
      try {
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
          return d.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });
        }
      } catch {
        // fallback
      }
      return val;
    }

    if (fallbackTimestamp) {
      try {
        const d = new Date(fallbackTimestamp);
        if (!isNaN(d.getTime())) {
          return d.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });
        }
      } catch {
        // fallback
      }
    }

    return '—';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reject Early Check-Out Request"
      description={`Decline early punch-out approval for ${employeeName}`}
      size="md"
    >
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
      >
        {/* Request Summary Card */}
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'hsl(var(--bg-secondary) / 0.6)',
            border: '1px solid hsl(var(--border-subtle))',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
            fontSize: 'var(--font-size-xs)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
              {employeeName}
            </span>
            {employeeCode && (
              <span
                style={{ color: 'hsl(var(--text-muted))', fontFamily: 'var(--font-family-mono)' }}
              >
                {employeeCode}
              </span>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--space-2)',
              color: 'hsl(var(--text-secondary))',
            }}
          >
            <div>
              <span style={{ color: 'hsl(var(--text-muted))' }}>Scheduled End: </span>
              <span style={{ fontWeight: 600 }}>
                {formatTimeDisplay(request.scheduledShiftEndTime)}
              </span>
            </div>
            <div>
              <span style={{ color: 'hsl(var(--text-muted))' }}>Requested Out: </span>
              <span style={{ fontWeight: 600, color: 'hsl(var(--color-warning))' }}>
                {formatTimeDisplay(
                  request.requestedCheckoutTime,
                  request.requestedAt || request.createdAt,
                )}
              </span>
            </div>
          </div>

          {request.reason && (
            <div
              style={{
                marginTop: 'var(--space-1)',
                paddingTop: 'var(--space-2)',
                borderTop: '1px dashed hsl(var(--border-subtle))',
                color: 'hsl(var(--text-secondary))',
              }}
            >
              <span style={{ color: 'hsl(var(--text-muted))', fontWeight: 600 }}>
                Employee&apos;s Reason:{' '}
              </span>
              <span style={{ fontStyle: 'italic' }}>&ldquo;{request.reason}&rdquo;</span>
            </div>
          )}
        </div>

        {/* Rejection Reason Input */}
        <div>
          <label
            htmlFor="rejection-reason"
            style={{
              display: 'block',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              color: 'hsl(var(--text-primary))',
              marginBottom: 'var(--space-1)',
            }}
          >
            Reason for Rejection <span style={{ color: 'hsl(var(--color-danger))' }}>*</span>
          </label>
          <textarea
            id="rejection-reason"
            rows={3}
            placeholder="Explain why this request is being rejected (e.g., Critical shift handover pending, minimum required hours not reached)..."
            value={rejectionReason}
            onChange={(e) => {
              setRejectionReason(e.target.value);
              if (error) setError(null);
            }}
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-md)',
              border: error
                ? '1px solid hsl(var(--color-danger))'
                : '1px solid hsl(var(--border-base))',
              backgroundColor: 'hsl(var(--bg-surface))',
              color: 'hsl(var(--text-primary))',
              fontSize: 'var(--font-size-sm)',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
          {error && (
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'hsl(var(--color-danger))',
                margin: 'var(--space-1) 0 0 0',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-1)',
              }}
            >
              <AlertCircle size={13} />
              {error}
            </p>
          )}
        </div>

        {/* Modal Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 'var(--space-3)',
            marginTop: 'var(--space-2)',
          }}
        >
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            disabled={isSubmitting}
            leftIcon={
              isSubmitting ? <Clock size={16} className="animate-spin" /> : <XCircle size={16} />
            }
          >
            {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
