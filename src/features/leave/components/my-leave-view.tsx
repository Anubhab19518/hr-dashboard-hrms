'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import { Card, CardContent } from '@/components/atoms/card';
import { Modal } from '@/components/molecules/modal';
import { Calendar, Clock, Plus, AlertCircle, X, RefreshCw, Eye } from '@/components/atoms/icons';
import {
  LeaveStatus,
  type LeaveType,
  type LeaveBalance,
  type LeavePolicy,
  type LeaveApplication,
} from '../types/leave.types';
import { LeaveService } from '../services/leave.service';
import { ApplyLeaveModal } from './apply-leave-modal';
import { LeaveApplicationDrawer } from './leave-application-drawer';

interface MyLeaveViewProps {
  onRefreshParent?: () => void;
}

export function MyLeaveView({ onRefreshParent }: MyLeaveViewProps) {
  const currentYear = new Date().getFullYear();
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [totalApplications, setTotalApplications] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals & Drawers state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedAppForDrawer, setSelectedAppForDrawer] = useState<LeaveApplication | null>(null);
  const [cancellingApp, setCancellingApp] = useState<LeaveApplication | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [balRes, typesRes, policiesRes, appsRes] = await Promise.all([
        LeaveService.getMyBalances(currentYear).catch(() => []),
        LeaveService.getLeaveTypes(false).catch(() => []),
        LeaveService.getPolicies(true).catch(() => []),
        LeaveService.getMyApplications({ page, limit: 15, status: statusFilter }).catch(() => ({
          applications: [],
          total: 0,
          page: 1,
          limit: 15,
        })),
      ]);

      setBalances(Array.isArray(balRes) ? balRes : []);
      setLeaveTypes(Array.isArray(typesRes) ? typesRes : []);
      setPolicies(Array.isArray(policiesRes) ? policiesRes : []);
      setApplications(appsRes.applications || []);
      setTotalApplications(appsRes.total || 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load self-service leave data';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [currentYear, page, statusFilter]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleCancelApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingApp) return;
    setIsCancelling(true);
    setCancelError(null);

    try {
      await LeaveService.cancelMyApplication(cancellingApp.id, cancellationReason);
      setCancellingApp(null);
      setCancellationReason('');
      void fetchData();
      if (onRefreshParent) onRefreshParent();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel application';
      setCancelError(msg);
    } finally {
      setIsCancelling(false);
    }
  };

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* 1. Header Banner & Apply Action */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
          backgroundColor: 'hsl(var(--bg-surface))',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid hsl(var(--border-subtle))',
          padding: 'var(--space-5)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'hsl(var(--color-brand-accent) / 0.12)',
              color: 'hsl(var(--color-brand-accent))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Calendar size={20} />
          </div>
          <div>
            <h2
              style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: 700,
                color: 'hsl(var(--text-primary))',
                margin: 0,
              }}
            >
              My Leave & Balances ({currentYear})
            </h2>
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'hsl(var(--text-secondary))',
                margin: '2px 0 0 0',
              }}
            >
              View your annual leave entitlements, apply for time off, and track application
              statuses
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Button variant="outline" size="sm" onClick={() => void fetchData()}>
            <RefreshCw size={13} style={{ marginRight: '6px' }} />
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsApplyModalOpen(true)}>
            <Plus size={14} style={{ marginRight: '6px' }} />
            Apply for Leave
          </Button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'hsl(var(--color-danger) / 0.1)',
            color: 'hsl(var(--color-danger))',
            fontSize: 'var(--font-size-xs)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Leave Balance Cards Grid */}
      <div>
        <div
          style={{
            fontSize: 'var(--font-size-xs)',
            fontWeight: 700,
            color: 'hsl(var(--text-muted))',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 'var(--space-3)',
          }}
        >
          Annual Entitlements & Balances
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {(Array.isArray(leaveTypes) ? leaveTypes : []).map((lt) => {
            if (!lt) return null;
            const b = (Array.isArray(balances) ? balances : []).find(
              (bal) => bal && bal.leaveTypeId === lt.id,
            );
            const matchingEntitlement = (Array.isArray(policies) ? policies : [])
              .flatMap((p) => (p && Array.isArray(p.entitlements) ? p.entitlements : []))
              .find((e) => e && e.leaveTypeId === lt.id);
            const quotaDays = matchingEntitlement?.annualQuota ?? matchingEntitlement?.quotaDays;

            return (
              <Card key={lt.id} variant="subtle">
                <CardContent style={{ padding: 'var(--space-4)' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 'var(--font-size-sm)',
                        color: 'hsl(var(--text-primary))',
                      }}
                    >
                      {lt.name}
                    </span>
                    <Badge variant={lt.isPaid ? 'primary' : 'warning'}>{lt.code}</Badge>
                  </div>

                  {b !== undefined ? (
                    <>
                      <div
                        style={{
                          marginTop: 'var(--space-3)',
                          display: 'flex',
                          alignItems: 'baseline',
                          gap: 'var(--space-2)',
                        }}
                      >
                        <span
                          style={{
                            fontSize: 'var(--font-size-2xl)',
                            fontWeight: 800,
                            color: 'hsl(var(--primary-color))',
                          }}
                        >
                          {b.closingBalance}
                        </span>
                        <span
                          style={{
                            fontSize: 'var(--font-size-xs)',
                            color: 'hsl(var(--text-muted))',
                          }}
                        >
                          Days Available
                        </span>
                      </div>

                      <div
                        style={{
                          marginTop: 'var(--space-3)',
                          paddingTop: 'var(--space-3)',
                          borderTop: '1px solid hsl(var(--border-subtle))',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '4px',
                          fontSize: '11px',
                          color: 'hsl(var(--text-secondary))',
                          textAlign: 'center',
                        }}
                      >
                        <div>
                          <div style={{ color: 'hsl(var(--text-muted))' }}>Accrued</div>
                          <div style={{ fontWeight: 600 }}>{b.accrued}</div>
                        </div>
                        <div>
                          <div style={{ color: 'hsl(var(--text-muted))' }}>Used</div>
                          <div style={{ fontWeight: 600 }}>{b.used}</div>
                        </div>
                        <div>
                          <div style={{ color: 'hsl(var(--text-muted))' }}>LOP</div>
                          <div style={{ fontWeight: 600 }}>{b.lopDays}</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        style={{
                          marginTop: 'var(--space-3)',
                          display: 'flex',
                          alignItems: 'baseline',
                          gap: 'var(--space-2)',
                        }}
                      >
                        <span
                          style={{
                            fontSize: 'var(--font-size-2xl)',
                            fontWeight: 800,
                            color: 'hsl(var(--primary-color))',
                          }}
                        >
                          {quotaDays !== undefined ? quotaDays : lt.isPaid ? '—' : 'LOP'}
                        </span>
                        <span
                          style={{
                            fontSize: 'var(--font-size-xs)',
                            color: 'hsl(var(--text-muted))',
                          }}
                        >
                          {quotaDays !== undefined
                            ? 'Days / Year Quota'
                            : lt.isPaid
                              ? 'Unassigned'
                              : 'Unpaid Leave'}
                        </span>
                      </div>

                      <div
                        style={{
                          marginTop: 'var(--space-3)',
                          paddingTop: 'var(--space-3)',
                          borderTop: '1px solid hsl(var(--border-subtle))',
                          fontSize: '11px',
                          color: 'hsl(var(--text-secondary))',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span>
                          Accrual:{' '}
                          <strong>
                            {(matchingEntitlement?.accrualType || 'UPFRONT').toLowerCase()}
                          </strong>
                        </span>
                        <span style={{ color: 'hsl(var(--text-muted))' }}>0d active ledger</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 3. My Applications History Table */}
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
              My Leave History & Applications
            </h3>
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'hsl(var(--text-secondary))',
                margin: '2px 0 0 0',
              }}
            >
              Showing {applications.length} of {totalApplications} applications
            </p>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                height: '34px',
                padding: '0 var(--space-3)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid hsl(var(--border-subtle))',
                backgroundColor: 'hsl(var(--bg-secondary))',
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
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div
            style={{
              padding: 'var(--space-8)',
              textAlign: 'center',
              color: 'hsl(var(--text-muted))',
              fontSize: 'var(--font-size-xs)',
            }}
          >
            Loading your leave applications...
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
              gap: 'var(--space-3)',
            }}
          >
            <Clock size={28} style={{ color: 'hsl(var(--text-muted))' }} />
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}>
              {statusFilter !== 'ALL'
                ? 'No applications match selected status.'
                : 'You have not submitted any leave applications yet.'}
            </div>
            <Button variant="primary" size="sm" onClick={() => setIsApplyModalOpen(true)}>
              <Plus size={13} style={{ marginRight: '4px' }} />
              Apply for Leave
            </Button>
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
                    Leave Category
                  </th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>
                    Dates & Schedule
                  </th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>
                    Duration
                  </th>
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
                    <td
                      style={{
                        padding: 'var(--space-3) var(--space-4)',
                        fontWeight: 600,
                        color: 'hsl(var(--text-primary))',
                      }}
                    >
                      {app.leaveTypeName || app.leaveTypeCode || 'Leave'}
                    </td>
                    <td
                      style={{
                        padding: 'var(--space-3) var(--space-4)',
                        color: 'hsl(var(--text-secondary))',
                      }}
                    >
                      {app.fromDate} &rarr; {app.toDate}
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
                        maxWidth: '240px',
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
                        style={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          gap: 'var(--space-2)',
                        }}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedAppForDrawer(app)}
                          title="View Details"
                        >
                          <Eye size={13} style={{ marginRight: '4px' }} />
                          Details
                        </Button>
                        {app.status === LeaveStatus.PENDING && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setCancellingApp(app)}
                            title="Cancel pending application"
                          >
                            <X size={13} style={{ marginRight: '4px' }} />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {Math.ceil(totalApplications / 15) > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 'var(--space-3)',
              borderTop: '1px solid hsl(var(--border-subtle))',
              marginTop: 'var(--space-3)',
            }}
          >
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}>
              Page {page} of {Math.ceil(totalApplications / 15)} ({totalApplications} applications)
            </span>

            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= Math.ceil(totalApplications / 15)}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Apply Leave Modal */}
      {isApplyModalOpen && (
        <ApplyLeaveModal
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          leaveTypes={leaveTypes}
          balances={balances}
          policies={policies}
          onSuccess={() => {
            void fetchData();
            if (onRefreshParent) onRefreshParent();
          }}
        />
      )}

      {/* Application Details Drawer */}
      {selectedAppForDrawer && (
        <LeaveApplicationDrawer
          application={selectedAppForDrawer}
          onClose={() => setSelectedAppForDrawer(null)}
          onUpdated={() => {
            void fetchData();
            if (onRefreshParent) onRefreshParent();
          }}
          canApprove={false}
          canRevoke={false}
        />
      )}

      {/* Cancel Application Confirmation Modal */}
      {cancellingApp && (
        <Modal
          isOpen={Boolean(cancellingApp)}
          onClose={() => setCancellingApp(null)}
          title="Cancel Leave Application"
          size="sm"
        >
          <form
            onSubmit={handleCancelApplication}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
          >
            {cancelError && (
              <div
                style={{
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'hsl(var(--color-danger) / 0.1)',
                  color: 'hsl(var(--color-danger))',
                  fontSize: 'var(--font-size-xs)',
                }}
              >
                {cancelError}
              </div>
            )}

            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'hsl(var(--text-secondary))',
                margin: 0,
              }}
            >
              Are you sure you want to cancel your leave request for{' '}
              <strong>{cancellingApp.appliedDays} days</strong> ({cancellingApp.fromDate} to{' '}
              {cancellingApp.toDate})?
            </p>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  marginBottom: '6px',
                }}
              >
                Cancellation Reason (Optional)
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="e.g. Travel plans postponed or rescheduled"
                rows={3}
                style={{
                  width: '100%',
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid hsl(var(--border-subtle))',
                  fontSize: 'var(--font-size-xs)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCancellingApp(null)}
                disabled={isCancelling}
              >
                Keep Request
              </Button>
              <Button type="submit" variant="danger" disabled={isCancelling}>
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
