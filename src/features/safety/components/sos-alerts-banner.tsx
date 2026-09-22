'use client';

import { Button } from '@/components/atoms/button';
import { ShieldAlert, Check } from '@/components/atoms/icons';
import type { SOSAlert } from '../types/safety.types';

interface SOSAlertsBannerProps {
  alerts: readonly SOSAlert[];
  onResolve: (id: string) => void;
}

export function SOSAlertsBanner({ alerts, onResolve }: SOSAlertsBannerProps) {
  const activeAlerts = alerts.filter((a) => a.status === 'ACTIVE' || a.status === 'ACKNOWLEDGED');

  if (activeAlerts.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        marginBottom: 'var(--space-6)',
      }}
    >
      {activeAlerts.map((alert) => (
        <div
          key={alert.id}
          style={{
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'hsl(var(--color-danger) / 0.15)',
            border: '2px solid hsl(var(--color-danger))',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-4)',
            animation: 'pulse 2s infinite ease-in-out',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'hsl(var(--color-danger))',
                color: 'hsl(var(--text-inverse))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ShieldAlert size={22} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 800,
                  color: 'hsl(var(--color-danger))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                CRITICAL SOS PANIC ALERT ACTIVE
              </div>
              <div
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'hsl(var(--text-primary))',
                  marginTop: 'var(--space-1)',
                }}
              >
                Triggered by{' '}
                <strong>{alert.employeeName || `Employee #${alert.employeeId}`}</strong> (
                {alert.employeeCode || alert.employeeId.slice(0, 6)}) at GPS Coordinates:{' '}
                {alert.latitude.toFixed(5)}, {alert.longitude.toFixed(5)}
              </div>
              <div
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'hsl(var(--text-muted))',
                  marginTop: 'var(--space-1)',
                }}
              >
                Triggered at: {new Date(alert.triggeredAt).toLocaleTimeString()} (
                {new Date(alert.triggeredAt).toLocaleDateString()})
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onResolve(alert.id)}
              style={{
                backgroundColor: 'hsl(var(--color-danger))',
                borderColor: 'hsl(var(--color-danger))',
              }}
              leftIcon={<Check size={16} />}
            >
              Mark Resolved & Safe
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
