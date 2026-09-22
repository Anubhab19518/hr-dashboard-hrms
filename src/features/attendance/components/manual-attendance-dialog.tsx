'use client';

import { useState, type FormEvent } from 'react';
import { Modal } from '@/components/molecules/modal';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { AttendanceService } from '../services/attendance.service';
import type { LogAttendanceInput } from '../schemas/attendance.schema';
import type { AttendanceLog } from '../types/attendance.types';

interface ManualAttendanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newLog: AttendanceLog) => void;
}

export function ManualAttendanceDialog({
  isOpen,
  onClose,
  onSuccess,
}: ManualAttendanceDialogProps) {
  const [formData, setFormData] = useState<LogAttendanceInput>({
    employeeId: '',
    siteId: '',
    logType: 'CHECK_IN',
    timestamp: new Date().toISOString().slice(0, 16),
    verificationMethod: 'MANUAL',
    notes: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const created = await AttendanceService.recordAttendance(formData);
      onSuccess(created);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to record attendance';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manual Attendance Override"
      description="Record an official check-in or check-out punch on behalf of an employee."
    >
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
      >
        {error && (
          <div
            style={{
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'hsl(var(--color-danger) / 0.1)',
              color: 'hsl(var(--color-danger))',
              fontSize: 'var(--font-size-xs)',
            }}
          >
            {error}
          </div>
        )}

        <div>
          <label
            style={{
              display: 'block',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              marginBottom: 'var(--space-1)',
            }}
          >
            Employee ID / Code *
          </label>
          <Input
            placeholder="e.g. EMP-1001 or UUID"
            value={formData.employeeId}
            onChange={(e) => setFormData((p) => ({ ...p, employeeId: e.target.value }))}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                marginBottom: 'var(--space-1)',
              }}
            >
              Punch Event *
            </label>
            <select
              value={formData.logType}
              onChange={(e) =>
                setFormData((p) => ({ ...p, logType: e.target.value as 'CHECK_IN' | 'CHECK_OUT' }))
              }
              style={{
                width: '100%',
                height: '40px',
                padding: '0 var(--space-3)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid hsl(var(--border-base))',
                backgroundColor: 'hsl(var(--bg-secondary))',
                color: 'hsl(var(--text-primary))',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              <option value="CHECK_IN">Check In</option>
              <option value="CHECK_OUT">Check Out</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                marginBottom: 'var(--space-1)',
              }}
            >
              Date & Time *
            </label>
            <Input
              type="datetime-local"
              value={formData.timestamp}
              onChange={(e) => setFormData((p) => ({ ...p, timestamp: e.target.value }))}
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
              marginBottom: 'var(--space-1)',
            }}
          >
            Site / Facility ID
          </label>
          <Input
            placeholder="e.g. Main Plant"
            value={formData.siteId ?? ''}
            onChange={(e) => setFormData((p) => ({ ...p, siteId: e.target.value }))}
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              marginBottom: 'var(--space-1)',
            }}
          >
            Reason / HR Notes
          </label>
          <Input
            placeholder="e.g. Biometric kiosk offline, validated by supervisor"
            value={formData.notes ?? ''}
            onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
          />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 'var(--space-2)',
            marginTop: 'var(--space-3)',
          }}
        >
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Record Punch'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
