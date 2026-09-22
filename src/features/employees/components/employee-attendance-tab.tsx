'use client';

import { useState, useEffect, useCallback } from 'react';
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
} from '@/components/atoms/icons';
import { EmployeeService } from '../services/employee.service';
import type { AttendanceHistoryResponse, AttendanceRecord } from '../types/employee.types';

interface EmployeeAttendanceTabProps {
  employeeId: string;
}

export function EmployeeAttendanceTab({ employeeId }: EmployeeAttendanceTabProps) {
  const [history, setHistory] = useState<AttendanceHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await EmployeeService.getMyAttendanceHistory({ page: 1, limit: 30 });
      setHistory(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch attendance records';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PRESENT':
        return <Badge variant="success">Present</Badge>;
      case 'HALF_DAY':
        return <Badge variant="warning">Half Day</Badge>;
      case 'LATE':
        return <Badge variant="warning">Late In</Badge>;
      case 'ABSENT':
        return <Badge variant="destructive">Absent</Badge>;
      case 'ON_LEAVE':
        return <Badge variant="outline">On Leave</Badge>;
      default:
        return <Badge variant="secondary">{status || '—'}</Badge>;
    }
  };

  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return '—';
    try {
      const d = new Date(timeStr);
      return isNaN(d.getTime())
        ? timeStr
        : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeStr;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Overview Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--space-3)',
        }}
      >
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
              {history?.totalWorkedHours ?? 0} hrs
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'hsl(var(--text-muted))',
                marginTop: 'var(--space-1)',
              }}
            >
              Last 30 Calendar Days
            </div>
          </CardContent>
        </Card>

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
              <CheckCircle2 size={16} style={{ color: 'hsl(var(--color-success))' }} />
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 800,
                color: 'hsl(var(--color-success))',
                marginTop: 'var(--space-2)',
              }}
            >
              {history?.presentDays ?? 0}
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
              <AlertTriangle size={16} style={{ color: 'hsl(var(--color-warning))' }} />
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 800,
                color: 'hsl(var(--color-warning))',
                marginTop: 'var(--space-2)',
              }}
            >
              {history?.halfDays ?? 0}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'hsl(var(--text-muted))',
                marginTop: 'var(--space-1)',
              }}
            >
              Partial attendances
            </div>
          </CardContent>
        </Card>

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
              <Clock size={16} style={{ color: 'hsl(var(--text-muted))' }} />
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 800,
                color: 'hsl(var(--text-secondary))',
                marginTop: 'var(--space-2)',
              }}
            >
              {(history?.absentDays ?? 0) + (history?.onLeaveDays ?? 0)}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'hsl(var(--text-muted))',
                marginTop: 'var(--space-1)',
              }}
            >
              {history?.onLeaveDays ?? 0} on approved leave
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Records Table */}
      <Card variant="subtle">
        <CardContent style={{ padding: 'var(--space-5)' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
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
                30-Day Attendance Timecard
              </h3>
              <p
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'hsl(var(--text-muted))',
                  margin: 'var(--space-1) 0 0 0',
                }}
              >
                Verified biometric punches, GPS coordinates, and shift durations for Employee ID:{' '}
                {employeeId}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void fetchHistory()}
              disabled={isLoading}
            >
              <RefreshCw size={14} style={{ marginRight: 'var(--space-1)' }} />
              Refresh
            </Button>
          </div>

          {isLoading ? (
            <div
              style={{
                padding: 'var(--space-8)',
                textAlign: 'center',
                color: 'hsl(var(--text-muted))',
              }}
            >
              Loading attendance history...
            </div>
          ) : error ? (
            <div
              style={{
                padding: 'var(--space-6)',
                textAlign: 'center',
                color: 'hsl(var(--color-danger))',
              }}
            >
              {error}
            </div>
          ) : !history?.records || history.records.length === 0 ? (
            <div
              style={{
                padding: 'var(--space-8)',
                textAlign: 'center',
                color: 'hsl(var(--text-muted))',
              }}
            >
              No punch records recorded in the past 30 days.
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
                      backgroundColor: 'hsl(var(--bg-secondary) / 0.5)',
                    }}
                  >
                    <th style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 600 }}>
                      Date
                    </th>
                    <th style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 600 }}>
                      Status
                    </th>
                    <th style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 600 }}>
                      Check In
                    </th>
                    <th style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 600 }}>
                      Check Out
                    </th>
                    <th style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 600 }}>
                      Hours
                    </th>
                    <th style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 600 }}>
                      Verification
                    </th>
                    <th style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 600 }}>
                      Site / Location
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.records.map((rec: AttendanceRecord) => (
                    <tr
                      key={rec.id || rec.date}
                      style={{ borderBottom: '1px solid hsl(var(--border-subtle))' }}
                    >
                      <td style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 600 }}>
                        {new Date(rec.date).toLocaleDateString()}
                      </td>
                      <td style={{ padding: 'var(--space-2) var(--space-3)' }}>
                        {getStatusBadge(rec.status)}
                      </td>
                      <td
                        style={{
                          padding: 'var(--space-2) var(--space-3)',
                          fontFamily: 'monospace',
                        }}
                      >
                        {formatTime(rec.checkInTime)}
                      </td>
                      <td
                        style={{
                          padding: 'var(--space-2) var(--space-3)',
                          fontFamily: 'monospace',
                        }}
                      >
                        {formatTime(rec.checkOutTime)}
                      </td>
                      <td style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 600 }}>
                        {rec.hoursWorked ? `${rec.hoursWorked.toFixed(1)}h` : '—'}
                      </td>
                      <td style={{ padding: 'var(--space-2) var(--space-3)' }}>
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}
                        >
                          {rec.verificationMethod?.toUpperCase().includes('FACE') && (
                            <Badge variant="primary">
                              <Camera size={10} style={{ marginRight: '2px' }} /> Face ID
                            </Badge>
                          )}
                          {rec.verificationMethod?.toUpperCase().includes('GPS') && (
                            <Badge variant="outline">
                              <MapPin size={10} style={{ marginRight: '2px' }} /> GPS
                            </Badge>
                          )}
                          {!rec.verificationMethod && '—'}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: 'var(--space-2) var(--space-3)',
                          color: 'hsl(var(--text-secondary))',
                        }}
                      >
                        {rec.siteName || rec.companyName || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
