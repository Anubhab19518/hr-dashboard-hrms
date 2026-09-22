'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Card, CardContent } from '@/components/atoms/card';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import { Input } from '@/components/atoms/input';
import { Modal } from '@/components/molecules/modal';
import { EmptyState } from '@/components/molecules/empty-state';
import { Edit2, Trash2, Clock, AlertTriangle } from '@/components/atoms/icons';
import { OrganizationService } from '../services/organization.service';
import type { Shift } from '../types/organization.types';
import type { CreateShiftInput } from '../schemas/organization.schema';

export function ShiftList() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit State
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [editFormData, setEditFormData] = useState<CreateShiftInput>({
    name: '',
    code: '',
    startTime: '09:00',
    endTime: '18:00',
    gracePeriodMinutes: 15,
    isOvernight: false,
  });

  // Delete State
  const [deletingShift, setDeletingShift] = useState<Shift | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState<CreateShiftInput>({
    name: '',
    code: '',
    startTime: '09:00',
    endTime: '18:00',
    gracePeriodMinutes: 15,
    isOvernight: false,
  });

  const fetchShifts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await OrganizationService.getShifts();
      setShifts(Array.isArray(data) ? data : []);
    } catch {
      setShifts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchShifts();
  }, [fetchShifts]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const created = await OrganizationService.createShift(formData);
      setShifts((prev) => [...prev, created]);
      setIsModalOpen(false);
      setFormData({
        name: '',
        code: '',
        startTime: '09:00',
        endTime: '18:00',
        gracePeriodMinutes: 15,
        isOvernight: false,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create shift';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (shift: Shift) => {
    setEditingShift(shift);
    setError(null);
    setEditFormData({
      name: shift.name,
      code: shift.code,
      startTime: shift.startTime || '09:00',
      endTime: shift.endTime || '18:00',
      gracePeriodMinutes: shift.graceMinutes ?? shift.gracePeriodMinutes ?? 15,
      isOvernight: shift.isOvernight ?? false,
    });
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingShift) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const updated = await OrganizationService.updateShift(editingShift.id, editFormData);
      setShifts((prev) => prev.map((s) => (s.id === editingShift.id ? { ...s, ...updated } : s)));
      setEditingShift(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update shift';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingShift) return;
    setIsDeleting(true);
    setError(null);
    try {
      await OrganizationService.deleteShift(deletingShift.id);
      setShifts((prev) => prev.filter((s) => s.id !== deletingShift.id));
      setDeletingShift(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete shift';
      setError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-4)',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 700,
              color: 'hsl(var(--text-primary))',
            }}
          >
            Work Shifts & Rosters
          </h2>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}>
            Scheduled operating hours, overtime thresholds, and attendance grace periods
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          + Add Shift
        </Button>
      </div>

      {isLoading ? (
        <div
          style={{
            padding: 'var(--space-8)',
            textAlign: 'center',
            color: 'hsl(var(--text-muted))',
          }}
        >
          Loading shifts...
        </div>
      ) : shifts.length === 0 ? (
        <Card variant="subtle">
          <CardContent style={{ padding: 'var(--space-8)' }}>
            <EmptyState
              title="No work shifts defined"
              description="Define regular shifts, night shifts, and grace periods for automated attendance logging."
              actionLabel="Add Shift"
              onAction={() => setIsModalOpen(true)}
            />
          </CardContent>
        </Card>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {shifts.map((shift) => (
            <Card key={shift.id} variant="subtle">
              <CardContent style={{ padding: 'var(--space-5)' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 'var(--space-3)',
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontSize: 'var(--font-size-base)',
                        fontWeight: 700,
                        color: 'hsl(var(--text-primary))',
                      }}
                    >
                      {shift.name}
                    </h3>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: 'var(--font-size-xs)',
                        color: 'hsl(var(--text-muted))',
                      }}
                    >
                      CODE: {shift.code}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    {shift.isOvernight && <Badge variant="warning">Overnight</Badge>}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(shift)}
                      title="Edit Shift"
                      style={{
                        padding: '6px',
                        background: 'hsl(var(--bg-secondary))',
                        border: '1px solid hsl(var(--border-primary))',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'hsl(var(--text-secondary))',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Edit2 style={{ width: 14, height: 14 }} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setDeletingShift(shift);
                      }}
                      title="Delete Shift"
                      style={{
                        padding: '6px',
                        background: 'hsl(var(--color-danger) / 0.08)',
                        border: '1px solid hsl(var(--color-danger) / 0.2)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'hsl(var(--color-danger))',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Trash2 style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'hsl(var(--bg-secondary))',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'hsl(var(--text-muted))',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Clock style={{ width: 12, height: 12 }} />
                      Shift Hours
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--font-size-base)',
                        fontWeight: 700,
                        color: 'hsl(var(--primary-color))',
                        marginTop: '2px',
                      }}
                    >
                      {shift.startTime} – {shift.endTime}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}
                    >
                      Grace Period
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 600,
                        color: 'hsl(var(--text-primary))',
                        marginTop: '2px',
                      }}
                    >
                      {shift.graceMinutes ?? shift.gracePeriodMinutes ?? 15} mins
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Shift Schedule"
        description="Define working hours, overnight logic, and late grace period minutes"
      >
        <form
          onSubmit={handleCreate}
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
        >
          {error && (
            <div
              style={{
                padding: 'var(--space-2)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'hsl(var(--color-danger) / 0.1)',
                color: 'hsl(var(--color-danger))',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              {error}
            </div>
          )}
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
                Shift Name *
              </label>
              <Input
                placeholder="General Day Shift"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                required
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
                Shift Code *
              </label>
              <Input
                placeholder="SFT-DAY"
                value={formData.code}
                onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value }))}
                required
              />
            </div>
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
                Start Time (HH:MM) *
              </label>
              <Input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData((p) => ({ ...p, startTime: e.target.value }))}
                required
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
                End Time (HH:MM) *
              </label>
              <Input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData((p) => ({ ...p, endTime: e.target.value }))}
                required
              />
            </div>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--space-3)',
              alignItems: 'center',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  marginBottom: 'var(--space-1)',
                }}
              >
                Grace Period (Mins)
              </label>
              <Input
                type="number"
                placeholder="15"
                value={formData.gracePeriodMinutes}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    gracePeriodMinutes: parseInt(e.target.value, 10) || 0,
                  }))
                }
              />
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                marginTop: 'var(--space-3)',
              }}
            >
              <input
                type="checkbox"
                id="isOvernight"
                checked={formData.isOvernight}
                onChange={(e) => setFormData((p) => ({ ...p, isOvernight: e.target.checked }))}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label
                htmlFor="isOvernight"
                style={{
                  fontSize: 'var(--font-size-sm)',
                  cursor: 'pointer',
                  color: 'hsl(var(--text-primary))',
                }}
              >
                Overnight Shift
              </label>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 'var(--space-2)',
              marginTop: 'var(--space-3)',
            }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Create Shift'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={Boolean(editingShift)}
        onClose={() => setEditingShift(null)}
        title="Edit Shift Schedule"
        description="Update operational hours, overnight flag, and attendance grace period"
      >
        <form
          onSubmit={handleUpdate}
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
        >
          {error && (
            <div
              style={{
                padding: 'var(--space-2)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'hsl(var(--color-danger) / 0.1)',
                color: 'hsl(var(--color-danger))',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              {error}
            </div>
          )}
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
                Shift Name *
              </label>
              <Input
                placeholder="General Day Shift"
                value={editFormData.name}
                onChange={(e) => setEditFormData((p) => ({ ...p, name: e.target.value }))}
                required
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
                Shift Code *
              </label>
              <Input
                placeholder="SFT-DAY"
                value={editFormData.code}
                onChange={(e) => setEditFormData((p) => ({ ...p, code: e.target.value }))}
                required
              />
            </div>
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
                Start Time (HH:MM) *
              </label>
              <Input
                type="time"
                value={editFormData.startTime}
                onChange={(e) => setEditFormData((p) => ({ ...p, startTime: e.target.value }))}
                required
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
                End Time (HH:MM) *
              </label>
              <Input
                type="time"
                value={editFormData.endTime}
                onChange={(e) => setEditFormData((p) => ({ ...p, endTime: e.target.value }))}
                required
              />
            </div>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--space-3)',
              alignItems: 'center',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  marginBottom: 'var(--space-1)',
                }}
              >
                Grace Period (Mins)
              </label>
              <Input
                type="number"
                placeholder="15"
                value={editFormData.gracePeriodMinutes}
                onChange={(e) =>
                  setEditFormData((p) => ({
                    ...p,
                    gracePeriodMinutes: parseInt(e.target.value, 10) || 0,
                  }))
                }
              />
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                marginTop: 'var(--space-3)',
              }}
            >
              <input
                type="checkbox"
                id="editIsOvernight"
                checked={editFormData.isOvernight}
                onChange={(e) => setEditFormData((p) => ({ ...p, isOvernight: e.target.checked }))}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label
                htmlFor="editIsOvernight"
                style={{
                  fontSize: 'var(--font-size-sm)',
                  cursor: 'pointer',
                  color: 'hsl(var(--text-primary))',
                }}
              >
                Overnight Shift
              </label>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 'var(--space-2)',
              marginTop: 'var(--space-3)',
            }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingShift(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingShift)}
        onClose={() => setDeletingShift(null)}
        title="Delete Shift Schedule"
        description="Are you sure you want to delete this shift schedule?"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {error && (
            <div
              style={{
                padding: 'var(--space-2)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'hsl(var(--color-danger) / 0.1)',
                color: 'hsl(var(--color-danger))',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-3)',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'hsl(var(--color-warning) / 0.1)',
              border: '1px solid hsl(var(--color-warning) / 0.2)',
            }}
          >
            <AlertTriangle
              style={{ width: 20, height: 20, color: 'hsl(var(--color-warning))', flexShrink: 0 }}
            />
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-primary))' }}>
              Deleting shift <strong>{deletingShift?.name}</strong> ({deletingShift?.code}) will
              remove it from active roster scheduling. Existing attendance history will not be lost.
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 'var(--space-2)',
              marginTop: 'var(--space-2)',
            }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingShift(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              style={{
                backgroundColor: 'hsl(var(--color-danger))',
                borderColor: 'hsl(var(--color-danger))',
              }}
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
