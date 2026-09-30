'use client';

import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import { Input } from '@/components/atoms/input';
import { Search, Eye, Clock } from '@/components/atoms/icons';
import { LeaveStatus, type LeaveApplication, type LeaveType } from '../types/leave.types';

interface LeaveApprovalsTabProps {
  applications: LeaveApplication[];
  total: number;
  page: number;
  limit: number;
  leaveTypes: LeaveType[];
  isLoading: boolean;
  statusFilter: string;
  leaveTypeFilter: string;
  searchQuery: string;
  fromDate: string;
  toDate: string;
  onStatusChange: (status: string) => void;
  onLeaveTypeChange: (typeId: string) => void;
  onSearchChange: (q: string) => void;
  onFromDateChange: (d: string) => void;
  onToDateChange: (d: string) => void;
  onPageChange: (p: number) => void;
  onSelectApplication: (app: LeaveApplication) => void;
  onApproveQuick: (app: LeaveApplication) => void;
  onRejectQuick: (app: LeaveApplication) => void;
  canApprove?: boolean;
}

export function LeaveApprovalsTab({
  applications,
  total,
  page,
  limit,
  leaveTypes,
  isLoading,
  statusFilter,
  leaveTypeFilter,
  searchQuery,
  fromDate,
  toDate,
  onStatusChange,
  onLeaveTypeChange,
  onSearchChange,
  onFromDateChange,
  onToDateChange,
  onPageChange,
  onSelectApplication,
  onApproveQuick,
  onRejectQuick,
  canApprove = true,
}: LeaveApprovalsTabProps) {
  const getStatusBadge = (status: LeaveStatus) => {
    switch (status) {
      case LeaveStatus.APPROVED:
        return <Badge variant="success">Approved</Badge>;
      case LeaveStatus.PENDING:
        return <Badge variant="warning">Pending Review</Badge>;
      case LeaveStatus.REJECTED:
        return <Badge variant="destructive">Rejected</Badge>;
      case LeaveStatus.CANCELLED:
        return <Badge variant="secondary">Cancelled</Badge>;
      case LeaveStatus.REVOKED:
        return <Badge variant="destructive">Revoked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div
      style={{
        backgroundColor: 'hsl(var(--bg-surface))',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid hsl(var(--border-subtle))',
        padding: 'var(--space-5)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
      }}
    >
      {/* 1. Header and Subtitle */}
      <div>
        <h2
          style={{
            fontSize: 'var(--font-size-base)',
            fontWeight: 700,
            color: 'hsl(var(--text-primary))',
            margin: 0,
          }}
        >
          Leave Approval Queue & Applications
        </h2>
        <p
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'hsl(var(--text-secondary))',
            margin: '2px 0 0 0',
          }}
        >
          Review, filter, approve, or reject employee leave requests
        </p>
      </div>

      {/* 2. Search & Multi-Filter Toolbar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--space-3)',
          alignItems: 'center',
          backgroundColor: 'hsl(var(--bg-secondary) / 0.4)',
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid hsl(var(--border-subtle))',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'hsl(var(--text-muted))',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Search employee, reason..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              height: '34px',
              paddingLeft: '32px',
              paddingRight: 'var(--space-2)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid hsl(var(--border-subtle))',
              backgroundColor: 'hsl(var(--bg-surface))',
              color: 'hsl(var(--text-primary))',
              fontSize: 'var(--font-size-xs)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          style={{
            height: '34px',
            padding: '0 var(--space-2)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid hsl(var(--border-subtle))',
            backgroundColor: 'hsl(var(--bg-surface))',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 600,
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="ALL">All Statuses</option>
          <option value={LeaveStatus.PENDING}>Pending Review</option>
          <option value={LeaveStatus.APPROVED}>Approved</option>
          <option value={LeaveStatus.REJECTED}>Rejected</option>
          <option value={LeaveStatus.CANCELLED}>Cancelled</option>
          <option value={LeaveStatus.REVOKED}>Revoked</option>
        </select>

        {/* Leave Type Filter */}
        <select
          value={leaveTypeFilter}
          onChange={(e) => onLeaveTypeChange(e.target.value)}
          style={{
            height: '34px',
            padding: '0 var(--space-2)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid hsl(var(--border-subtle))',
            backgroundColor: 'hsl(var(--bg-surface))',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 600,
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="ALL">All Categories</option>
          {leaveTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.code})
            </option>
          ))}
        </select>

        {/* Date Range Filters */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <Input
            type="date"
            placeholder="From"
            value={fromDate}
            onChange={(e) => onFromDateChange(e.target.value)}
            style={{ height: '34px', fontSize: '11px', padding: '0 6px' }}
          />
          <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>-</span>
          <Input
            type="date"
            placeholder="To"
            value={toDate}
            onChange={(e) => onToDateChange(e.target.value)}
            style={{ height: '34px', fontSize: '11px', padding: '0 6px' }}
          />
        </div>
      </div>

      {/* 3. Approvals Table */}
      {isLoading ? (
        <div
          style={{
            padding: 'var(--space-8)',
            textAlign: 'center',
            color: 'hsl(var(--text-muted))',
            fontSize: 'var(--font-size-xs)',
          }}
        >
          Loading leave applications...
        </div>
      ) : applications.length === 0 ? (
        <div
          style={{
            padding: 'var(--space-8)',
            textAlign: 'center',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed hsl(var(--border-subtle))',
            backgroundColor: 'hsl(var(--bg-secondary) / 0.4)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
        >
          <Clock size={28} style={{ color: 'hsl(var(--text-muted))' }} />
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}>
            No leave applications match the selected filters.
          </div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-xs)' }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid hsl(var(--border-subtle))',
                  textAlign: 'left',
                  color: 'hsl(var(--text-muted))',
                }}
              >
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>
                  Employee
                </th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>
                  Leave Category
                </th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>
                  Date Schedule
                </th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Days</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>
                  Reason
                </th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>
                  Status
                </th>
                <th
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    fontWeight: 600,
                    textAlign: 'right',
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr
                  key={app.id}
                  style={{
                    borderBottom: '1px solid hsl(var(--border-subtle))',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <div
                      style={{
                        fontWeight: 700,
                        color: 'hsl(var(--text-primary))',
                        fontSize: 'var(--font-size-xs)',
                      }}
                    >
                      {app.employeeName || 'Employee'}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'hsl(var(--text-secondary))',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                        marginTop: '3px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          gap: '6px',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                        }}
                      >
                        {app.employeeCode && (
                          <span
                            style={{
                              fontSize: '10px',
                              color: 'hsl(var(--text-muted))',
                              backgroundColor: 'hsl(var(--bg-surface))',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              border: '1px solid hsl(var(--border-subtle))',
                            }}
                          >
                            {app.employeeCode}
                          </span>
                        )}
                        {app.companyName && (
                          <span style={{ fontWeight: 600, color: 'hsl(var(--text-primary))' }}>
                            🏢 {app.companyName}
                          </span>
                        )}
                      </div>
                      {(app.departmentName || app.jobRoleName) && (
                        <div style={{ color: 'hsl(var(--text-muted))', fontSize: '10px' }}>
                          {app.departmentName && (
                            <span>
                              Dept: <strong>{app.departmentName}</strong>
                            </span>
                          )}
                          {app.departmentName && app.jobRoleName && <span> • </span>}
                          {app.jobRoleName && (
                            <span>
                              Role: <strong>{app.jobRoleName}</strong>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>

                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <Badge variant="outline">
                      {app.leaveTypeName || app.leaveTypeCode || 'Leave'}
                    </Badge>
                  </td>

                  <td
                    style={{
                      padding: 'var(--space-3) var(--space-4)',
                      color: 'hsl(var(--text-secondary))',
                    }}
                  >
                    <div>
                      {app.fromDate} &rarr; {app.toDate}
                    </div>
                    <div style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>
                      {app.fromHalf !== 'FULL' || app.toHalf !== 'FULL'
                        ? 'Half-day schedule'
                        : 'Full day'}
                    </div>
                  </td>

                  <td
                    style={{
                      padding: 'var(--space-3) var(--space-4)',
                      fontWeight: 700,
                      color: 'hsl(var(--primary-color))',
                    }}
                  >
                    {app.appliedDays} {app.appliedDays === 1 ? 'Day' : 'Days'}
                  </td>

                  <td
                    style={{
                      padding: 'var(--space-3) var(--space-4)',
                      color: 'hsl(var(--text-secondary))',
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {app.reason || '—'}
                  </td>

                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    {getStatusBadge(app.status)}
                  </td>

                  <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                    <div
                      style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSelectApplication(app)}
                        title="View Full Details"
                      >
                        <Eye size={13} style={{ marginRight: '4px' }} />
                        Details
                      </Button>

                      {app.status === LeaveStatus.PENDING && canApprove && (
                        <>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => onRejectQuick(app)}
                            title="Reject"
                          >
                            Reject
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => onApproveQuick(app)}
                            title="Approve"
                          >
                            Approve
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 'var(--space-3)',
            borderTop: '1px solid hsl(var(--border-subtle))',
          }}
        >
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}>
            Page {page} of {totalPages} ({total} applications)
          </span>

          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
