'use client';

import { Card, CardContent } from '@/components/atoms/card';
import type { AttendanceDailySummary } from '../types/attendance.types';

interface AttendanceStatsCardsProps {
  summary: AttendanceDailySummary | null;
}

export function AttendanceStatsCards({ summary }: AttendanceStatsCardsProps) {
  const stats = [
    {
      label: 'Present Today',
      value: summary?.totalPresent ?? 0,
      subtext: `Out of ${summary?.totalExpected ?? 0} scheduled`,
      color: 'var(--color-success)',
    },
    {
      label: 'Late Arrivals',
      value: summary?.totalLate ?? 0,
      subtext: 'Exceeded shift grace period',
      color: 'var(--color-warning)',
    },
    {
      label: 'Absent / On Leave',
      value: (summary?.totalAbsent ?? 0) + (summary?.onLeave ?? 0),
      subtext: `${summary?.onLeave ?? 0} approved leaves`,
      color: 'var(--color-danger)',
    },
    {
      label: 'Geofence Verified',
      value: `${summary?.geofenceCompliancePercentage ?? 100}%`,
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
