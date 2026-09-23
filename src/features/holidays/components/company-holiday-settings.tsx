'use client';

import { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/atoms/card';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import { Input } from '@/components/atoms/input';
import {
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  Building2,
  Layers,
  RefreshCw,
} from '@/components/atoms/icons';
import { HolidayService } from '../services/holiday.service';
import type { HolidayCalendar, CompanyHolidayCalendarAssignment } from '../types/holiday.types';
import type { AssignCompanyHolidayCalendarInput } from '../schemas/holiday.schema';

interface CompanyHolidaySettingsProps {
  companyId: string;
  companyName?: string;
}

const WEEKDAY_NAMES = [
  { index: 0, label: 'Sun', full: 'Sunday' },
  { index: 1, label: 'Mon', full: 'Monday' },
  { index: 2, label: 'Tue', full: 'Tuesday' },
  { index: 3, label: 'Wed', full: 'Wednesday' },
  { index: 4, label: 'Thu', full: 'Thursday' },
  { index: 5, label: 'Fri', full: 'Friday' },
  { index: 6, label: 'Sat', full: 'Saturday' },
];

export function CompanyHolidaySettings({ companyId, companyName }: CompanyHolidaySettingsProps) {
  const currentYear = new Date().getFullYear();
  const [assignments, setAssignments] = useState<CompanyHolidayCalendarAssignment[]>([]);
  const [availableCalendars, setAvailableCalendars] = useState<HolidayCalendar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Assignment Form State
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('');
  const [effectiveFrom, setEffectiveFrom] = useState<string>(`${currentYear}-01-01`);
  const [effectiveTo, setEffectiveTo] = useState<string>('');
  const [weeklyOffDays, setWeeklyOffDays] = useState<number[]>([0]); // Default Sunday
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [assignList, cals] = await Promise.all([
        HolidayService.getCompanyAssignments(companyId),
        HolidayService.getCalendars(),
      ]);
      setAssignments(Array.isArray(assignList) ? assignList : []);
      setAvailableCalendars(Array.isArray(cals) ? cals : []);

      if (Array.isArray(cals) && cals.length > 0 && !selectedCalendarId) {
        const firstCal = cals[0];
        if (firstCal) {
          setSelectedCalendarId(firstCal.id);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load company holiday settings';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [companyId, selectedCalendarId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Current active assignment
  const activeAssignment = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return (
      assignments.find(
        (a) => a.isActive && a.effectiveFrom <= today && (!a.effectiveTo || a.effectiveTo >= today),
      ) ||
      assignments.find((a) => a.isActive) ||
      assignments[0]
    );
  }, [assignments]);

  const activeCalendar = useMemo(() => {
    if (!activeAssignment) return null;
    return availableCalendars.find((c) => c.id === activeAssignment.calendarId) || null;
  }, [activeAssignment, availableCalendars]);

  // Toggle weekly-off day
  const toggleWeeklyOff = (dayIndex: number) => {
    setWeeklyOffDays((prev) => {
      if (prev.includes(dayIndex)) {
        if (prev.length === 1) {
          alert('At least one weekly-off day is required.');
          return prev;
        }
        return prev.filter((d) => d !== dayIndex);
      }
      return [...prev, dayIndex].sort();
    });
  };

  const handleAssignCalendar = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!selectedCalendarId) {
      setFormError('Please select a holiday calendar.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: AssignCompanyHolidayCalendarInput = {
        calendarId: selectedCalendarId,
        effectiveFrom,
        effectiveTo: effectiveTo ? effectiveTo : undefined,
        weeklyOffDays,
      };

      const created = await HolidayService.assignCompanyCalendar(companyId, payload);
      setAssignments((prev) => [created, ...prev]);
      setSuccessMessage('Holiday calendar successfully assigned to company.');
      await fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to assign holiday calendar';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivateAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to deactivate/unassign this calendar assignment?')) return;
    try {
      await HolidayService.unassignCompanyCalendar(assignmentId);
      setAssignments((prev) =>
        prev.map((a) => (a.id === assignmentId ? { ...a, isActive: false } : a)),
      );
      setSuccessMessage('Calendar assignment deactivated.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to unassign calendar';
      alert(msg);
    }
  };

  if (isLoading) {
    return (
      <div
        style={{
          padding: 'var(--space-12)',
          textAlign: 'center',
          color: 'hsl(var(--text-muted))',
          backgroundColor: 'hsl(var(--bg-surface))',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid hsl(var(--border-subtle))',
          fontSize: 'var(--font-size-sm)',
        }}
      >
        Loading company holiday settings...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* 1. Header Banner */}
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
            <Building2 size={20} />
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
                Company Holiday Configuration
              </span>
              {companyName && <Badge variant="primary">{companyName}</Badge>}
            </div>
            <h1
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 700,
                color: 'hsl(var(--text-primary))',
                margin: '2px 0 0 0',
              }}
            >
              Holiday Calendars & Weekly-Off Policy
            </h1>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={() => void fetchData()}>
          <RefreshCw size={13} style={{ marginRight: '4px' }} />
          Refresh
        </Button>
      </div>

      {successMessage && (
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'hsl(var(--color-success) / 0.1)',
            color: 'hsl(var(--color-success))',
            fontSize: 'var(--font-size-xs)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'hsl(var(--color-danger) / 0.1)',
            color: 'hsl(var(--color-danger))',
            fontSize: 'var(--font-size-xs)',
          }}
        >
          {error}
        </div>
      )}

      {/* 2. Current Active Calendar Summary */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        {/* Active Calendar Card */}
        <Card>
          <CardHeader>
            <CardTitle style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Calendar size={16} style={{ color: 'hsl(var(--primary-color))' }} />
              <span>Current Assigned Calendar</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeAssignment ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: 'var(--font-size-base)',
                      color: 'hsl(var(--text-primary))',
                    }}
                  >
                    {activeCalendar?.name || 'Assigned Calendar'}
                  </span>
                  <Badge variant="success">Active</Badge>
                </div>
                {activeCalendar?.code && (
                  <div
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      color: 'hsl(var(--text-muted))',
                    }}
                  >
                    Code: {activeCalendar.code} &bull; Year: {activeCalendar.year}
                  </div>
                )}
                <div
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'hsl(var(--text-secondary))',
                    marginTop: '4px',
                  }}
                >
                  Effective: <strong>{activeAssignment.effectiveFrom}</strong>
                  {activeAssignment.effectiveTo
                    ? ` to ${activeAssignment.effectiveTo}`
                    : ' (Indefinite)'}
                </div>
              </div>
            ) : (
              <div style={{ color: 'hsl(var(--text-muted))', fontSize: 'var(--font-size-xs)' }}>
                No active calendar assigned yet. Please assign one below.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Off Days Card */}
        <Card>
          <CardHeader>
            <CardTitle style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Clock size={16} style={{ color: 'hsl(var(--color-brand-accent))' }} />
              <span>Company Weekly-Off Days</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {WEEKDAY_NAMES.map((w) => {
                const isOff = activeAssignment?.weeklyOffDays?.includes(w.index);
                return (
                  <div
                    key={w.index}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor: isOff
                        ? 'hsl(var(--color-success) / 0.15)'
                        : 'hsl(var(--bg-secondary))',
                      color: isOff ? 'hsl(var(--color-success))' : 'hsl(var(--text-muted))',
                      border: `1px solid ${isOff ? 'hsl(var(--color-success) / 0.3)' : 'hsl(var(--border-subtle))'}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {isOff && <span>✓</span>}
                    <span>{w.full}</span>
                  </div>
                );
              })}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'hsl(var(--text-muted))',
                marginTop: 'var(--space-3)',
              }}
            >
              Total{' '}
              <strong>
                {activeAssignment?.weeklyOffDays ? activeAssignment.weeklyOffDays.length : 1}
              </strong>{' '}
              weekly-off days per week configured for employees under this company.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Assign / Update Calendar Form */}
      <Card>
        <CardHeader>
          <CardTitle style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Plus size={16} style={{ color: 'hsl(var(--primary-color))' }} />
            <span>Assign or Change Holiday Calendar</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleAssignCalendar}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
          >
            {formError && (
              <div
                style={{
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'hsl(var(--color-danger) / 0.1)',
                  color: 'hsl(var(--color-danger))',
                  fontSize: 'var(--font-size-xs)',
                }}
              >
                {formError}
              </div>
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 'var(--space-4)',
              }}
            >
              {/* Calendar Select */}
              <div>
                <label
                  htmlFor="company-cal-select"
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    color: 'hsl(var(--text-secondary))',
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  Holiday Calendar *
                </label>
                <select
                  id="company-cal-select"
                  value={selectedCalendarId}
                  onChange={(e) => setSelectedCalendarId(e.target.value)}
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
                  required
                >
                  <option value="">-- Choose Calendar --</option>
                  {availableCalendars.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code}) — {c.year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Effective From */}
              <div>
                <label
                  htmlFor="effective-from"
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    color: 'hsl(var(--text-secondary))',
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  Effective From *
                </label>
                <Input
                  id="effective-from"
                  type="date"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  required
                />
              </div>

              {/* Effective To */}
              <div>
                <label
                  htmlFor="effective-to"
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    color: 'hsl(var(--text-secondary))',
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  Effective To (Optional)
                </label>
                <Input
                  id="effective-to"
                  type="date"
                  value={effectiveTo}
                  onChange={(e) => setEffectiveTo(e.target.value)}
                  placeholder="Leave empty for indefinite"
                />
              </div>
            </div>

            {/* Weekly Off Days Checkboxes */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'hsl(var(--text-secondary))',
                  marginBottom: 'var(--space-2)',
                }}
              >
                Weekly Off Days Policy * (Select recurring weekly days off)
              </label>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {WEEKDAY_NAMES.map((w) => {
                  const isChecked = weeklyOffDays.includes(w.index);
                  return (
                    <button
                      type="button"
                      key={w.index}
                      onClick={() => toggleWeeklyOff(w.index)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: `1px solid ${isChecked ? 'hsl(var(--primary-color))' : 'hsl(var(--border-subtle))'}`,
                        backgroundColor: isChecked
                          ? 'hsl(var(--primary-color) / 0.1)'
                          : 'hsl(var(--bg-secondary))',
                        color: isChecked ? 'hsl(var(--primary-color))' : 'hsl(var(--text-primary))',
                        fontWeight: isChecked ? 700 : 500,
                        fontSize: 'var(--font-size-xs)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // Handled by button click
                        style={{ pointerEvents: 'none', accentColor: 'hsl(var(--primary-color))' }}
                      />
                      <span>{w.full}</span>
                    </button>
                  );
                })}
              </div>

              {/* Quick presets */}
              <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                <button
                  type="button"
                  onClick={() => setWeeklyOffDays([0])}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'hsl(var(--primary-color))',
                    fontSize: '11px',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Preset: Sunday Only
                </button>
                <span style={{ color: 'hsl(var(--text-muted))', fontSize: '11px' }}>&bull;</span>
                <button
                  type="button"
                  onClick={() => setWeeklyOffDays([0, 6])}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'hsl(var(--primary-color))',
                    fontSize: '11px',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Preset: Saturday & Sunday
                </button>
              </div>
            </div>

            <div
              style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}
            >
              <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
                {isSubmitting ? 'Saving Assignment...' : 'Save Calendar Assignment'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 4. Assignment History */}
      <Card>
        <CardHeader>
          <CardTitle style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Layers size={16} style={{ color: 'hsl(var(--text-muted))' }} />
            <span>Calendar Assignment History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div
              style={{
                color: 'hsl(var(--text-muted))',
                fontSize: 'var(--font-size-xs)',
                padding: 'var(--space-4)',
              }}
            >
              No previous calendar assignment records found for this company.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: 'var(--font-size-xs)',
                }}
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
                    <th style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 600 }}>
                      Calendar
                    </th>
                    <th style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 600 }}>
                      Effective Period
                    </th>
                    <th style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 600 }}>
                      Weekly Offs
                    </th>
                    <th style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 600 }}>
                      Status
                    </th>
                    <th
                      style={{
                        padding: 'var(--space-2) var(--space-3)',
                        fontWeight: 600,
                        textAlign: 'right',
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a) => {
                    const cal = availableCalendars.find((c) => c.id === a.calendarId);
                    const offNames = (a.weeklyOffDays || [0])
                      .map((d) => WEEKDAY_NAMES.find((w) => w.index === d)?.label || `Day ${d}`)
                      .join(', ');

                    return (
                      <tr
                        key={a.id}
                        style={{ borderBottom: '1px solid hsl(var(--border-subtle))' }}
                      >
                        <td style={{ padding: 'var(--space-2) var(--space-3)' }}>
                          <span style={{ fontWeight: 600, color: 'hsl(var(--text-primary))' }}>
                            {cal?.name || a.calendarId}
                          </span>
                        </td>
                        <td style={{ padding: 'var(--space-2) var(--space-3)' }}>
                          {a.effectiveFrom} {a.effectiveTo ? `to ${a.effectiveTo}` : 'to Ongoing'}
                        </td>
                        <td style={{ padding: 'var(--space-2) var(--space-3)' }}>{offNames}</td>
                        <td style={{ padding: 'var(--space-2) var(--space-3)' }}>
                          <Badge variant={a.isActive ? 'success' : 'secondary'}>
                            {a.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td
                          style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'right' }}
                        >
                          {a.isActive && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => void handleDeactivateAssignment(a.id)}
                              style={{
                                height: '26px',
                                fontSize: '11px',
                                color: 'hsl(var(--color-danger))',
                              }}
                            >
                              Deactivate
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
