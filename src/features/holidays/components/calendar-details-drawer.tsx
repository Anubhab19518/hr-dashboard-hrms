'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import { Calendar, Plus, Search, Edit2, Trash2, X } from '@/components/atoms/icons';
import { HolidayService } from '../services/holiday.service';
import { HolidayType, type HolidayCalendar, type HolidayCalendarDay } from '../types/holiday.types';
import { getStandardGoiHolidays } from '../utils/goi-holidays';
import { CreateEditDayModal } from './create-edit-day-modal';

interface CalendarDetailsDrawerProps {
  calendarId: string | null;
  onClose: () => void;
  onCalendarUpdated?: () => void;
}

export function CalendarDetailsDrawer({
  calendarId,
  onClose,
  onCalendarUpdated,
}: CalendarDetailsDrawerProps) {
  const [calendar, setCalendar] = useState<HolidayCalendar | null>(null);
  const [days, setDays] = useState<HolidayCalendarDay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Add/Edit Day modal state
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [dayToEdit, setDayToEdit] = useState<HolidayCalendarDay | null>(null);
  const [deletingDayId, setDeletingDayId] = useState<string | null>(null);
  const [isPopulatingGoi, setIsPopulatingGoi] = useState(false);
  const [populateSuccessMsg, setPopulateSuccessMsg] = useState<string | null>(null);

  const fetchCalendarDetails = useCallback(async () => {
    if (!calendarId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [calendarData, daysData] = await Promise.all([
        HolidayService.getCalendar(calendarId),
        HolidayService.getCalendarDays(calendarId).catch(() => []),
      ]);
      setCalendar(calendarData);
      setDays(
        Array.isArray(daysData) && daysData.length > 0
          ? daysData
          : Array.isArray(calendarData.days)
            ? calendarData.days
            : [],
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch calendar details';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [calendarId]);

  useEffect(() => {
    if (calendarId) {
      void fetchCalendarDetails();
    } else {
      setCalendar(null);
      setDays([]);
    }
  }, [calendarId, fetchCalendarDetails]);

  const handleAutoPopulateGoiHolidays = async () => {
    if (!calendarId || !calendar) return;
    setIsPopulatingGoi(true);
    setPopulateSuccessMsg(null);
    setError(null);

    try {
      // Ensure we have current days directly from backend first
      let currentDays = days;
      try {
        currentDays = await HolidayService.getCalendarDays(calendarId);
        setDays(currentDays);
      } catch {
        // Fallback to local days if fetch fails
      }

      const standardHolidays = getStandardGoiHolidays(calendar.year);
      const existingDates = new Set(
        currentDays.map((d) => (d.holidayDate ? d.holidayDate.split('T')[0] : '')),
      );
      const missingHolidays = standardHolidays.filter(
        (h) => !existingDates.has(h.holidayDate.split('T')[0]),
      );

      if (missingHolidays.length === 0) {
        setPopulateSuccessMsg(
          `All ${standardHolidays.length} standard national/gazetted holidays are already added in this calendar.`,
        );
        return;
      }

      let addedCount = 0;
      for (const h of missingHolidays) {
        try {
          await HolidayService.addCalendarDay(calendarId, {
            holidayDate: h.holidayDate,
            name: h.name,
            description: h.description,
            holidayType: h.holidayType,
            isPaid: h.isPaid,
            isOptional: h.isOptional,
          });
          addedCount++;
        } catch {
          // If already exists (409) or other error, continue with remaining
        }
      }

      // Re-fetch fresh list of days from backend to display accurate state
      const refreshedDays = await HolidayService.getCalendarDays(calendarId);
      setDays(refreshedDays);
      setPopulateSuccessMsg(
        `Calendar synced with ${refreshedDays.length} total holidays (${addedCount} newly added) for ${calendar.year}!`,
      );
      if (onCalendarUpdated) onCalendarUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to auto-populate national holidays';
      setError(msg);
    } finally {
      setIsPopulatingGoi(false);
    }
  };

  const handleDaySaved = (savedDay: HolidayCalendarDay) => {
    setDays((prev) => {
      const exists = prev.some((d) => d.id === savedDay.id);
      if (exists) {
        return prev.map((d) => (d.id === savedDay.id ? savedDay : d));
      }
      return [...prev, savedDay];
    });
    if (onCalendarUpdated) onCalendarUpdated();
  };

  const handleDeleteDay = async (dayId: string) => {
    if (!calendarId) return;
    if (!confirm('Are you sure you want to remove this holiday day from the calendar?')) return;

    setDeletingDayId(dayId);
    try {
      await HolidayService.removeCalendarDay(calendarId, dayId);
      setDays((prev) => prev.filter((d) => d.id !== dayId));
      if (onCalendarUpdated) onCalendarUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete day';
      alert(msg);
    } finally {
      setDeletingDayId(null);
    }
  };

  // Filtered and sorted days
  const filteredDays = useMemo(() => {
    return days
      .filter((day) => {
        if (typeFilter !== 'ALL' && day.holidayType !== typeFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = day.name.toLowerCase().includes(q);
          const matchDate = day.holidayDate.includes(q);
          return matchName || matchDate;
        }
        return true;
      })
      .sort((a, b) => a.holidayDate.localeCompare(b.holidayDate));
  }, [days, typeFilter, searchQuery]);

  if (!calendarId) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        maxWidth: '560px',
        backgroundColor: 'hsl(var(--bg-surface))',
        borderLeft: '1px solid hsl(var(--border-subtle))',
        boxShadow: 'var(--shadow-xl)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideInRight 0.2s ease',
      }}
    >
      {/* 1. Drawer Header */}
      <div
        style={{
          padding: 'var(--space-4) var(--space-5)',
          borderBottom: '1px solid hsl(var(--border-subtle))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'hsl(var(--bg-secondary) / 0.5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'hsl(var(--primary-color) / 0.1)',
              color: 'hsl(var(--primary-color))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Calendar size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <h2
                style={{
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 700,
                  color: 'hsl(var(--text-primary))',
                  margin: 0,
                }}
              >
                {calendar?.name || 'Calendar Details'}
              </h2>
              {calendar?.isBaseline && <Badge variant="primary">Baseline</Badge>}
            </div>
            <div
              style={{
                fontSize: '11px',
                fontFamily: 'monospace',
                color: 'hsl(var(--text-muted))',
                marginTop: '2px',
              }}
            >
              {calendar?.code} &bull; Year {calendar?.year}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'hsl(var(--text-muted))',
            cursor: 'pointer',
            padding: 'var(--space-1)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Close drawer"
        >
          <X size={18} />
        </button>
      </div>

      {/* 2. Drawer Stats / Actions Bar */}
      <div
        style={{
          padding: 'var(--space-4) var(--space-5)',
          borderBottom: '1px solid hsl(var(--border-subtle))',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
        }}
      >
        {calendar?.description && (
          <p
            style={{
              margin: 0,
              fontSize: 'var(--font-size-xs)',
              color: 'hsl(var(--text-secondary))',
              lineHeight: 1.4,
            }}
          >
            {calendar.description}
          </p>
        )}

        {/* Top Controls: Search + Filter + Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'hsl(var(--text-muted))',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                placeholder="Search days or dates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  height: '36px',
                  paddingLeft: '36px',
                  paddingRight: 'var(--space-3)',
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

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{
                height: '36px',
                padding: '0 var(--space-3)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid hsl(var(--border-subtle))',
                backgroundColor: 'hsl(var(--bg-secondary))',
                color: 'hsl(var(--text-primary))',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
                minWidth: '120px',
              }}
            >
              <option value="ALL">All Types ({days.length})</option>
              <option value={HolidayType.NATIONAL}>National</option>
              <option value={HolidayType.REGIONAL}>Regional</option>
              <option value={HolidayType.OPTIONAL}>Optional</option>
              <option value={HolidayType.CUSTOM}>Custom</option>
            </select>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 'var(--space-2)',
              justifyContent: 'flex-end',
              alignItems: 'center',
            }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleAutoPopulateGoiHolidays()}
              disabled={isPopulatingGoi}
              style={{ height: '32px' }}
              title="Auto-populate Indian National / Gazetted public holidays"
            >
              {isPopulatingGoi ? 'Adding...' : 'Add National Holidays'}
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setDayToEdit(null);
                setIsDayModalOpen(true);
              }}
              style={{ height: '32px' }}
            >
              <Plus size={13} style={{ marginRight: '4px' }} />
              Add Day
            </Button>
          </div>
        </div>

        {populateSuccessMsg && (
          <div
            style={{
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'hsl(var(--color-success) / 0.12)',
              color: 'hsl(var(--color-success))',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
            }}
          >
            {populateSuccessMsg}
          </div>
        )}
      </div>

      {/* 3. Days List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4) var(--space-5)' }}>
        {isLoading ? (
          <div
            style={{
              padding: 'var(--space-8)',
              textAlign: 'center',
              color: 'hsl(var(--text-muted))',
              fontSize: 'var(--font-size-xs)',
            }}
          >
            Loading calendar days...
          </div>
        ) : error ? (
          <div
            style={{
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'hsl(var(--color-danger) / 0.1)',
              color: 'hsl(var(--color-danger))',
              fontSize: 'var(--font-size-xs)',
            }}
          >
            {error}
          </div>
        ) : filteredDays.length === 0 ? (
          <div
            style={{
              padding: 'var(--space-8) var(--space-4)',
              textAlign: 'center',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed hsl(var(--border-subtle))',
              backgroundColor: 'hsl(var(--bg-secondary) / 0.4)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-3)',
            }}
          >
            <Calendar size={28} style={{ color: 'hsl(var(--text-muted))' }} />
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}>
              {searchQuery || typeFilter !== 'ALL'
                ? 'No holiday days match your filter.'
                : 'No holidays configured in this calendar yet.'}
            </div>
            <div
              style={{
                display: 'flex',
                gap: 'var(--space-2)',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <Button
                variant="primary"
                size="sm"
                onClick={() => void handleAutoPopulateGoiHolidays()}
                disabled={isPopulatingGoi}
              >
                {isPopulatingGoi
                  ? 'Adding Holidays...'
                  : `Add National Holidays (${calendar?.year || 2026})`}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDayToEdit(null);
                  setIsDayModalOpen(true);
                }}
              >
                <Plus size={13} style={{ marginRight: '4px' }} />
                Add Custom Holiday Day
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {filteredDays.map((day) => {
              const dateObj = new Date(day.holidayDate);
              const formattedDate = dateObj.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                weekday: 'short',
              });

              return (
                <div
                  key={day.id}
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid hsl(var(--border-subtle))',
                    backgroundColor: 'hsl(var(--bg-surface))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 'var(--space-3)',
                    transition: 'border-color var(--transition-fast)',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        marginBottom: '3px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 700,
                          color: 'hsl(var(--text-primary))',
                        }}
                      >
                        {day.name}
                      </span>

                      {/* Type Badge */}
                      <Badge
                        variant={
                          day.holidayType === HolidayType.NATIONAL
                            ? 'primary'
                            : day.holidayType === HolidayType.REGIONAL
                              ? 'secondary'
                              : day.holidayType === HolidayType.OPTIONAL
                                ? 'warning'
                                : 'outline'
                        }
                      >
                        {day.holidayType}
                      </Badge>

                      {day.isOptional && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            padding: '1px 5px',
                            borderRadius: '4px',
                            backgroundColor: 'hsl(var(--color-brand-accent) / 0.1)',
                            color: 'hsl(var(--color-brand-accent))',
                          }}
                        >
                          Floating / Opt-in
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-3)',
                        fontSize: '11px',
                        color: 'hsl(var(--text-muted))',
                      }}
                    >
                      <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        📅 {formattedDate}
                      </span>
                      <span>&bull;</span>
                      <span
                        style={{
                          color: day.isPaid
                            ? 'hsl(var(--color-success))'
                            : 'hsl(var(--text-muted))',
                        }}
                      >
                        {day.isPaid ? '✓ Paid Day' : 'Unpaid Day'}
                      </span>
                      {day.description && (
                        <>
                          <span>&bull;</span>
                          <span
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {day.description}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setDayToEdit(day);
                        setIsDayModalOpen(true);
                      }}
                      title="Edit day"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'hsl(var(--text-secondary))',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteDay(day.id)}
                      disabled={deletingDayId === day.id}
                      title="Remove day"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'hsl(var(--color-danger))',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        opacity: deletingDayId === day.id ? 0.5 : 1,
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Footer */}
      <div
        style={{
          padding: 'var(--space-3) var(--space-5)',
          borderTop: '1px solid hsl(var(--border-subtle))',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'hsl(var(--bg-secondary) / 0.5)',
          fontSize: 'var(--font-size-xs)',
          color: 'hsl(var(--text-muted))',
        }}
      >
        <span>
          Total <strong>{days.length}</strong> holiday days in {calendar?.year || 'calendar'}
        </span>
        <Button variant="outline" size="sm" onClick={onClose}>
          Done
        </Button>
      </div>

      {/* Add / Edit Day Modal */}
      {calendar && (
        <CreateEditDayModal
          isOpen={isDayModalOpen}
          onClose={() => setIsDayModalOpen(false)}
          calendarId={calendar.id}
          calendarYear={calendar.year}
          dayToEdit={dayToEdit}
          onSaved={handleDaySaved}
        />
      )}
    </div>
  );
}
