'use client';

import { Card, CardContent } from '@/components/atoms/card';
import type { Employee } from '../types/employee.types';

interface EmployeeStatsRowProps {
  employees: readonly Employee[];
  totalCount?: number;
}

export function EmployeeStatsRow({ employees, totalCount }: EmployeeStatsRowProps) {
  const total = totalCount ?? employees.length;
  const activeCount = employees.filter((e) => e.status === 'ACTIVE').length;
  const probationCount = employees.filter((e) => e.status === 'PROBATION').length;
  const contractCount = employees.filter(
    (e) => e.employmentType === 'CONTRACTOR' || (e.employmentType as string) === 'CONTRACT',
  ).length;

  const stats = [
    {
      label: 'Total Workforce',
      value: total,
      subtext: 'Registered employees',
      color: 'var(--primary-color)',
    },
    {
      label: 'Active On Duty',
      value: activeCount,
      subtext: `${total > 0 ? Math.round((activeCount / total) * 100) : 0}% active rate`,
      color: 'var(--color-success)',
    },
    {
      label: 'On Probation',
      value: probationCount,
      subtext: 'Trial / probation period',
      color: 'var(--color-warning)',
    },
    {
      label: 'Contractors',
      value: contractCount,
      subtext: 'Temporary & contract staff',
      color: 'var(--color-info)',
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
      {stats.map((stat) => (
        <Card
          key={stat.label}
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
              backgroundColor: `hsl(${stat.color})`,
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
              {stat.label}
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
              {stat.value}
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'hsl(var(--text-muted))',
                marginTop: 'var(--space-1)',
              }}
            >
              {stat.subtext}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
