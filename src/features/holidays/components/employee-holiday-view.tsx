'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/atoms/card';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import { Input } from '@/components/atoms/input';
import { Modal } from '@/components/molecules/modal';
import {
  Calendar,
  Plus,
  Trash2,
  RefreshCw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
} from '@/components/atoms/icons';
import { HolidayService } from '../services/holiday.service';
import {
  OverrideType,
  type EmployeeHolidaySummary,
  type EmployeeHolidayOverride,
  type HolidayCalendarDay,
} from '../types/holiday.types';
import { getStandardGoiHolidays } from '../utils/goi-holidays';
import type { CreateEmployeeHolidayOverrideInput } from '../schemas/holiday.schema';

interface EmployeeHolidayViewProps {
  employeeId: string;
  employeeName?: string;
  companyId?: string;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function EmployeeHolidayView({
  employeeId,
  employeeName,
  companyId,
}: EmployeeHolidayViewProps) {
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1); // 1-12
  const [summary, setSummary] = useState<EmployeeHolidaySummary | null>(null);
  const [overrides, setOverrides] = useState<EmployeeHolidayOverride[]>([]);
  const [calendarDaysList, setCalendarDaysList] = useState<HolidayCalendarDay[]>([]);
  const [hasAssignedCalendar, setHasAssignedCalendar] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Custom Override Dialog State
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideDate, setOverrideDate] = useState('');
  const [overrideType, setOverrideType] = useState<OverrideType>(OverrideType.ADD);
  const [overrideName, setOverrideName] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideIsPaid, setOverrideIsPaid] = useState(true);
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);
  const [overrideError, setOverrideError] = useState<string | null>(null);

  const fetchHolidayData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sum, ovList, companyAssignments] = await Promise.all([
        HolidayService.getEmployeeEffectiveHolidays(
          employeeId,
          selectedYear,
          selectedMonth,
          companyId,
        ),
        HolidayService.getEmployeeOverrides(employeeId),
        companyId
          ? HolidayService.getCompanyAssignments(companyId).catch(() => [])
          : Promise.resolve([]),
      ]);
      setSummary(sum);
      setOverrides(Array.isArray(ovList) ? ovList : []);

      // Check if company has an active assigned calendar
      const activeAssign = Array.isArray(companyAssignments)
        ? companyAssignments.find((a) => a.isActive !== false)
        : null;

      if (activeAssign?.calendarId) {
        setHasAssignedCalendar(true);
        try {
          const calData = await HolidayService.getCalendar(activeAssign.calendarId);
          if (Array.isArray(calData?.days)) {
            setCalendarDaysList(calData.days);
          }
        } catch {
          // Keep whatever is available
        }
      } else {
        setHasAssignedCalendar(Array.isArray(companyAssignments) && companyAssignments.length > 0);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to fetch employee holiday information';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, selectedYear, selectedMonth, companyId]);

  useEffect(() => {
    void fetchHolidayData();
  }, [fetchHolidayData]);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleCurrentMonth = () => {
    setSelectedMonth(today.getMonth() + 1);
    setSelectedYear(today.getFullYear());
  };

  // Calendar Grid builder for the month
  const calendarDays = useMemo(() => {
    const year = selectedYear;
    const monthIndex = selectedMonth - 1; // 0-indexed
    const firstDayOfWeek = new Date(year, monthIndex, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    const days = [];

    // Prefix empty slots
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ dayNumber: 0, dateString: '', isCurrentMonth: false });
    }

    // Actual days of the month
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dayStr = String(d).padStart(2, '0');
      const mStr = String(selectedMonth).padStart(2, '0');
      const dateString = `${year}-${mStr}-${dayStr}`;
      days.push({ dayNumber: d, dateString, isCurrentMonth: true });
    }

    return days;
  }, [selectedYear, selectedMonth]);

  // Handle Optional Holiday Opt-Out / Opt-In
  const handleToggleOptOut = async (dateStr: string, isOptedOut: boolean, overrideId?: string) => {
    try {
      if (isOptedOut && overrideId) {
        // Re-enable holiday: delete the REMOVE override
        await HolidayService.deleteEmployeeOverride(overrideId);
      } else {
        // Opt out: create a REMOVE override
        await HolidayService.createEmployeeOverride(employeeId, {
          holidayDate: dateStr,
          overrideType: OverrideType.REMOVE,
          reason: 'Employee opted out of optional holiday (working day)',
        });
      }
      await fetchHolidayData();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to update optional holiday preference';
      alert(msg);
    }
  };

  const handleCreateCustomOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    setOverrideError(null);
    setIsSubmittingOverride(true);

    try {
      const payload: CreateEmployeeHolidayOverrideInput = {
        holidayDate: overrideDate,
        overrideType,
        name:
          overrideType === OverrideType.ADD && overrideName.trim()
            ? overrideName.trim()
            : undefined,
        isPaid: overrideIsPaid,
        reason: overrideReason.trim() ? overrideReason.trim() : undefined,
      };

      await HolidayService.createEmployeeOverride(employeeId, payload);
      setIsOverrideModalOpen(false);
      setOverrideDate('');
      setOverrideName('');
      setOverrideReason('');
      await fetchHolidayData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create override';
      setOverrideError(msg);
    } finally {
      setIsSubmittingOverride(false);
    }
  };

  const handleDeleteOverride = async (overrideId: string) => {
    if (!confirm('Are you sure you want to remove this employee-specific override?')) return;
    try {
      await HolidayService.deleteEmployeeOverride(overrideId);
      await fetchHolidayData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete override';
      alert(msg);
    }
  };

  const paidDatesSet = new Set(summary?.paidHolidayDates || []);
  const unpaidDatesSet = new Set(summary?.unpaidHolidayDates || []);
  const weeklyOffDatesSet = new Set(summary?.weeklyOffDates || []);

  const resolveHolidayTitle = useCallback(
    (dateString: string): string => {
      // 1. Check custom employee overrides
      const ov = overrides.find(
        (o) => o.holidayDate === dateString && o.overrideType === OverrideType.ADD,
      );
      if (ov?.name) return ov.name;

      // 2. Check calendar days list
      const calDay = calendarDaysList.find((d) => d.holidayDate === dateString);
      if (calDay?.name) return calDay.name;

      // 3. Check standard GOI holidays for that year
      const goi = getStandardGoiHolidays(selectedYear).find((h) => h.holidayDate === dateString);
      if (goi?.name) return goi.name;

      return 'Paid Holiday';
    },
    [overrides, calendarDaysList, selectedYear],
  );

  const yearOptions = [
    today.getFullYear() - 2,
    today.getFullYear() - 1,
    today.getFullYear(),
    today.getFullYear() + 1,
    today.getFullYear() + 2,
  ];

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
        Loading employee holiday information...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* 1. Header & Month/Year Selectors */}
      <div
        style={{
          backgroundColor: 'hsl(var(--bg-surface))',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid hsl(var(--border-subtle))',
          padding: 'var(--space-4) var(--space-5)',
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
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-lg)',
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
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'hsl(var(--text-muted))',
                }}
              >
                Employee Holidays & Time Off
              </span>
              {employeeName && <Badge variant="primary">{employeeName}</Badge>}
            </div>
            <h2
              style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: 700,
                color: 'hsl(var(--text-primary))',
                margin: '2px 0 0 0',
              }}
            >
              {MONTH_NAMES[selectedMonth - 1]} {selectedYear} Attendance & Holiday Matrix
            </h2>
          </div>
        </div>

        {/* Controls: Month & Year Picker + Quick Month Arrows + Add Override */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}
        >
          {/* Previous Month Arrow */}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevMonth}
            style={{ height: '36px', width: '36px', padding: 0 }}
            title="Previous Month"
          >
            <ChevronLeft size={16} />
          </Button>

          {/* Month Selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
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
            }}
          >
            {MONTH_NAMES.map((name, idx) => (
              <option key={idx} value={idx + 1}>
                {name}
              </option>
            ))}
          </select>

          {/* Year Selector */}
          <select
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
              fontWeight: 600,
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

          {/* Next Month Arrow */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextMonth}
            style={{ height: '36px', width: '36px', padding: 0 }}
            title="Next Month"
          >
            <ChevronRight size={16} />
          </Button>

          {/* Today Quick Jump Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCurrentMonth}
            style={{ height: '36px' }}
            title="Jump to current month"
          >
            Today
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchHolidayData()}
            style={{ height: '36px' }}
            title="Refresh"
          >
            <RefreshCw size={13} />
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setOverrideDate(`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`);
              setIsOverrideModalOpen(true);
            }}
            style={{ height: '36px' }}
          >
            <Plus size={13} style={{ marginRight: 'var(--space-1)' }} />
            Add Day Override
          </Button>
        </div>
      </div>

      {!hasAssignedCalendar && (
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            color: '#1e40af',
            fontSize: 'var(--font-size-xs)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>
            ℹ️ <strong>Company Holiday Policy:</strong> To reflect organization-wide holidays in
            this grid, assign a calendar under{' '}
            <strong>Company Profiles &gt; Holidays &amp; Weekly Offs</strong>.
          </span>
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

      {/* 2. Live Summary Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: 'var(--space-3)',
        }}
      >
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'hsl(var(--bg-surface))',
            border: '1px solid hsl(var(--border-subtle))',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>
            Total Days
          </span>
          <span
            style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 800,
              color: 'hsl(var(--text-primary))',
            }}
          >
            {summary?.totalCalendarDays || 0}
          </span>
        </div>

        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'hsl(var(--bg-surface))',
            border: '1px solid hsl(var(--border-subtle))',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 600 }}>
            🟩 Weekly Offs
          </span>
          <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: '#166534' }}>
            {summary?.weeklyOffCount || 0}
          </span>
        </div>

        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'hsl(var(--bg-surface))',
            border: '1px solid hsl(var(--border-subtle))',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600 }}>
            🟦 Paid Holidays
          </span>
          <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: '#1e40af' }}>
            {summary?.paidHolidayDays || 0}
          </span>
        </div>

        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'hsl(var(--bg-surface))',
            border: '1px solid hsl(var(--border-subtle))',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          <span style={{ fontSize: '11px', color: '#d97706', fontWeight: 600 }}>
            🟧 Unpaid Holidays
          </span>
          <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: '#b45309' }}>
            {summary?.unpaidHolidayDays || 0}
          </span>
        </div>

        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'hsl(var(--primary-color) / 0.08)',
            border: '1px solid hsl(var(--primary-color) / 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          <span style={{ fontSize: '11px', color: 'hsl(var(--primary-color))', fontWeight: 700 }}>
            💼 Working Days
          </span>
          <span
            style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 800,
              color: 'hsl(var(--primary-color))',
            }}
          >
            {summary?.workingDays || 0}
          </span>
        </div>
      </div>

      {/* 3. Monthly Calendar Grid with 12-Month Quick Tab Bar */}
      <Card>
        <CardHeader>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
              width: '100%',
            }}
          >
            <CardTitle
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 'var(--space-2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Calendar size={16} />
                <span>
                  {MONTH_NAMES[selectedMonth - 1]} {selectedYear} Day-by-Day View
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  fontSize: '11px',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      backgroundColor: '#dcfce7',
                      borderRadius: '2px',
                    }}
                  />
                  Weekly Off
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      backgroundColor: '#dbeafe',
                      borderRadius: '2px',
                    }}
                  />
                  Paid Holiday
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      backgroundColor: '#ffedd5',
                      borderRadius: '2px',
                    }}
                  />
                  Unpaid Holiday
                </span>
              </div>
            </CardTitle>

            {/* 12-Month Quick Switcher Pill Bar */}
            <div
              style={{
                display: 'flex',
                gap: '4px',
                overflowX: 'auto',
                paddingBottom: '4px',
                borderBottom: '1px solid hsl(var(--border-subtle))',
              }}
            >
              {MONTH_NAMES.map((name, idx) => {
                const mNum = idx + 1;
                const isActive = mNum === selectedMonth;
                const shortName = name.slice(0, 3);
                return (
                  <button
                    key={mNum}
                    type="button"
                    onClick={() => setSelectedMonth(mNum)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid',
                      borderColor: isActive
                        ? 'hsl(var(--color-brand-accent))'
                        : 'hsl(var(--border-subtle))',
                      backgroundColor: isActive
                        ? 'hsl(var(--color-brand-accent))'
                        : 'hsl(var(--bg-secondary))',
                      color: isActive ? 'hsl(var(--text-inverse))' : 'hsl(var(--text-secondary))',
                      fontSize: '11px',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {shortName}
                  </button>
                );
              })}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
            {/* Weekday headers */}
            {WEEKDAY_SHORT.map((w, idx) => (
              <div
                key={idx}
                style={{
                  textAlign: 'center',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'hsl(var(--text-muted))',
                  padding: '6px 0',
                }}
              >
                {w}
              </div>
            ))}

            {/* Calendar Days */}
            {calendarDays.map((cell, idx) => {
              if (!cell.isCurrentMonth) {
                return (
                  <div
                    key={`empty-${idx}`}
                    style={{
                      minHeight: '76px',
                      backgroundColor: 'hsl(var(--bg-secondary) / 0.2)',
                      borderRadius: 'var(--radius-md)',
                      opacity: 0.3,
                    }}
                  />
                );
              }

              const isWeeklyOff = weeklyOffDatesSet.has(cell.dateString);
              const isPaidHoliday = paidDatesSet.has(cell.dateString);
              const isUnpaidHoliday = unpaidDatesSet.has(cell.dateString);
              const holidayTitle = resolveHolidayTitle(cell.dateString);

              let bgColor = 'hsl(var(--bg-surface))';
              let borderColor = 'hsl(var(--border-subtle))';
              let tagText = '';
              let tagBg = '';
              let tagColor = '';

              if (isPaidHoliday) {
                bgColor = '#eff6ff';
                borderColor = '#93c5fd';
                tagText = holidayTitle || 'Paid Holiday';
                tagBg = '#dbeafe';
                tagColor = '#1e40af';
              } else if (isUnpaidHoliday) {
                bgColor = '#fff7ed';
                borderColor = '#fed7aa';
                tagText = holidayTitle || 'Unpaid Holiday';
                tagBg = '#ffedd5';
                tagColor = '#9a3412';
              } else if (isWeeklyOff) {
                bgColor = '#f0fdf4';
                borderColor = '#bbf7d0';
                tagText = 'Weekly Off';
                tagBg = '#dcfce7';
                tagColor = '#166534';
              }

              return (
                <div
                  key={cell.dateString}
                  title={tagText ? `${cell.dateString}: ${tagText}` : cell.dateString}
                  style={{
                    minHeight: '76px',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${borderColor}`,
                    backgroundColor: bgColor,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color:
                          isWeeklyOff || isPaidHoliday
                            ? 'hsl(var(--text-primary))'
                            : 'hsl(var(--text-secondary))',
                      }}
                    >
                      {cell.dayNumber}
                    </span>
                  </div>

                  {tagText && (
                    <div
                      style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '2px 4px',
                        borderRadius: '3px',
                        backgroundColor: tagBg,
                        color: tagColor,
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {tagText}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 4. Optional Holidays Section */}
      {summary?.optionalHolidays && summary.optionalHolidays.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Calendar size={16} />
              <span>Optional / Restricted Holidays for this Month</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {summary.optionalHolidays.map((opt) => {
                const optOverride = overrides.find(
                  (o) => o.holidayDate === opt.date && o.overrideType === OverrideType.REMOVE,
                );
                const isOptedOut = !!optOverride;

                return (
                  <div
                    key={opt.date}
                    style={{
                      padding: 'var(--space-3) var(--space-4)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid hsl(var(--border-subtle))',
                      backgroundColor: isOptedOut ? 'hsl(var(--bg-secondary))' : '#f0fdf4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 'var(--space-3)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <span style={{ fontWeight: 700, fontSize: 'var(--font-size-xs)' }}>
                          📅 {opt.date}
                        </span>
                        <span style={{ fontWeight: 600, fontSize: 'var(--font-size-xs)' }}>
                          {opt.name}
                        </span>
                        <Badge variant={isOptedOut ? 'secondary' : 'success'}>
                          {isOptedOut ? 'Opted Out (Working)' : 'Active (Holiday Off)'}
                        </Badge>
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'hsl(var(--text-secondary))',
                          marginTop: '2px',
                        }}
                      >
                        Optional Holiday — click toggle if you prefer to work or take this holiday
                        off.
                      </div>
                    </div>

                    <Button
                      variant={isOptedOut ? 'outline' : 'secondary'}
                      size="sm"
                      onClick={() => void handleToggleOptOut(opt.date, isOptedOut, optOverride?.id)}
                    >
                      {isOptedOut ? 'Take Holiday Off' : 'Opt-Out (Work This Day)'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 5. Overrides List */}
      <Card>
        <CardHeader>
          <CardTitle
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <SlidersHorizontal size={16} />
              <span>Employee-Specific Holiday Overrides ({overrides.length})</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setOverrideDate(`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`);
                setIsOverrideModalOpen(true);
              }}
            >
              <Plus size={12} style={{ marginRight: '4px' }} />
              Add Override
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {overrides.length === 0 ? (
            <div
              style={{
                color: 'hsl(var(--text-muted))',
                fontSize: 'var(--font-size-xs)',
                padding: 'var(--space-3)',
              }}
            >
              No custom holiday overrides applied for this employee. Standard company calendar is in
              effect.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {overrides.map((ov) => {
                const isAdd = ov.overrideType === OverrideType.ADD;
                return (
                  <div
                    key={ov.id}
                    style={{
                      padding: 'var(--space-3) var(--space-4)',
                      borderRadius: 'var(--radius-lg)',
                      border: `1px solid ${isAdd ? '#bbf7d0' : '#fecaca'}`,
                      backgroundColor: isAdd ? '#f0fdf4' : '#fef2f2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 'var(--space-3)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <Badge variant={isAdd ? 'success' : 'secondary'}>
                          {isAdd ? '+ ADD HOLIDAY' : '- CANCEL / WORK'}
                        </Badge>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: 'var(--font-size-xs)',
                            color: 'hsl(var(--text-primary))',
                          }}
                        >
                          📅 {ov.holidayDate}
                        </span>
                        {ov.name && (
                          <span style={{ fontWeight: 600, fontSize: 'var(--font-size-xs)' }}>
                            {ov.name}
                          </span>
                        )}
                      </div>
                      {ov.reason && (
                        <div
                          style={{
                            fontSize: '11px',
                            color: 'hsl(var(--text-secondary))',
                            marginTop: '3px',
                          }}
                        >
                          Reason: {ov.reason}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleDeleteOverride(ov.id)}
                      title="Remove override"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'hsl(var(--color-danger))',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 5. Add / Create Override Modal */}
      <Modal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        title="Add Employee Holiday Override"
        size="md"
      >
        <form
          onSubmit={handleCreateCustomOverride}
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
        >
          {overrideError && (
            <div
              style={{
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'hsl(var(--color-danger) / 0.1)',
                color: 'hsl(var(--color-danger))',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              {overrideError}
            </div>
          )}

          <div>
            <label
              htmlFor="ov-type"
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'hsl(var(--text-secondary))',
                marginBottom: 'var(--space-1)',
              }}
            >
              Override Type *
            </label>
            <select
              id="ov-type"
              value={overrideType}
              onChange={(e) => setOverrideType(e.target.value as OverrideType)}
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
              <option value={OverrideType.ADD}>
                + ADD: Grant Extra Custom Holiday to Employee
              </option>
              <option value={OverrideType.REMOVE}>
                - REMOVE: Cancel/Work on Scheduled Holiday (Make Working Day)
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="ov-date"
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
              id="ov-date"
              type="date"
              value={overrideDate}
              onChange={(e) => setOverrideDate(e.target.value)}
              required
            />
          </div>

          {overrideType === OverrideType.ADD && (
            <div>
              <label
                htmlFor="ov-name"
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
                id="ov-name"
                placeholder="e.g. Local Festival / Personal Day Off"
                value={overrideName}
                onChange={(e) => setOverrideName(e.target.value)}
                required={overrideType === OverrideType.ADD}
              />
            </div>
          )}

          <div>
            <label
              htmlFor="ov-reason"
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'hsl(var(--text-secondary))',
                marginBottom: 'var(--space-1)',
              }}
            >
              Justification / Reason
            </label>
            <Input
              id="ov-reason"
              placeholder="e.g. Approved by HR / Special project clearance"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
            />
          </div>

          {overrideType === OverrideType.ADD && (
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
                checked={overrideIsPaid}
                onChange={(e) => setOverrideIsPaid(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'hsl(var(--primary-color))' }}
              />
              <span>Paid Holiday (Included in payable days)</span>
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
              onClick={() => setIsOverrideModalOpen(false)}
              disabled={isSubmittingOverride}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSubmittingOverride}>
              {isSubmittingOverride ? 'Adding Override...' : 'Apply Override'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
