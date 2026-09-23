'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Modal } from '@/components/molecules/modal';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { HolidayService } from '../services/holiday.service';
import { HolidayType, type HolidayCalendarDay } from '../types/holiday.types';
import type { CreateHolidayCalendarDayInput } from '../schemas/holiday.schema';

interface CreateEditDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  calendarId: string;
  calendarYear: number;
  dayToEdit?: HolidayCalendarDay | null;
  onSaved: (day: HolidayCalendarDay) => void;
}

export function CreateEditDayModal({
  isOpen,
  onClose,
  calendarId,
  calendarYear,
  dayToEdit,
  onSaved,
}: CreateEditDayModalProps) {
  const [holidayDate, setHolidayDate] = useState(`${calendarYear}-01-01`);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [holidayType, setHolidayType] = useState<HolidayType>(HolidayType.NATIONAL);
  const [isPaid, setIsPaid] = useState(true);
  const [isOptional, setIsOptional] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (dayToEdit) {
      setHolidayDate(dayToEdit.holidayDate);
      setName(dayToEdit.name);
      setDescription(dayToEdit.description || '');
      setHolidayType(dayToEdit.holidayType);
      setIsPaid(dayToEdit.isPaid);
      setIsOptional(dayToEdit.isOptional);
    } else {
      setHolidayDate(`${calendarYear}-01-01`);
      setName('');
      setDescription('');
      setHolidayType(HolidayType.NATIONAL);
      setIsPaid(true);
      setIsOptional(false);
    }
    setError(null);
  }, [dayToEdit, calendarYear, isOpen]);

  // When type changes to OPTIONAL, auto-suggest isOptional = true
  const handleTypeChange = (type: HolidayType) => {
    setHolidayType(type);
    if (type === HolidayType.OPTIONAL) {
      setIsOptional(true);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (dayToEdit) {
        const updated = await HolidayService.updateCalendarDay(calendarId, dayToEdit.id, {
          name: name.trim(),
          description: description.trim() ? description.trim() : undefined,
          holidayType,
          isPaid,
          isOptional,
        });
        onSaved(updated);
      } else {
        const payload: CreateHolidayCalendarDayInput = {
          holidayDate,
          name: name.trim(),
          description: description.trim() ? description.trim() : undefined,
          holidayType,
          isPaid,
          isOptional,
        };
        const created = await HolidayService.addCalendarDay(calendarId, payload);
        onSaved(created);
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save holiday day';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={dayToEdit ? 'Edit Holiday Day' : 'Add Holiday Day'}
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
            htmlFor="day-date"
            style={{
              display: 'block',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              color: 'hsl(var(--text-secondary))',
              marginBottom: 'var(--space-1)',
            }}
          >
            Holiday Date *
          </label>
          <Input
            id="day-date"
            type="date"
            value={holidayDate}
            onChange={(e) => setHolidayDate(e.target.value)}
            disabled={Boolean(dayToEdit)}
            required
          />
        </div>

        <div>
          <label
            htmlFor="day-name"
            style={{
              display: 'block',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              color: 'hsl(var(--text-secondary))',
              marginBottom: 'var(--space-1)',
            }}
          >
            Holiday Title *
          </label>
          <Input
            id="day-name"
            placeholder="e.g. Republic Day / Diwali / Good Friday"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label
            htmlFor="day-type"
            style={{
              display: 'block',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              color: 'hsl(var(--text-secondary))',
              marginBottom: 'var(--space-1)',
            }}
          >
            Holiday Classification *
          </label>
          <select
            id="day-type"
            value={holidayType}
            onChange={(e) => handleTypeChange(e.target.value as HolidayType)}
            style={{
              width: '100%',
              height: '38px',
              padding: '0 var(--space-3)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid hsl(var(--border-subtle))',
              backgroundColor: 'hsl(var(--bg-secondary))',
              color: 'hsl(var(--text-primary))',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value={HolidayType.NATIONAL}>NATIONAL — Mandatory Public Holiday</option>
            <option value={HolidayType.REGIONAL}>REGIONAL — State/Regional Holiday</option>
            <option value={HolidayType.OPTIONAL}>OPTIONAL — Restricted/Floating Holiday</option>
            <option value={HolidayType.CUSTOM}>CUSTOM — Organization Custom Day Off</option>
          </select>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--space-3)',
            backgroundColor: 'hsl(var(--bg-secondary) / 0.5)',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid hsl(var(--border-subtle))',
          }}
        >
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
              checked={isPaid}
              onChange={(e) => setIsPaid(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'hsl(var(--primary-color))' }}
            />
            <span>Paid Holiday</span>
          </label>

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
              checked={isOptional}
              onChange={(e) => setIsOptional(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'hsl(var(--primary-color))' }}
            />
            <span>Optional / Floating</span>
          </label>
        </div>

        <div>
          <label
            htmlFor="day-desc"
            style={{
              display: 'block',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              color: 'hsl(var(--text-secondary))',
              marginBottom: 'var(--space-1)',
            }}
          >
            Notes (Optional)
          </label>
          <textarea
            id="day-desc"
            rows={2}
            placeholder="Additional context or gazetted notification reference..."
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
            {isSubmitting ? 'Saving...' : dayToEdit ? 'Update Day' : 'Add Day'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
