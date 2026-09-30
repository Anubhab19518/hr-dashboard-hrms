'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/molecules/modal';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { AlertCircle } from '@/components/atoms/icons';
import { LeaveGender, type LeaveType } from '../types/leave.types';
import { LeaveService } from '../services/leave.service';

interface CreateEditLeaveTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaveTypeToEdit: LeaveType | null;
  onSaved: (savedType: LeaveType) => void;
}

export function CreateEditLeaveTypeModal({
  isOpen,
  onClose,
  leaveTypeToEdit,
  onSaved,
}: CreateEditLeaveTypeModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [isPaid, setIsPaid] = useState(true);
  const [isCarryForward, setIsCarryForward] = useState(false);
  const [maxCarryForwardDays, setMaxCarryForwardDays] = useState<number | ''>('');
  const [isEncashable, setIsEncashable] = useState(false);
  const [requiresDocument, setRequiresDocument] = useState(false);
  const [minDaysNotice, setMinDaysNotice] = useState<number>(0);
  const [maxConsecutiveDays, setMaxConsecutiveDays] = useState<number | ''>('');
  const [applicableGender, setApplicableGender] = useState<LeaveGender>(LeaveGender.ALL);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (leaveTypeToEdit) {
      setName(leaveTypeToEdit.name);
      setCode(leaveTypeToEdit.code);
      setDescription(leaveTypeToEdit.description || '');
      setIsPaid(leaveTypeToEdit.isPaid);
      setIsCarryForward(leaveTypeToEdit.isCarryForward);
      setMaxCarryForwardDays(leaveTypeToEdit.maxCarryForwardDays ?? '');
      setIsEncashable(leaveTypeToEdit.isEncashable);
      setRequiresDocument(leaveTypeToEdit.requiresDocument);
      setMinDaysNotice(leaveTypeToEdit.minDaysNotice ?? 0);
      setMaxConsecutiveDays(leaveTypeToEdit.maxConsecutiveDays ?? '');
      setApplicableGender(leaveTypeToEdit.applicableGender || LeaveGender.ALL);
      setIsActive(leaveTypeToEdit.isActive !== false);
    } else {
      setName('');
      setCode('');
      setDescription('');
      setIsPaid(true);
      setIsCarryForward(false);
      setMaxCarryForwardDays('');
      setIsEncashable(false);
      setRequiresDocument(false);
      setMinDaysNotice(0);
      setMaxConsecutiveDays('');
      setApplicableGender(LeaveGender.ALL);
      setIsActive(true);
    }
    setError(null);
  }, [leaveTypeToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a name');
      return;
    }
    if (!code.trim()) {
      setError('Please provide a code');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description.trim() || undefined,
      isPaid,
      isCarryForward,
      maxCarryForwardDays:
        isCarryForward && maxCarryForwardDays !== '' ? Number(maxCarryForwardDays) : null,
      isEncashable,
      requiresDocument,
      minDaysNotice: Number(minDaysNotice) || 0,
      maxConsecutiveDays: maxConsecutiveDays !== '' ? Number(maxConsecutiveDays) : null,
      applicableGender,
      isActive,
    };

    try {
      let saved: LeaveType;
      if (leaveTypeToEdit) {
        saved = await LeaveService.updateLeaveType(leaveTypeToEdit.id, payload);
      } else {
        saved = await LeaveService.createLeaveType(payload);
      }
      onSaved(saved);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save leave category';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={leaveTypeToEdit ? 'Edit Leave Category' : 'Create Leave Category'}
      size="lg"
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

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-4)' }}>
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
              Category Name <span style={{ color: 'hsl(var(--color-danger))' }}>*</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. Casual Leave"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!leaveTypeToEdit && !code) {
                  setCode(
                    e.target.value
                      .replace(/[^a-zA-Z0-9]/g, '_')
                      .toUpperCase()
                      .slice(0, 10),
                  );
                }
              }}
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
              Code <span style={{ color: 'hsl(var(--color-danger))' }}>*</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. CL"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
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
              color: 'hsl(var(--text-primary))',
              marginBottom: '6px',
            }}
          >
            Description
          </label>
          <Input
            type="text"
            placeholder="Brief explanation of policy rules..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Configurations Grid */}
        <div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)' }}
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
              Applicable Gender
            </label>
            <select
              value={applicableGender}
              onChange={(e) => setApplicableGender(e.target.value as LeaveGender)}
              style={{
                width: '100%',
                height: '38px',
                padding: '0 var(--space-2)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid hsl(var(--border-subtle))',
                backgroundColor: 'hsl(var(--bg-secondary))',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              <option value={LeaveGender.ALL}>All Employees</option>
              <option value={LeaveGender.FEMALE}>Female Only (Maternity etc.)</option>
              <option value={LeaveGender.MALE}>Male Only (Paternity etc.)</option>
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
              Min Notice (Days)
            </label>
            <Input
              type="number"
              min={0}
              max={90}
              value={minDaysNotice}
              onChange={(e) => setMinDaysNotice(Number(e.target.value))}
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
              Max Consecutive Days
            </label>
            <Input
              type="number"
              min={1}
              placeholder="Unlimited"
              value={maxConsecutiveDays}
              onChange={(e) =>
                setMaxConsecutiveDays(e.target.value === '' ? '' : Number(e.target.value))
              }
            />
          </div>
        </div>

        {/* Boolean Flags Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 'var(--space-3)',
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'hsl(var(--bg-secondary) / 0.4)',
            border: '1px solid hsl(var(--border-subtle))',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontSize: 'var(--font-size-xs)',
              cursor: 'pointer',
            }}
          >
            <input type="checkbox" checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)} />
            <span style={{ fontWeight: 600 }}>Paid Leave</span>
          </label>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontSize: 'var(--font-size-xs)',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={requiresDocument}
              onChange={(e) => setRequiresDocument(e.target.checked)}
            />
            <span style={{ fontWeight: 600 }}>Requires Supporting Document</span>
          </label>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontSize: 'var(--font-size-xs)',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={isEncashable}
              onChange={(e) => setIsEncashable(e.target.checked)}
            />
            <span style={{ fontWeight: 600 }}>Encashable on Separation</span>
          </label>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontSize: 'var(--font-size-xs)',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={isCarryForward}
              onChange={(e) => setIsCarryForward(e.target.checked)}
            />
            <span style={{ fontWeight: 600 }}>Carry Forward to Next Year</span>
          </label>
        </div>

        {isCarryForward && (
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
              Max Carry-Forward Days Limit
            </label>
            <Input
              type="number"
              min={0}
              placeholder="e.g. 15 (leave blank for unlimited)"
              value={maxCarryForwardDays}
              onChange={(e) =>
                setMaxCarryForwardDays(e.target.value === '' ? '' : Number(e.target.value))
              }
            />
          </div>
        )}

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
            {isSubmitting ? 'Saving...' : leaveTypeToEdit ? 'Update Category' : 'Create Category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
