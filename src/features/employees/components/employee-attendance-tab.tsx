'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/atoms/card';
import { Badge } from '@/components/atoms/badge';
import { Button } from '@/components/atoms/button';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Camera,
  RefreshCw,
  Calendar,
} from '@/components/atoms/icons';
import { EmployeeService } from '../services/employee.service';
import type { AttendanceRecord } from '../types/employee.types';

interface EmployeeAttendanceTabProps {
  employeeId: string;
}

type DateRangeFilter = '30_DAYS' | 'THIS_MONTH' | 'PREV_MONTH';

const parseSafeNumber = (val: unknown): number | null => {
  if (val === null || val === undefined || val === '') return null;
  const num = typeof val === 'number' ? val : Number(val);
  return isNaN(num) ? null : num;
};

export function EmployeeAttendanceTab({ employeeId }: EmployeeAttendanceTabProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [selectedRange, setSelectedRange] = useState<DateRangeFilter>('30_DAYS');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to compute startDate & endDate
  const getDateRange = useCallback((range: DateRangeFilter) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0]!;

    if (range === 'THIS_MONTH') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const startDate = `${firstDay.getFullYear()}-${String(firstDay.getMonth() + 1).padStart(2, '0')}-01`;
      const endDate = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
      return { startDate, endDate, label: 'This Month' };
    }

    if (range === 'PREV_MONTH') {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      const startDate = `${firstDay.getFullYear()}-${String(firstDay.getMonth() + 1).padStart(2, '0')}-01`;
      const endDate = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
      return { startDate, endDate, label: 'Previous Month' };
    }

    // Default: '30_DAYS'
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const y = thirtyDaysAgo.getFullYear();
    const m = String(thirtyDaysAgo.getMonth() + 1).padStart(2, '0');
    const d = String(thirtyDaysAgo.getDate()).padStart(2, '0');
    return { startDate: `${y}-${m}-${d}`, endDate: todayStr, label: 'Last 30 Calendar Days' };
  }, []);

  const fetchAttendance = useCallback(async () => {
    if (!employeeId) return;
    setIsLoading(true);
    setError(null);
    try {
      const { startDate, endDate } = getDateRange(selectedRange);
      const data = await EmployeeService.getEmployeeAttendance(employeeId, {
        startDate,
        endDate,
        page: 1,
        limit: 50,
      });
      setRecords(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch attendance records';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, selectedRange, getDateRange]);

  useEffect(() => {
    void fetchAttendance();
  }, [fetchAttendance]);

  // Derived KPI calculations from attendance records
  const summaryKpis = useMemo(() => {
    let totalWorkedHours = 0;
    let presentDays = 0;
    let halfDaysOrLate = 0;
    let absentOrLeaveDays = 0;
    let onLeaveCount = 0;

    records.forEach((rec) => {
      const status = (rec.status || '').toUpperCase();
      const hours = parseSafeNumber(rec.hoursWorked);

      // Total worked hours calculation
      if (hours !== null && hours > 0) {
        totalWorkedHours += hours;
      } else if (rec.checkInTime && rec.checkOutTime) {
        const inTime = new Date(rec.checkInTime).getTime();
        const outTime = new Date(rec.checkOutTime).getTime();
        if (!isNaN(inTime) && !isNaN(outTime) && outTime > inTime) {
          totalWorkedHours += (outTime - inTime) / 3600000;
        }
      }

      // Status aggregation
      if (status === 'PRESENT') {
        presentDays++;
      } else if (status === 'HALF_DAY' || status === 'LATE') {
        halfDaysOrLate++;
      } else if (status === 'ABSENT') {
        absentOrLeaveDays++;
      } else if (status === 'ON_LEAVE') {
        absentOrLeaveDays++;
        onLeaveCount++;
      }
    });

    return {
      totalWorkedHours,
      presentDays,
      halfDaysOrLate,
      absentOrLeaveDays,
      onLeaveCount,
    };
  }, [records]);

  // Format Helpers
  const formatPunchDate = (dateVal?: string | null) => {
    if (!dateVal) return '—';
    try {
      const dateOnly = String(dateVal).split('T')[0]!;
      const parts = dateOnly.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      const d = new Date(dateVal);
      return isNaN(d.getTime())
        ? dateVal
        : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateVal;
    }
  };

  const formatPunchTime = (timeStr?: string | null) => {
    if (!timeStr) return null;
    try {
      const d = new Date(timeStr);
      return isNaN(d.getTime())
        ? timeStr
        : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return timeStr;
    }
  };

  const formatWorkedDuration = (rec: AttendanceRecord) => {
    if (rec.checkInTime && rec.checkOutTime) {
      const inTime = new Date(rec.checkInTime).getTime();
      const outTime = new Date(rec.checkOutTime).getTime();
      if (!isNaN(inTime) && !isNaN(outTime) && outTime > inTime) {
        const totalMinutes = Math.floor((outTime - inTime) / 60000);
        const hrs = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        return `${hrs}h ${mins}m`;
      }
    }
    const hours = parseSafeNumber(rec.hoursWorked);
    if (hours !== null && hours > 0) {
      const totalMinutes = Math.round(hours * 60);
      const hrs = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      return `${hrs}h ${mins}m`;
    }
    return '—';
  };

  const renderStatusBadge = (status?: string) => {
    const st = (status || '').toUpperCase();
    switch (st) {
      case 'PRESENT':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: 'var(--radius-full)',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: '#dcfce7',
              color: '#15803d',
              border: '1px solid #bbf7d0',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#22c55e',
              }}
            />
            PRESENT
          </span>
        );
      case 'HALF_DAY':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: 'var(--radius-full)',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: '#fef3c7',
              color: '#b45309',
              border: '1px solid #fde68a',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#f59e0b',
              }}
            />
            HALF DAY
          </span>
        );
      case 'LATE':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: 'var(--radius-full)',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: '#fef3c7',
              color: '#b45309',
              border: '1px solid #fde68a',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#f59e0b',
              }}
            />
            LATE
          </span>
        );
      case 'ON_LEAVE':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: 'var(--radius-full)',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: '#dbeafe',
              color: '#1d4ed8',
              border: '1px solid #bfdbfe',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
              }}
            />
            ON LEAVE
          </span>
        );
      case 'ABSENT':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: 'var(--radius-full)',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              border: '1px solid #fca5a5',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#ef4444',
              }}
            />
            ABSENT
          </span>
        );
      default:
        return <Badge variant="secondary">{status || '—'}</Badge>;
    }
  };

  const renderSourceBadge = (rec: AttendanceRecord) => {
    const src = (rec.source || rec.verificationMethod || '').toUpperCase();
    const faceScore = parseSafeNumber(rec.faceMatchScore);

    if (src.includes('BIOMETRIC') || src.includes('FACE') || faceScore !== null) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 7px',
            borderRadius: 'var(--radius-md)',
            fontSize: '11px',
            fontWeight: 600,
            backgroundColor: '#f3e8ff',
            color: '#7e22ce',
            border: '1px solid #d8b4fe',
          }}
          title={
            faceScore !== null
              ? `Face Match Confidence: ${faceScore.toFixed(1)}%`
              : 'Biometric Face Verification'
          }
        >
          <Camera size={12} />
          <span>Biometric{faceScore !== null ? ` (${faceScore.toFixed(1)}%)` : ''}</span>
        </span>
      );
    }

    if (src.includes('SELF_SERVICE')) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 7px',
            borderRadius: 'var(--radius-md)',
            fontSize: '11px',
            fontWeight: 600,
            backgroundColor: '#eff6ff',
            color: '#1e40af',
            border: '1px solid #bfdbfe',
          }}
        >
          <CheckCircle2 size={12} />
          <span>Self Service</span>
        </span>
      );
    }

    if (src.includes('FIELD_CAPTURE')) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 7px',
            borderRadius: 'var(--radius-md)',
            fontSize: '11px',
            fontWeight: 600,
            backgroundColor: '#f0fdf4',
            color: '#166534',
            border: '1px solid #bbf7d0',
          }}
        >
          <MapPin size={12} />
          <span>Field Capture</span>
        </span>
      );
    }

    if (src.includes('MANUAL')) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 7px',
            borderRadius: 'var(--radius-md)',
            fontSize: '11px',
            fontWeight: 600,
            backgroundColor: '#f3f4f6',
            color: '#4b5563',
            border: '1px solid #e5e7eb',
          }}
        >
          <Clock size={12} />
          <span>Manual Entry</span>
        </span>
      );
    }

    return <span style={{ color: 'hsl(var(--text-muted))' }}>—</span>;
  };

  const renderGeolocation = (rec: AttendanceRecord) => {
    const lat = parseSafeNumber(rec.checkInLatitude);
    const lng = parseSafeNumber(rec.checkInLongitude);
    const hasGps = lat !== null && lng !== null;

    if (hasGps) {
      return (
        <a
          href={`https://www.google.com/maps?q=${lat},${lng}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            color: 'hsl(var(--primary-color))',
            textDecoration: 'none',
            fontSize: '11px',
            fontWeight: 600,
            padding: '2px 6px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'hsl(var(--primary-color) / 0.08)',
            border: '1px solid hsl(var(--primary-color) / 0.2)',
            transition: 'all var(--transition-fast)',
          }}
          title={`GPS Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)} (Click to view in Google Maps)`}
        >
          <MapPin size={12} />
          <span>
            {lat.toFixed(4)}, {lng.toFixed(4)}
          </span>
        </a>
      );
    }

    if (rec.siteName || rec.companyName) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            color: 'hsl(var(--text-secondary))',
            fontSize: '11px',
          }}
        >
          <MapPin size={12} style={{ color: 'hsl(var(--text-muted))' }} />
          <span>{rec.siteName || rec.companyName}</span>
        </span>
      );
    }

    return <span style={{ color: 'hsl(var(--text-muted))' }}>—</span>;
  };

  const activeRangeInfo = getDateRange(selectedRange);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* 1. Top 4 Summary KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-3)',
        }}
      >
        {/* Total Worked Hours */}
        <Card variant="subtle" style={{ backgroundColor: 'hsl(var(--bg-surface))' }}>
          <CardContent style={{ padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'hsl(var(--text-muted))',
                  fontWeight: 600,
                }}
              >
                Total Worked Hours
              </span>
              <Clock size={16} style={{ color: 'hsl(var(--primary-color))' }} />
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 800,
                color: 'hsl(var(--text-primary))',
                marginTop: 'var(--space-2)',
              }}
            >
              {summaryKpis.totalWorkedHours.toFixed(1)} hrs
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'hsl(var(--text-muted))',
                marginTop: 'var(--space-1)',
              }}
            >
              {activeRangeInfo.label}
            </div>
          </CardContent>
        </Card>

        {/* Present Days */}
        <Card variant="subtle" style={{ backgroundColor: 'hsl(var(--bg-surface))' }}>
          <CardContent style={{ padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'hsl(var(--text-muted))',
                  fontWeight: 600,
                }}
              >
                Present Days
              </span>
              <CheckCircle2 size={16} style={{ color: '#16a34a' }} />
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 800,
                color: '#16a34a',
                marginTop: 'var(--space-2)',
              }}
            >
              {summaryKpis.presentDays}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'hsl(var(--text-muted))',
                marginTop: 'var(--space-1)',
              }}
            >
              Full shift completions
            </div>
          </CardContent>
        </Card>

        {/* Half Days / Late */}
        <Card variant="subtle" style={{ backgroundColor: 'hsl(var(--bg-surface))' }}>
          <CardContent style={{ padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'hsl(var(--text-muted))',
                  fontWeight: 600,
                }}
              >
                Half Days / Late
              </span>
              <AlertTriangle size={16} style={{ color: '#d97706' }} />
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 800,
                color: '#d97706',
                marginTop: 'var(--space-2)',
              }}
            >
              {summaryKpis.halfDaysOrLate}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'hsl(var(--text-muted))',
                marginTop: 'var(--space-1)',
              }}
            >
              Partial or delayed shifts
            </div>
          </CardContent>
        </Card>

        {/* Absent / Leave Days */}
        <Card variant="subtle" style={{ backgroundColor: 'hsl(var(--bg-surface))' }}>
          <CardContent style={{ padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'hsl(var(--text-muted))',
                  fontWeight: 600,
                }}
              >
                Absent / Leave Days
              </span>
              <Calendar size={16} style={{ color: '#dc2626' }} />
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 800,
                color: '#dc2626',
                marginTop: 'var(--space-2)',
              }}
            >
              {summaryKpis.absentOrLeaveDays}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'hsl(var(--text-muted))',
                marginTop: 'var(--space-1)',
              }}
            >
              {summaryKpis.onLeaveCount > 0
                ? `${summaryKpis.onLeaveCount} on approved leave`
                : 'Recorded non-attendance days'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Attendance Timecard Section */}
      <Card variant="subtle">
        <CardContent style={{ padding: 'var(--space-5)' }}>
          {/* Header & Controls */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 'var(--space-3)',
              marginBottom: 'var(--space-4)',
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 700,
                  color: 'hsl(var(--text-primary))',
                  margin: 0,
                }}
              >
                Attendance &amp; Timecard Log
              </h3>
              <p
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'hsl(var(--text-muted))',
                  margin: 'var(--space-1) 0 0 0',
                }}
              >
                Daily shift punches, check-in/out timestamps, verification source, and GPS location.
              </p>
            </div>

            {/* Right Controls: Date Range Quick Filters & Refresh */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              {/* Quick Filter Pill Buttons */}
              <div
                style={{
                  display: 'inline-flex',
                  backgroundColor: 'hsl(var(--bg-secondary))',
                  borderRadius: 'var(--radius-lg)',
                  padding: '2px',
                  border: '1px solid hsl(var(--border-subtle))',
                }}
              >
                {(
                  [
                    { id: '30_DAYS', label: 'Last 30 Days' },
                    { id: 'THIS_MONTH', label: 'This Month' },
                    { id: 'PREV_MONTH', label: 'Prev Month' },
                  ] as const
                ).map((opt) => {
                  const isActive = selectedRange === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedRange(opt.id)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '11px',
                        fontWeight: isActive ? 700 : 500,
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: isActive ? 'hsl(var(--bg-surface))' : 'transparent',
                        color: isActive ? 'hsl(var(--text-primary))' : 'hsl(var(--text-secondary))',
                        boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* Refresh Button */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => void fetchAttendance()}
                disabled={isLoading}
                title="Refresh attendance records"
              >
                <RefreshCw
                  size={14}
                  style={{
                    marginRight: 'var(--space-1)',
                    animation: isLoading ? 'spin 1s linear infinite' : 'none',
                  }}
                />
                Refresh
              </Button>
            </div>
          </div>

          {/* Body: Loading / Error / Empty / Table */}
          {isLoading ? (
            <div
              style={{
                padding: 'var(--space-12)',
                textAlign: 'center',
                color: 'hsl(var(--text-muted))',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              <RefreshCw
                size={20}
                style={{
                  display: 'block',
                  margin: '0 auto var(--space-2)',
                  animation: 'spin 1s linear infinite',
                }}
              />
              Loading attendance records...
            </div>
          ) : error ? (
            <div
              style={{
                padding: 'var(--space-8)',
                textAlign: 'center',
                color: 'hsl(var(--color-danger))',
                fontSize: 'var(--font-size-sm)',
                backgroundColor: 'hsl(var(--color-danger) / 0.05)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid hsl(var(--color-danger) / 0.2)',
              }}
            >
              <p style={{ margin: '0 0 var(--space-3) 0', fontWeight: 600 }}>{error}</p>
              <Button size="sm" variant="outline" onClick={() => void fetchAttendance()}>
                Retry
              </Button>
            </div>
          ) : records.length === 0 ? (
            <div
              style={{
                padding: 'var(--space-12)',
                textAlign: 'center',
                color: 'hsl(var(--text-muted))',
                fontSize: 'var(--font-size-sm)',
                backgroundColor: 'hsl(var(--bg-secondary) / 0.3)',
                borderRadius: 'var(--radius-lg)',
                border: '1px dashed hsl(var(--border-subtle))',
              }}
            >
              <Calendar size={28} style={{ margin: '0 auto var(--space-2)', opacity: 0.5 }} />
              <div style={{ fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>
                No punch records recorded in the past 30 days.
              </div>
              <p style={{ margin: 'var(--space-1) 0 0', fontSize: 'var(--font-size-xs)' }}>
                Punch in via biometric scanners or employee self-service to track daily attendance.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  fontSize: 'var(--font-size-xs)',
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid hsl(var(--border-subtle))',
                      backgroundColor: 'hsl(var(--bg-secondary) / 0.6)',
                    }}
                  >
                    <th style={{ padding: 'var(--space-3) var(--space-3)', fontWeight: 700 }}>
                      Date
                    </th>
                    <th style={{ padding: 'var(--space-3) var(--space-3)', fontWeight: 700 }}>
                      Status
                    </th>
                    <th style={{ padding: 'var(--space-3) var(--space-3)', fontWeight: 700 }}>
                      Check-In
                    </th>
                    <th style={{ padding: 'var(--space-3) var(--space-3)', fontWeight: 700 }}>
                      Check-Out
                    </th>
                    <th style={{ padding: 'var(--space-3) var(--space-3)', fontWeight: 700 }}>
                      Worked Hours
                    </th>
                    <th style={{ padding: 'var(--space-3) var(--space-3)', fontWeight: 700 }}>
                      Source &amp; Verification
                    </th>
                    <th style={{ padding: 'var(--space-3) var(--space-3)', fontWeight: 700 }}>
                      GPS / Location
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec: AttendanceRecord, idx) => {
                    const checkInFmt = formatPunchTime(rec.checkInTime);
                    const checkOutFmt = formatPunchTime(rec.checkOutTime);
                    const isInProgress = Boolean(rec.checkInTime && !rec.checkOutTime);

                    return (
                      <tr
                        key={rec.id || `rec-${idx}`}
                        style={{
                          borderBottom: '1px solid hsl(var(--border-subtle))',
                          transition: 'background-color var(--transition-fast)',
                        }}
                      >
                        {/* Date */}
                        <td
                          style={{
                            padding: 'var(--space-3)',
                            fontWeight: 600,
                            color: 'hsl(var(--text-primary))',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {formatPunchDate(rec.attendanceDate || rec.date || rec.checkInTime)}
                        </td>

                        {/* Status Badge */}
                        <td style={{ padding: 'var(--space-3)' }}>
                          {renderStatusBadge(rec.status)}
                        </td>

                        {/* Check-In */}
                        <td
                          style={{
                            padding: 'var(--space-3)',
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            fontWeight: checkInFmt ? 600 : 400,
                            color: checkInFmt
                              ? 'hsl(var(--text-primary))'
                              : 'hsl(var(--text-muted))',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {checkInFmt || '—'}
                        </td>

                        {/* Check-Out */}
                        <td
                          style={{
                            padding: 'var(--space-3)',
                            fontFamily: isInProgress ? 'inherit' : 'monospace',
                            fontSize: isInProgress ? '11px' : '12px',
                            fontWeight: checkOutFmt ? 600 : 400,
                            color: checkOutFmt
                              ? 'hsl(var(--text-primary))'
                              : 'hsl(var(--text-muted))',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {checkOutFmt ? (
                            checkOutFmt
                          ) : isInProgress ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                padding: '2px 6px',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '10px',
                                fontWeight: 700,
                                backgroundColor: '#fef3c7',
                                color: '#b45309',
                                border: '1px solid #fde68a',
                              }}
                            >
                              <span
                                style={{
                                  width: '5px',
                                  height: '5px',
                                  borderRadius: '50%',
                                  backgroundColor: '#f59e0b',
                                  animation: 'pulse 1.5s infinite',
                                }}
                              />
                              In Progress
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>

                        {/* Duration / Worked Hours */}
                        <td
                          style={{
                            padding: 'var(--space-3)',
                            fontWeight: 700,
                            color: 'hsl(var(--text-primary))',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {formatWorkedDuration(rec)}
                        </td>

                        {/* Source & Verification */}
                        <td style={{ padding: 'var(--space-3)' }}>{renderSourceBadge(rec)}</td>

                        {/* GPS / Location */}
                        <td style={{ padding: 'var(--space-3)', whiteSpace: 'nowrap' }}>
                          {renderGeolocation(rec)}
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
