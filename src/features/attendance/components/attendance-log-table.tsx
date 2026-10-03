'use client';

import { Badge } from '@/components/atoms/badge';
import { Card, CardContent } from '@/components/atoms/card';
import { EmptyState } from '@/components/molecules/empty-state';
import { CheckCircle2, AlertTriangle, MapPin } from '@/components/atoms/icons';
import type { AttendanceLog, AttendanceStatus } from '../types/attendance.types';

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
      case 'ABSENT':
        return <Badge variant="destructive">Absent</Badge>;
      case 'ON_LEAVE':
        return <Badge variant="info">On Leave</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMethodBadge = (log: AttendanceLog) => {
    const method = log.source || log.verificationMethod;
    const faceScore = log.faceMatchScore ?? log.confidenceScore;

    if (
      method === 'FACE' ||
      method === 'KIOSK' ||
      (faceScore !== null && faceScore !== undefined)
    ) {
      const scoreText =
        faceScore !== null && faceScore !== undefined
          ? ` (${Math.round(faceScore > 1 ? faceScore : faceScore * 100)}%)`
          : '';
      return <Badge variant="primary">Face ID{scoreText}</Badge>;
    }
    if (method === 'GPS' || method === 'MOBILE_APP') {
      return <Badge variant="secondary">Mobile / GPS</Badge>;
    }
    if (method === 'QR') {
      return <Badge variant="outline">QR Kiosk</Badge>;
    }
    if (method === 'BLE') {
      return <Badge variant="outline">Bluetooth</Badge>;
    }
    if (method === 'MANUAL' || method === 'MANUAL_OVERRIDE') {
      return <Badge variant="outline">Manual HR</Badge>;
    }
    if (method === 'WEB_PORTAL') {
      return <Badge variant="outline">Web Portal</Badge>;
    }
    if (method) {
      return <Badge variant="outline">{method}</Badge>;
    }
    return (
      <span style={{ color: 'hsl(var(--text-muted))', fontSize: 'var(--font-size-xs)' }}>—</span>
    );
  };

  const formatTimeOnly = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateOnly = (dateStr?: string | null) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString();
    } catch {
      return dateStr;
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
            {logs.map((record) => {
              // 1. Employee Disambiguation Details
              const empDisplayName =
                record.employee?.name ||
                record.employeeName ||
                (record.employeeId ? `Employee #${record.employeeId.slice(0, 8)}` : 'Employee');
              const empCode = record.employee?.employeeCode || record.employeeCode;
              const companyName = record.employee?.company?.name || record.companyName;
              const jobRoleName = record.employee?.jobRole?.name || record.jobRoleName;

              // 2. Site / Location Details
              const primarySite =
                record.location?.siteName ||
                record.siteName ||
                (record.checkInLatitude || record.latitude ? 'GPS Captured' : 'Global / Remote');
              const subtitleAddress =
                record.location?.address ||
                record.siteAddress ||
                (record.location?.city && record.location?.state
                  ? `${record.location.city}, ${record.location.state}`
                  : null);

              // 3. Event / Type logic (Active Check-In vs Check-Out)
              const hasCheckOut = Boolean(record.checkOutTime || record.logType === 'CHECK_OUT');
              const hasCheckIn = Boolean(
                record.checkInTime || record.logType === 'CHECK_IN' || record.timestamp,
              );
              const isCheckInOnly =
                hasCheckIn && !record.checkOutTime && record.logType !== 'CHECK_OUT';

              // 4. Resolved Display Timestamp
              const primaryTimestamp =
                record.checkInTime ||
                record.checkOutTime ||
                record.timestamp ||
                record.createdAt ||
                record.attendanceDate;

              return (
                <tr
                  key={record.id}
                  style={{
                    borderBottom: '1px solid hsl(var(--border-subtle))',
                    transition: 'background-color var(--transition-fast)',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = 'hsl(var(--bg-secondary) / 0.4)')
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {/* 1. Employee Column */}
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600, color: 'hsl(var(--text-primary))' }}>
                        {empDisplayName}
                      </span>
                      <span
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'hsl(var(--text-muted))',
                          marginTop: 'var(--space-1)',
                        }}
                      >
                        {empCode && <span>{empCode}</span>}
                        {companyName && <span> • {companyName}</span>}
                        {jobRoleName && <span> ({jobRoleName})</span>}
                      </span>
                    </div>
                  </td>

                  {/* 2. Event / Type Column */}
                  <td style={{ padding: 'var(--space-3) var(--space-4)', whiteSpace: 'nowrap' }}>
                    {isCheckInOnly ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 'var(--space-1)',
                          fontWeight: 600,
                          color: 'hsl(var(--color-success))',
                        }}
                      >
                        ● Check In
                      </span>
                    ) : hasCheckOut ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 'var(--space-1)',
                          fontWeight: 600,
                          color: 'hsl(var(--text-secondary))',
                        }}
                      >
                        ● Check Out
                      </span>
                    ) : (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 'var(--space-1)',
                          fontWeight: 600,
                          color: 'hsl(var(--text-muted))',
                        }}
                      >
                        —
                      </span>
                    )}
                  </td>

                  {/* 3. Timestamp Column */}
                  <td
                    style={{
                      padding: 'var(--space-3) var(--space-4)',
                      color: 'hsl(var(--text-primary))',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <div>{formatTimeOnly(primaryTimestamp) || '—'}</div>
                    <div
                      style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}
                    >
                      {formatDateOnly(primaryTimestamp || record.attendanceDate)}
                    </div>
                  </td>

                  {/* 4. Site / Location Column */}
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '280px' }}>
                      <span
                        style={{
                          fontWeight: 500,
                          fontSize: 'var(--font-size-sm)',
                          color: 'hsl(var(--text-primary))',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-1)',
                        }}
                      >
                        <MapPin
                          size={13}
                          style={{ color: 'hsl(var(--text-muted))', flexShrink: 0 }}
                        />
                        <span
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {primarySite}
                        </span>
                      </span>
                      {subtitleAddress && (
                        <span
                          style={{
                            fontSize: 'var(--font-size-xs)',
                            color: 'hsl(var(--text-muted))',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            marginTop: 'var(--space-1)',
                          }}
                          title={subtitleAddress}
                        >
                          {subtitleAddress}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 5. Verification Column */}
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    {getMethodBadge(record)}
                  </td>

                  {/* 6. Geofence Column */}
                  <td style={{ padding: 'var(--space-3) var(--space-4)', whiteSpace: 'nowrap' }}>
                    {record.isWithinGeofence !== undefined ? (
                      record.isWithinGeofence ? (
                        <span
                          style={{
                            color: 'hsl(var(--color-success))',
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 'var(--space-1)',
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
                            gap: 'var(--space-1)',
                          }}
                        >
                          <AlertTriangle size={13} strokeWidth={2} />
                          Out of Bounds
                        </span>
                      )
                    ) : record.checkInLatitude || record.latitude ? (
                      <span
                        style={{
                          color: 'hsl(var(--color-info))',
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 'var(--space-1)',
                        }}
                      >
                        <CheckCircle2 size={13} strokeWidth={2} />
                        GPS Logged
                      </span>
                    ) : (
                      <span
                        style={{ color: 'hsl(var(--text-muted))', fontSize: 'var(--font-size-xs)' }}
                      >
                        —
                      </span>
                    )}
                  </td>

                  {/* 7. Status Column */}
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    {getStatusBadge(record.status)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
