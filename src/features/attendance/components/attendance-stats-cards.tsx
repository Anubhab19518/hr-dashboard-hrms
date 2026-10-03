'use client';

import { Card, CardContent } from '@/components/atoms/card';
import type { AttendanceDailySummary, AttendanceLog } from '../types/attendance.types';

interface AttendanceStatsCardsProps {
  summary: AttendanceDailySummary | null;
  logs?: readonly AttendanceLog[];
}

export function AttendanceStatsCards({ summary, logs = [] }: AttendanceStatsCardsProps) {
  // Derive live real-time counts from current punch logs as intelligent fallback
  const derivedPresent = logs.filter(
    (l) =>
      l.status === 'PRESENT' ||
      l.status === 'LATE' ||
      l.status === 'HALF_DAY' ||
      l.status === 'OVERTIME' ||
      Boolean(l.checkInTime) ||
      l.logType === 'CHECK_IN',
  ).length;

  const derivedLate = logs.filter((l) => l.status === 'LATE').length;
  const derivedAbsent = logs.filter((l) => l.status === 'ABSENT').length;
  const derivedOnLeave = logs.filter((l) => l.status === 'ON_LEAVE').length;

  const totalLogs = logs.length;
  const inBoundsCount = logs.filter((l) => l.isWithinGeofence !== false).length;
  const derivedGeofence = totalLogs > 0 ? Math.round((inBoundsCount / totalLogs) * 100) : 100;

  // Resolve values prioritizing backend summary while falling back to live logs aggregation
  const presentValue =
    summary?.totalPresent ??
    summary?.present ??
    summary?.presentCount ??
    (derivedPresent > 0 ? derivedPresent : 0);

  const expectedValue =
    summary?.totalExpected ??
    summary?.expected ??
    summary?.totalEmployees ??
    summary?.totalScheduled ??
    (totalLogs > 0 ? totalLogs : presentValue);

  const lateValue = summary?.totalLate ?? summary?.late ?? summary?.lateCount ?? derivedLate;

  const absentValue =
    summary?.totalAbsent ?? summary?.absent ?? summary?.absentCount ?? derivedAbsent;

  const onLeaveValue =
    summary?.onLeave ?? summary?.leave ?? summary?.onLeaveCount ?? derivedOnLeave;

  const geofenceValue =
    summary?.geofenceCompliancePercentage ??
    summary?.compliance ??
    summary?.geofenceCompliance ??
    derivedGeofence;

  const stats = [
    {
      label: 'Present Today',
      value: presentValue,
      subtext: `Out of ${expectedValue} scheduled`,
      color: 'var(--color-success)',
    },
    {
      label: 'Late Arrivals',
      value: lateValue,
      subtext: 'Exceeded shift grace period',
      color: 'var(--color-warning)',
    },
    {
      label: 'Absent / On Leave',
      value: absentValue + onLeaveValue,
      subtext: `${onLeaveValue} approved leaves`,
      color: 'var(--color-danger)',
    },
    {
      label: 'Geofence Verified',
      value: `${geofenceValue}%`,
      subtext: 'Within designated site boundaries',
      color: 'var(--primary-color)',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-6)',
      }}
    >
      {stats.map((item) => (
        <Card
          key={item.label}
          variant="subtle"
          style={{ position: 'relative', overflow: 'hidden' }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '4px',
              height: '100%',
              backgroundColor: `hsl(${item.color})`,
            }}
          />
          <CardContent style={{ padding: 'var(--space-4)' }}>
            <div
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'hsl(var(--text-secondary))',
                marginBottom: 'var(--space-1)',
              }}
            >
              {item.label}
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-3xl)',
                fontWeight: 800,
                color: 'hsl(var(--text-primary))',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              {item.value}
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'hsl(var(--text-muted))',
                marginTop: 'var(--space-1)',
              }}
            >
              {item.subtext}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
