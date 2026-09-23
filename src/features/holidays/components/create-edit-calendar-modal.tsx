'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Modal } from '@/components/molecules/modal';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { HolidayService } from '../services/holiday.service';
import type { HolidayCalendar } from '../types/holiday.types';
import type { CreateHolidayCalendarInput } from '../schemas/holiday.schema';

interface CreateEditCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  calendarToEdit?: HolidayCalendar | null;
  selectedYear: number;
  onSaved: (calendar: HolidayCalendar) => void;
}

export function CreateEditCalendarModal({
  isOpen,
  onClose,
  calendarToEdit,
  selectedYear,
  onSaved,
}: CreateEditCalendarModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [year, setYear] = useState(selectedYear);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (calendarToEdit) {
      setName(calendarToEdit.name);
      setCode(calendarToEdit.code);
      setYear(calendarToEdit.year);
      setDescription(calendarToEdit.description || '');
      setIsActive(calendarToEdit.isActive);
    } else {
      setName('');
      setCode('');
      setYear(selectedYear);
      setDescription('');
      setIsActive(true);
    }
    setError(null);
  }, [calendarToEdit, selectedYear, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (calendarToEdit) {
        const updated = await HolidayService.updateCalendar(calendarToEdit.id, {
          name: name.trim(),
          description: description.trim() ? description.trim() : undefined,
          isActive,
        });
        onSaved(updated);
      } else {
        const payload: CreateHolidayCalendarInput = {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          year: Number(year),
          description: description.trim() ? description.trim() : undefined,
          isActive,
        };
        const created = await HolidayService.createCalendar(payload);
        onSaved(created);
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save holiday calendar';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={calendarToEdit ? 'Edit Holiday Calendar' : 'Create Holiday Calendar'}
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
              border: '1px solid hsl(var(--color-danger) / 0.2)',
            }}
          >
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="cal-name"
            style={{
              display: 'block',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              color: 'hsl(var(--text-secondary))',
              marginBottom: 'var(--space-1)',
            }}
          >
            Calendar Name *
          </label>
          <Input
            id="cal-name"
            placeholder="e.g. India National Holidays 2026"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <div>
            <label
              htmlFor="cal-code"
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'hsl(var(--text-secondary))',
                marginBottom: 'var(--space-1)',
              }}
            >
              Calendar Code *
            </label>
            <Input
              id="cal-code"
              placeholder="e.g. IND_NAT_2026"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              disabled={Boolean(calendarToEdit)}
              required
            />
          </div>

          <div>
            <label
              htmlFor="cal-year"
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'hsl(var(--text-secondary))',
                marginBottom: 'var(--space-1)',
              }}
            >
              Applicable Year *
            </label>
            <Input
              id="cal-year"
              type="number"
              min={2000}
              max={2100}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              disabled={Boolean(calendarToEdit)}
              required
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="cal-desc"
            style={{
              display: 'block',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              color: 'hsl(var(--text-secondary))',
              marginBottom: 'var(--space-1)',
            }}
          >
            Description (Optional)
          </label>
          <textarea
            id="cal-desc"
            rows={3}
            placeholder="Notes regarding statutory public holidays or scope..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              width: '100%',
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid hsl(var(--border-subtle))',
              backgroundColor: 'hsl(var(--bg-secondary))',
              color: 'hsl(var(--text-primary))',
              fontSize: 'var(--font-size-xs)',
              fontFamily: 'inherit',
              outline: 'none',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {calendarToEdit && (
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              color: 'hsl(var(--text-primary))',
            }}
          >
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              style={{
                width: '16px',
                height: '16px',
                accentColor: 'hsl(var(--primary-color))',
              }}
            />
            <span>Active Calendar</span>
          </label>
        )}

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
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : calendarToEdit ? 'Update Calendar' : 'Create Calendar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
