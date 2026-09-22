'use client';

import { Badge } from '@/components/atoms/badge';
import { Card, CardContent } from '@/components/atoms/card';
import { EmptyState } from '@/components/molecules/empty-state';
import { CheckCircle2, AlertTriangle } from '@/components/atoms/icons';
import type {
  AttendanceLog,
  AttendanceStatus,
  VerificationMethod,
} from '../types/attendance.types';

interface AttendanceLogTableProps {
  logs: readonly AttendanceLog[];
  isLoading?: boolean;
}

export function AttendanceLogTable({ logs, isLoading }: AttendanceLogTableProps) {
  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'PRESENT':
        return <Badge variant="success">Present</Badge>;
      case 'LATE':
        return <Badge variant="warning">Late Arrival</Badge>;
      case 'HALF_DAY':
        return <Badge variant="secondary">Half Day</Badge>;
      case 'OVERTIME':
        return <Badge variant="primary">Overtime</Badge>;
      case 'EARLY_EXIT':
        return <Badge variant="destructive">Early Exit</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMethodBadge = (method: VerificationMethod) => {
    switch (method) {
      case 'FACE':
        return <Badge variant="primary">Face ID</Badge>;
      case 'GPS':
        return <Badge variant="secondary">GPS</Badge>;
      case 'QR':
        return <Badge variant="outline">QR Kiosk</Badge>;
      case 'BLE':
        return <Badge variant="outline">Bluetooth</Badge>;
      case 'MANUAL':
        return <Badge variant="outline">Manual HR</Badge>;
      default:
        return <Badge variant="outline">{method}</Badge>;
    }
  };

  if (logs.length === 0 && !isLoading) {
    return (
      <Card variant="subtle">
        <CardContent style={{ padding: 'var(--space-8)' }}>
          <EmptyState
            title="No attendance punches found"
            description="No check-in or check-out logs match the selected date and filters."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="subtle" style={{ overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: '1px solid hsl(var(--border-subtle))',
                backgroundColor: 'hsl(var(--bg-secondary) / 0.5)',
              }}
            >
              <th
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  fontWeight: 600,
                  color: 'hsl(var(--text-secondary))',
                }}
              >
                Employee
              </th>
              <th
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  fontWeight: 600,
                  color: 'hsl(var(--text-secondary))',
                }}
              >
                Event / Type
              </th>
              <th
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  fontWeight: 600,
                  color: 'hsl(var(--text-secondary))',
                }}
              >
                Timestamp
              </th>
              <th
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  fontWeight: 600,
                  color: 'hsl(var(--text-secondary))',
                }}
              >
                Site / Location
              </th>
              <th
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  fontWeight: 600,
                  color: 'hsl(var(--text-secondary))',
                }}
              >
                Verification
              </th>
              <th
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  fontWeight: 600,
                  color: 'hsl(var(--text-secondary))',
                }}
              >
                Geofence
              </th>
              <th
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  fontWeight: 600,
                  color: 'hsl(var(--text-secondary))',
                }}
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr
                key={log.id}
                style={{
                  borderBottom: '1px solid hsl(var(--border-subtle))',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = 'hsl(var(--bg-secondary) / 0.4)')
                }
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <div style={{ fontWeight: 600, color: 'hsl(var(--text-primary))' }}>
                    {log.employeeName || `Employee #${log.employeeId.slice(0, 8)}`}
                  </div>
                  {log.employeeCode && (
                    <div
                      style={{
                        fontFamily: 'monospace',
                        fontSize: 'var(--font-size-xs)',
                        color: 'hsl(var(--text-muted))',
                      }}
                    >
                      {log.employeeCode}
                    </div>
                  )}
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 'var(--space-1)',
                      fontWeight: 600,
                      color:
                        log.logType === 'CHECK_IN'
                          ? 'hsl(var(--color-success))'
                          : 'hsl(var(--primary-color))',
                    }}
                  >
                    {log.logType === 'CHECK_IN' ? '🟢 Check In' : '🔴 Check Out'}
                  </span>
                </td>
                <td
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    color: 'hsl(var(--text-primary))',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {log.timestamp
                    ? new Date(log.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })
                    : '—'}
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}>
                    {log.timestamp ? new Date(log.timestamp).toLocaleDateString() : ''}
                  </div>
                </td>
                <td
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    color: 'hsl(var(--text-secondary))',
                  }}
                >
                  {log.siteName || log.siteId || 'Global / Remote'}
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  {getMethodBadge(log.verificationMethod)}
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  {log.isWithinGeofence !== undefined ? (
                    log.isWithinGeofence ? (
                      <span
                        style={{
                          color: 'hsl(var(--color-success))',
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <CheckCircle2 size={13} strokeWidth={2} />
                        In Bounds
                      </span>
                    ) : (
                      <span
                        style={{
                          color: 'hsl(var(--color-danger))',
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <AlertTriangle size={13} strokeWidth={2} />
                        Out of Bounds
                      </span>
                    )
                  ) : (
                    <span
                      style={{ color: 'hsl(var(--text-muted))', fontSize: 'var(--font-size-xs)' }}
                    >
                      —
                    </span>
                  )}
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  {getStatusBadge(log.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
