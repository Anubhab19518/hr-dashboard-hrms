'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import { Input } from '@/components/atoms/input';
import { Calendar, Plus, Search, Edit2, Trash2, Lock, RefreshCw } from '@/components/atoms/icons';
import { HolidayService } from '../services/holiday.service';
import type { HolidayCalendar } from '../types/holiday.types';
import { CreateEditCalendarModal } from './create-edit-calendar-modal';
import { CalendarDetailsDrawer } from './calendar-details-drawer';

export function HolidayCalendarList() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [calendars, setCalendars] = useState<HolidayCalendar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Drawers state
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [calendarToEdit, setCalendarToEdit] = useState<HolidayCalendar | null>(null);
  const [selectedCalendarIdForDrawer, setSelectedCalendarIdForDrawer] = useState<string | null>(
    null,
  );
  const [deletingCalendarId, setDeletingCalendarId] = useState<string | null>(null);

  const fetchCalendars = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await HolidayService.getCalendars(selectedYear);
      setCalendars(Array.isArray(list) ? list : []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch holiday calendars';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    void fetchCalendars();
  }, [fetchCalendars]);

  const handleCalendarSaved = (saved: HolidayCalendar) => {
    setCalendars((prev) => {
      const exists = prev.some((c) => c.id === saved.id);
      if (exists) {
        return prev.map((c) => (c.id === saved.id ? saved : c));
      }
      return [saved, ...prev];
    });
  };

  const handleDeleteCalendar = async (cal: HolidayCalendar) => {
    if (cal.isBaseline) {
      alert('Baseline holiday calendars are protected and cannot be deleted.');
      return;
    }
    if (!confirm(`Are you sure you want to delete "${cal.name}" (${cal.code})?`)) return;

    setDeletingCalendarId(cal.id);
    try {
      await HolidayService.deleteCalendar(cal.id);
      setCalendars((prev) => prev.filter((c) => c.id !== cal.id));
      if (selectedCalendarIdForDrawer === cal.id) {
        setSelectedCalendarIdForDrawer(null);
      }
    } catch (err: unknown) {
      let msg = err instanceof Error ? err.message : 'Failed to delete calendar';
      if (
        msg.toLowerCase().includes('foreign key') ||
        msg.toLowerCase().includes('violates') ||
        msg.toLowerCase().includes('company_holiday_calendars')
      ) {
        msg =
          'Cannot delete this calendar because it is currently assigned to one or more companies. Please unassign it in Company Holiday Settings first.';
      }
      alert(msg);
    } finally {
      setDeletingCalendarId(null);
    }
  };

  const filteredCalendars = useMemo(() => {
    if (!searchQuery.trim()) return calendars;
    const q = searchQuery.toLowerCase();
    return calendars.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q)),
    );
  }, [calendars, searchQuery]);

  const yearOptions = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* 1. Header & Controls */}
      <div
        style={{
          backgroundColor: 'hsl(var(--bg-surface))',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid hsl(var(--border-subtle))',
          padding: 'var(--space-5)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'hsl(var(--color-brand-accent) / 0.12)',
              color: 'hsl(var(--color-brand-accent))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Calendar size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'hsl(var(--text-muted))',
                }}
              >
                Organization Settings
              </span>
              <Badge variant="primary">{selectedYear} CALENDARS</Badge>
            </div>
            <h1
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 700,
                color: 'hsl(var(--text-primary))',
                margin: '2px 0 0 0',
              }}
            >
              Holiday Calendars & Public Days
            </h1>
          </div>
        </div>

        {/* Right Action Bar */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}
        >
          {/* Year Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <label
              htmlFor="year-selector"
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'hsl(var(--text-secondary))',
              }}
            >
              Year:
            </label>
            <select
              id="year-selector"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={{
                height: '36px',
                padding: '0 var(--space-3)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid hsl(var(--border-subtle))',
                backgroundColor: 'hsl(var(--bg-secondary))',
                color: 'hsl(var(--text-primary))',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 700,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {yearOptions.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchCalendars()}
            style={{ height: '36px' }}
            title="Refresh calendars"
          >
            <RefreshCw size={13} />
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setCalendarToEdit(null);
              setIsCalendarModalOpen(true);
            }}
            style={{ height: '36px' }}
          >
            <Plus size={14} style={{ marginRight: 'var(--space-1)' }} />
            Create Calendar
          </Button>
        </div>
      </div>

      {/* 2. Filter & Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', minWidth: '280px', flex: 1, maxWidth: '420px' }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'hsl(var(--text-muted))',
            }}
          />
          <Input
            placeholder="Search calendars by name, code, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '34px', height: '38px', fontSize: 'var(--font-size-xs)' }}
          />
        </div>

        <div style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}>
          Showing <strong>{filteredCalendars.length}</strong> calendars for {selectedYear}
        </div>
      </div>

      {/* 3. Calendars Table */}
      {error && (
        <div
          style={{
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'hsl(var(--color-danger) / 0.1)',
            color: 'hsl(var(--color-danger))',
            fontSize: 'var(--font-size-xs)',
          }}
        >
          {error}
        </div>
      )}

      {isLoading ? (
        <div
          style={{
            padding: 'var(--space-12)',
            textAlign: 'center',
            color: 'hsl(var(--text-muted))',
            fontSize: 'var(--font-size-sm)',
            backgroundColor: 'hsl(var(--bg-surface))',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid hsl(var(--border-subtle))',
          }}
        >
          Loading holiday calendars for {selectedYear}...
        </div>
      ) : filteredCalendars.length === 0 ? (
        <div
          style={{
            padding: 'var(--space-12) var(--space-6)',
            textAlign: 'center',
            borderRadius: 'var(--radius-xl)',
            border: '1px dashed hsl(var(--border-subtle))',
            backgroundColor: 'hsl(var(--bg-surface))',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'hsl(var(--bg-secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'hsl(var(--text-muted))',
            }}
          >
            <Calendar size={24} />
          </div>
          <h2
            style={{
              fontSize: 'var(--font-size-base)',
              fontWeight: 700,
              color: 'hsl(var(--text-primary))',
              margin: 0,
            }}
          >
            {searchQuery
              ? 'No matching calendars found'
              : `No Holiday Calendars for ${selectedYear}`}
          </h2>
          <p
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'hsl(var(--text-secondary))',
              maxWidth: '420px',
              margin: 0,
            }}
          >
            {searchQuery
              ? 'Try refining your search keyword or check other years.'
              : 'Create a national or regional holiday calendar for this year to configure statutory public holidays.'}
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setCalendarToEdit(null);
              setIsCalendarModalOpen(true);
            }}
          >
            <Plus size={14} style={{ marginRight: 'var(--space-1)' }} />
            Create Calendar for {selectedYear}
          </Button>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: 'hsl(var(--bg-surface))',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid hsl(var(--border-subtle))',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
          }}
        >
          <table
            style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-xs)' }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: 'hsl(var(--bg-secondary))',
                  borderBottom: '1px solid hsl(var(--border-subtle))',
                  textAlign: 'left',
                  color: 'hsl(var(--text-muted))',
                }}
              >
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>
                  Calendar Name & Code
                </th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Year</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Type</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>
                  Status
                </th>
                <th
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    fontWeight: 600,
                    textAlign: 'right',
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCalendars.map((cal) => {
                return (
                  <tr
                    key={cal.id}
                    style={{
                      borderBottom: '1px solid hsl(var(--border-subtle))',
                      transition: 'background-color var(--transition-fast)',
                    }}
                  >
                    {/* Name & Code */}
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
                        >
                          <span style={{ fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
                            {cal.name}
                          </span>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '10px',
                              padding: '1px 5px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: 'hsl(var(--bg-secondary))',
                              color: 'hsl(var(--text-muted))',
                            }}
                          >
                            {cal.code}
                          </span>
                        </div>
                        {cal.description && (
                          <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
                            {cal.description}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Year */}
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>
                      {cal.year}
                    </td>

                    {/* Type */}
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      {cal.isBaseline ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Badge variant="primary">Baseline</Badge>
                          <Lock size={11} style={{ color: 'hsl(var(--color-brand-accent))' }} />
                        </div>
                      ) : (
                        <Badge variant="outline">Custom</Badge>
                      )}
                    </td>

                    {/* Status */}
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <Badge variant={cal.isActive ? 'success' : 'secondary'}>
                        {cal.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 'var(--space-2)',
                        }}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedCalendarIdForDrawer(cal.id)}
                          style={{ height: '30px', fontSize: '11px' }}
                        >
                          <Calendar size={12} style={{ marginRight: '4px' }} />
                          View Days
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCalendarToEdit(cal);
                            setIsCalendarModalOpen(true);
                          }}
                          style={{ height: '30px', padding: '0 8px' }}
                          title="Edit calendar metadata"
                        >
                          <Edit2 size={12} />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void handleDeleteCalendar(cal)}
                          disabled={cal.isBaseline || deletingCalendarId === cal.id}
                          style={{
                            height: '30px',
                            padding: '0 8px',
                            color: cal.isBaseline
                              ? 'hsl(var(--text-muted))'
                              : 'hsl(var(--color-danger))',
                            borderColor: cal.isBaseline ? 'transparent' : undefined,
                            cursor: cal.isBaseline ? 'not-allowed' : 'pointer',
                            opacity: cal.isBaseline ? 0.4 : 1,
                          }}
                          title={
                            cal.isBaseline
                              ? 'Baseline calendars cannot be deleted'
                              : 'Delete calendar'
                          }
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Calendar Modal */}
      <CreateEditCalendarModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        calendarToEdit={calendarToEdit}
        selectedYear={selectedYear}
        onSaved={handleCalendarSaved}
      />

      {/* Calendar Details Days Drawer */}
      <CalendarDetailsDrawer
        calendarId={selectedCalendarIdForDrawer}
        onClose={() => setSelectedCalendarIdForDrawer(null)}
        onCalendarUpdated={fetchCalendars}
      />
    </div>
  );
}
