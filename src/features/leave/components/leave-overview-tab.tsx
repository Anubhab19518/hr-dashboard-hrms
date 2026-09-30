'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/atoms/card';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import { Clock, Calendar, CheckCircle2, Users, ChevronRight, Eye } from '@/components/atoms/icons';
import {
  LeaveStatus,
  type LeaveApplication,
  type LeaveType,
  type LeaveBalance,
} from '../types/leave.types';

interface LeaveOverviewTabProps {
  applications: LeaveApplication[];
  leaveTypes: LeaveType[];
  balances?: LeaveBalance[];
  onSelectApplication: (app: LeaveApplication) => void;
  onNavigateTab: (tabId: string) => void;
  onApproveQuick: (app: LeaveApplication) => void;
  onRejectQuick: (app: LeaveApplication) => void;
}

export function LeaveOverviewTab({
  applications,
  leaveTypes,
  onSelectApplication,
  onNavigateTab,
  onApproveQuick,
  onRejectQuick,
}: LeaveOverviewTabProps) {
  const todayStr = new Date().toISOString().split('T')[0] || '';

  const pendingApps = useMemo(
    () => applications.filter((a) => a.status === LeaveStatus.PENDING),
    [applications],
  );

  const onLeaveToday = useMemo(
    () =>
      applications.filter(
        (a) =>
          a.status === LeaveStatus.APPROVED &&
          Boolean(todayStr) &&
          a.fromDate <= todayStr &&
          a.toDate >= todayStr,
      ),
    [applications, todayStr],
  );

  const upcomingLeaves = useMemo(
    () =>
      applications
        .filter(
          (a) => a.status === LeaveStatus.APPROVED && Boolean(todayStr) && a.fromDate > todayStr,
        )
        .slice(0, 5),
    [applications, todayStr],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* 1. Stat Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        <Card variant="subtle">
          <CardContent style={{ padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'hsl(var(--text-muted))',
                }}
              >
                Pending Approvals
              </span>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'hsl(var(--color-warning) / 0.15)',
                  color: 'hsl(var(--color-warning))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Clock size={16} />
              </div>
            </div>
            <div
              style={{
                marginTop: 'var(--space-2)',
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 800,
                color: 'hsl(var(--text-primary))',
              }}
            >
              {pendingApps.length}
            </div>
            <div
              style={{ fontSize: '11px', color: 'hsl(var(--text-secondary))', marginTop: '2px' }}
            >
              Requires manager / HR review
            </div>
          </CardContent>
        </Card>

        <Card variant="subtle">
          <CardContent style={{ padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'hsl(var(--text-muted))',
                }}
              >
                On Leave Today
              </span>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'hsl(var(--primary-color) / 0.15)',
                  color: 'hsl(var(--primary-color))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Users size={16} />
              </div>
            </div>
            <div
              style={{
                marginTop: 'var(--space-2)',
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 800,
                color: 'hsl(var(--primary-color))',
              }}
            >
              {onLeaveToday.length}
            </div>
            <div
              style={{ fontSize: '11px', color: 'hsl(var(--text-secondary))', marginTop: '2px' }}
            >
              Employees currently off duty
            </div>
          </CardContent>
        </Card>

        <Card variant="subtle">
          <CardContent style={{ padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'hsl(var(--text-muted))',
                }}
              >
                Upcoming Leaves
              </span>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'hsl(var(--color-success) / 0.15)',
                  color: 'hsl(var(--color-success))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Calendar size={16} />
              </div>
            </div>
            <div
              style={{
                marginTop: 'var(--space-2)',
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 800,
                color: 'hsl(var(--text-primary))',
              }}
            >
              {upcomingLeaves.length}
            </div>
            <div
              style={{ fontSize: '11px', color: 'hsl(var(--text-secondary))', marginTop: '2px' }}
            >
              Approved future leave bookings
            </div>
          </CardContent>
        </Card>

        <Card variant="subtle">
          <CardContent style={{ padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'hsl(var(--text-muted))',
                }}
              >
                Active Leave Types
              </span>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'hsl(var(--color-brand-accent) / 0.15)',
                  color: 'hsl(var(--color-brand-accent))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div
              style={{
                marginTop: 'var(--space-2)',
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 800,
                color: 'hsl(var(--text-primary))',
              }}
            >
              {leaveTypes.filter((t) => t.isActive).length}
            </div>
            <div
              style={{ fontSize: '11px', color: 'hsl(var(--text-secondary))', marginTop: '2px' }}
            >
              Configured workforce policies
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Pending Approval Queue Quick Widget */}
      <div
        style={{
          backgroundColor: 'hsl(var(--bg-surface))',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid hsl(var(--border-subtle))',
          padding: 'var(--space-5)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
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
              Pending Approvals Queue ({pendingApps.length})
            </h3>
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'hsl(var(--text-secondary))',
                margin: '2px 0 0 0',
              }}
            >
              Leave applications awaiting manager or HR confirmation
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={() => onNavigateTab('approvals')}>
            View Full Queue
            <ChevronRight size={14} style={{ marginLeft: '4px' }} />
          </Button>
        </div>

        {pendingApps.length === 0 ? (
          <div
            style={{
              padding: 'var(--space-6)',
              textAlign: 'center',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed hsl(var(--border-subtle))',
              backgroundColor: 'hsl(var(--bg-secondary) / 0.3)',
              fontSize: 'var(--font-size-xs)',
              color: 'hsl(var(--text-muted))',
            }}
          >
            No pending leave applications. The queue is up to date!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {pendingApps.slice(0, 4).map((app) => (
              <div
                key={app.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid hsl(var(--border-subtle))',
                  backgroundColor: 'hsl(var(--bg-secondary) / 0.4)',
                  flexWrap: 'wrap',
                  gap: 'var(--space-3)',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 'var(--font-size-sm)',
                        color: 'hsl(var(--text-primary))',
                      }}
                    >
                      {app.employeeName || 'Employee'}
                    </span>
                    {app.employeeCode && (
                      <span
                        style={{
                          fontSize: '11px',
                          color: 'hsl(var(--text-muted))',
                          backgroundColor: 'hsl(var(--bg-surface))',
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid hsl(var(--border-subtle))',
                        }}
                      >
                        {app.employeeCode}
                      </span>
                    )}
                    <Badge variant="primary">
                      {app.leaveTypeName || app.leaveTypeCode || 'Leave'}
                    </Badge>
                    <Badge variant="warning">
                      {app.appliedDays} {app.appliedDays === 1 ? 'Day' : 'Days'}
                    </Badge>
                  </div>

                  {/* Company, Department, and Job Role Badges */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      flexWrap: 'wrap',
                      marginTop: '4px',
                      fontSize: '11px',
                      color: 'hsl(var(--text-secondary))',
                    }}
                  >
                    {app.companyName && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: 600,
                          color: 'hsl(var(--text-primary))',
                        }}
                      >
                        🏢 {app.companyName}
                      </span>
                    )}
                    {app.departmentName && (
                      <span>
                        • Dept: <strong>{app.departmentName}</strong>
                      </span>
                    )}
                    {app.jobRoleName && (
                      <span>
                        • Role: <strong>{app.jobRoleName}</strong>
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: '11px',
                      color: 'hsl(var(--text-muted))',
                      marginTop: '3px',
                    }}
                  >
                    {app.fromDate} &rarr; {app.toDate} • Reason: &ldquo;{app.reason || 'Personal'}
                    &rdquo;
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Button variant="outline" size="sm" onClick={() => onSelectApplication(app)}>
                    <Eye size={13} style={{ marginRight: '4px' }} />
                    Details
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => onRejectQuick(app)}>
                    Reject
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => onApproveQuick(app)}>
                    Approve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Bottom Grid: On Leave Today & Upcoming Leaves */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        {/* On Leave Today */}
        <div
          style={{
            backgroundColor: 'hsl(var(--bg-surface))',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid hsl(var(--border-subtle))',
            padding: 'var(--space-5)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h4
            style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 700,
              color: 'hsl(var(--text-primary))',
              margin: '0 0 var(--space-3) 0',
            }}
          >
            Employees on Leave Today ({onLeaveToday.length})
          </h4>

          {onLeaveToday.length === 0 ? (
            <div
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'hsl(var(--text-muted))',
                padding: 'var(--space-4) 0',
              }}
            >
              No employees are on scheduled leave today.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {onLeaveToday.map((app) => (
                <div
                  key={app.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'hsl(var(--bg-secondary) / 0.4)',
                    fontSize: 'var(--font-size-xs)',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, color: 'hsl(var(--text-primary))' }}>
                      {app.employeeName || 'Employee'}
                    </span>
                    <div
                      style={{
                        fontSize: '10px',
                        color: 'hsl(var(--text-muted))',
                        marginTop: '1px',
                      }}
                    >
                      {app.companyName && <span>{app.companyName}</span>}
                      {app.companyName && (app.departmentName || app.jobRoleName) && (
                        <span> • </span>
                      )}
                      {app.jobRoleName || app.departmentName}
                    </div>
                  </div>
                  <Badge variant="success">{app.leaveTypeName || 'Leave'}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Leaves */}
        <div
          style={{
            backgroundColor: 'hsl(var(--bg-surface))',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid hsl(var(--border-subtle))',
            padding: 'var(--space-5)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h4
            style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 700,
              color: 'hsl(var(--text-primary))',
              margin: '0 0 var(--space-3) 0',
            }}
          >
            Upcoming Approved Leaves ({upcomingLeaves.length})
          </h4>

          {upcomingLeaves.length === 0 ? (
            <div
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'hsl(var(--text-muted))',
                padding: 'var(--space-4) 0',
              }}
            >
              No upcoming approved leaves scheduled.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {upcomingLeaves.map((app) => (
                <div
                  key={app.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'hsl(var(--bg-secondary) / 0.4)',
                    fontSize: 'var(--font-size-xs)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: 'hsl(var(--text-primary))' }}>
                      {app.employeeName || 'Employee'}
                    </div>
                    <div
                      style={{
                        fontSize: '10px',
                        color: 'hsl(var(--text-muted))',
                        marginTop: '1px',
                      }}
                    >
                      {app.companyName && <span>{app.companyName} • </span>}
                      {app.jobRoleName || app.departmentName
                        ? `${app.jobRoleName || app.departmentName} • `
                        : ''}
                      {app.fromDate} ({app.appliedDays} days)
                    </div>
                  </div>
                  <Badge variant="outline">{app.leaveTypeName || 'Leave'}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
