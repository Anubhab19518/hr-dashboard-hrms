'use client';

import { useState } from 'react';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import {
  X,
  Calendar,
  Clock,
  User,
  Building2,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
  ShieldAlert,
} from '@/components/atoms/icons';
import { LeaveStatus, type LeaveApplication } from '../types/leave.types';
import { LeaveService } from '../services/leave.service';

interface LeaveApplicationDrawerProps {
  application: LeaveApplication | null;
  onClose: () => void;
  onUpdated?: () => void;
  canApprove?: boolean;
  canRevoke?: boolean;
}

export function LeaveApplicationDrawer({
  application,
  onClose,
  onUpdated,
  canApprove = true,
  canRevoke = true,
}: LeaveApplicationDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reviewComments, setReviewComments] = useState('');
  const [showActionModal, setShowActionModal] = useState<'APPROVE' | 'REJECT' | 'REVOKE' | null>(
    null,
  );

  if (!application) return null;

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

  const handleExecuteAction = async () => {
    if (!showActionModal) return;
    setIsSubmitting(true);
    setActionError(null);

    try {
      if (showActionModal === 'APPROVE') {
        await LeaveService.approveApplication(application.id, reviewComments);
      } else if (showActionModal === 'REJECT') {
        await LeaveService.rejectApplication(application.id, reviewComments);
      } else if (showActionModal === 'REVOKE') {
        await LeaveService.revokeApplication(application.id, reviewComments);
      }

      setShowActionModal(null);
      setReviewComments('');
      if (onUpdated) onUpdated();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      setActionError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPending = application.status === LeaveStatus.PENDING;
  const isApproved = application.status === LeaveStatus.APPROVED;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        maxWidth: '560px',
        backgroundColor: 'hsl(var(--bg-surface))',
        borderLeft: '1px solid hsl(var(--border-subtle))',
        boxShadow: 'var(--shadow-xl)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideInRight 0.2s ease',
      }}
    >
      {/* 1. Drawer Header */}
      <div
        style={{
          padding: 'var(--space-4) var(--space-5)',
          borderBottom: '1px solid hsl(var(--border-subtle))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'hsl(var(--bg-secondary) / 0.5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'hsl(var(--primary-color) / 0.1)',
              color: 'hsl(var(--primary-color))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Calendar size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <h2
                style={{
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 700,
                  color: 'hsl(var(--text-primary))',
                  margin: 0,
                }}
              >
                Leave Application Details
              </h2>
              {getStatusBadge(application.status)}
            </div>
            <div
              style={{
                fontSize: '11px',
                fontFamily: 'monospace',
                color: 'hsl(var(--text-muted))',
                marginTop: '2px',
              }}
            >
              ID: {application.id.slice(0, 13)}...
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            padding: 'var(--space-2)',
            cursor: 'pointer',
            color: 'hsl(var(--text-muted))',
            borderRadius: 'var(--radius-md)',
          }}
          aria-label="Close drawer"
        >
          <X size={18} />
        </button>
      </div>

      {/* 2. Drawer Content Body */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'var(--space-5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}
      >
        {actionError && (
          <div
            style={{
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'hsl(var(--color-danger) / 0.1)',
              color: 'hsl(var(--color-danger))',
              fontSize: 'var(--font-size-xs)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <AlertCircle size={15} />
            <span>{actionError}</span>
          </div>
        )}

        {/* Employee Card */}
        <div
          style={{
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid hsl(var(--border-subtle))',
            backgroundColor: 'hsl(var(--bg-secondary) / 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: 'hsl(var(--primary-color) / 0.15)',
              color: 'hsl(var(--primary-color))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 'var(--font-size-sm)',
            }}
          >
            <User size={20} />
          </div>
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 'var(--font-size-sm)',
                color: 'hsl(var(--text-primary))',
              }}
            >
              {application.employeeName || 'Employee'}
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'hsl(var(--text-muted))',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--space-2)',
                marginTop: '4px',
                alignItems: 'center',
              }}
            >
              {application.employeeCode && (
                <span
                  style={{
                    backgroundColor: 'hsl(var(--bg-surface))',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    border: '1px solid hsl(var(--border-subtle))',
                    fontFamily: 'monospace',
                  }}
                >
                  {application.employeeCode}
                </span>
              )}
              {application.companyName && (
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 600,
                    color: 'hsl(var(--text-primary))',
                  }}
                >
                  <Building2 size={12} /> {application.companyName}
                </span>
              )}
              {application.departmentName && (
                <span>
                  • Dept: <strong>{application.departmentName}</strong>
                </span>
              )}
              {application.jobRoleName && (
                <span>
                  • Role: <strong>{application.jobRoleName}</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Leave Type & Duration Overview */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 'var(--space-3)',
          }}
        >
          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid hsl(var(--border-subtle))',
              backgroundColor: 'hsl(var(--bg-surface))',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                color: 'hsl(var(--text-muted))',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              Leave Type
            </div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 'var(--font-size-sm)',
                color: 'hsl(var(--text-primary))',
                marginTop: '2px',
              }}
            >
              {application.leaveTypeName || application.leaveTypeCode || 'Leave'}
            </div>
            <div style={{ marginTop: '4px' }}>
              <Badge variant={application.leaveType?.isPaid !== false ? 'success' : 'warning'}>
                {application.leaveType?.isPaid !== false ? 'Paid Leave' : 'Unpaid (LOP)'}
              </Badge>
            </div>
          </div>

          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid hsl(var(--border-subtle))',
              backgroundColor: 'hsl(var(--bg-surface))',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                color: 'hsl(var(--text-muted))',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              Applied Duration
            </div>
            <div
              style={{
                fontWeight: 800,
                fontSize: 'var(--font-size-lg)',
                color: 'hsl(var(--primary-color))',
                marginTop: '2px',
              }}
            >
              {application.appliedDays} {application.appliedDays === 1 ? 'Day' : 'Days'}
            </div>
            <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
              {application.fromHalf !== 'FULL' || application.toHalf !== 'FULL'
                ? 'Half-day requested'
                : 'Full Day schedule'}
            </div>
          </div>
        </div>

        {/* Date Schedule Breakdown */}
        <div
          style={{
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid hsl(var(--border-subtle))',
            backgroundColor: 'hsl(var(--bg-surface))',
          }}
        >
          <div
            style={{
              fontSize: 'var(--font-size-xs)',
              fontWeight: 700,
              color: 'hsl(var(--text-primary))',
              marginBottom: 'var(--space-3)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <Clock size={14} />
            <span>Schedule Timeline</span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>From Date</div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 'var(--font-size-sm)',
                  color: 'hsl(var(--text-primary))',
                }}
              >
                {application.fromDate}
              </div>
              <div style={{ fontSize: '10px', color: 'hsl(var(--text-secondary))' }}>
                {application.fromHalf === 'FULL'
                  ? 'Full Day'
                  : application.fromHalf === 'FIRST_HALF'
                    ? '1st Half'
                    : '2nd Half'}
              </div>
            </div>

            <div style={{ color: 'hsl(var(--text-muted))', fontWeight: 700 }}>&rarr;</div>

            <div style={{ flex: 1, textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>To Date</div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 'var(--font-size-sm)',
                  color: 'hsl(var(--text-primary))',
                }}
              >
                {application.toDate}
              </div>
              <div style={{ fontSize: '10px', color: 'hsl(var(--text-secondary))' }}>
                {application.toHalf === 'FULL'
                  ? 'Full Day'
                  : application.toHalf === 'FIRST_HALF'
                    ? '1st Half'
                    : '2nd Half'}
              </div>
            </div>
          </div>
        </div>

        {/* Reason Section */}
        <div
          style={{
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid hsl(var(--border-subtle))',
            backgroundColor: 'hsl(var(--bg-surface))',
          }}
        >
          <div
            style={{
              fontSize: 'var(--font-size-xs)',
              fontWeight: 700,
              color: 'hsl(var(--text-primary))',
              marginBottom: 'var(--space-2)',
            }}
          >
            Reason for Leave
          </div>
          <div
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'hsl(var(--text-secondary))',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
            }}
          >
            {application.reason || 'No specific reason provided.'}
          </div>
        </div>

        {/* Uploaded Supporting Documents */}
        {application.documents && application.documents.length > 0 && (
          <div
            style={{
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid hsl(var(--border-subtle))',
              backgroundColor: 'hsl(var(--bg-surface))',
            }}
          >
            <div
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 700,
                color: 'hsl(var(--text-primary))',
                marginBottom: 'var(--space-3)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <FileText size={14} />
              <span>Supporting Documents ({application.documents.length})</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {application.documents.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid hsl(var(--border-subtle))',
                    backgroundColor: 'hsl(var(--bg-secondary) / 0.3)',
                    fontSize: 'var(--font-size-xs)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      overflow: 'hidden',
                    }}
                  >
                    <FileText
                      size={14}
                      style={{ color: 'hsl(var(--primary-color))', flexShrink: 0 }}
                    />
                    <span
                      style={{
                        fontWeight: 600,
                        color: 'hsl(var(--text-primary))',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {doc.fileName}
                    </span>
                    <span
                      style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', flexShrink: 0 }}
                    >
                      ({Math.round(doc.fileSizeBytes / 1024)} KB)
                    </span>
                  </div>

                  {doc.fileUrl ? (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: 'hsl(var(--primary-color))',
                        textDecoration: 'none',
                        fontWeight: 600,
                        fontSize: '11px',
                      }}
                    >
                      <Download size={12} /> Download
                    </a>
                  ) : (
                    <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>
                      Uploaded
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audit & Decision Log */}
        {(application.approvedBy ||
          application.approvedAt ||
          application.rejectionReason ||
          application.cancellationReason ||
          application.comments) && (
          <div
            style={{
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid hsl(var(--border-subtle))',
              backgroundColor: 'hsl(var(--bg-secondary) / 0.4)',
            }}
          >
            <div
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 700,
                color: 'hsl(var(--text-primary))',
                marginBottom: 'var(--space-2)',
              }}
            >
              Decision History & Notes
            </div>

            {application.approvedByName && (
              <div
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'hsl(var(--text-secondary))',
                  marginBottom: '4px',
                }}
              >
                Reviewed by: <strong>{application.approvedByName}</strong>
              </div>
            )}
            {application.approvedAt && (
              <div
                style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginBottom: '4px' }}
              >
                Date: {new Date(application.approvedAt).toLocaleString()}
              </div>
            )}
            {application.rejectionReason && (
              <div
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'hsl(var(--color-danger))',
                  marginTop: '4px',
                }}
              >
                <strong>Rejection Reason:</strong> {application.rejectionReason}
              </div>
            )}
            {application.cancellationReason && (
              <div
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'hsl(var(--text-muted))',
                  marginTop: '4px',
                }}
              >
                <strong>Cancellation Reason:</strong> {application.cancellationReason}
              </div>
            )}
            {application.comments && (
              <div
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'hsl(var(--text-secondary))',
                  marginTop: '4px',
                }}
              >
                <strong>Comments:</strong> {application.comments}
              </div>
            )}
          </div>
        )}

        {/* Interactive Action Confirmation Prompt */}
        {showActionModal && (
          <div
            style={{
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-lg)',
              border: `1px solid ${
                showActionModal === 'APPROVE'
                  ? 'hsl(var(--color-success))'
                  : 'hsl(var(--color-danger))'
              }`,
              backgroundColor:
                showActionModal === 'APPROVE'
                  ? 'hsl(var(--color-success) / 0.08)'
                  : 'hsl(var(--color-danger) / 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: 'var(--font-size-sm)',
                color: 'hsl(var(--text-primary))',
              }}
            >
              {showActionModal === 'APPROVE' && 'Approve Leave Request'}
              {showActionModal === 'REJECT' && 'Reject Leave Request'}
              {showActionModal === 'REVOKE' && 'Revoke Approved Leave'}
            </div>

            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'hsl(var(--text-secondary))',
                margin: 0,
              }}
            >
              {showActionModal === 'APPROVE' &&
                'This will approve the leave and deduct the days from the employee balance.'}
              {showActionModal === 'REJECT' &&
                'This will reject the leave application and release held days.'}
              {showActionModal === 'REVOKE' &&
                'This will revoke the previously approved leave and restore employee balances.'}
            </p>

            <div>
              <label
                style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}
              >
                Review Comments / Remarks (Optional)
              </label>
              <textarea
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                placeholder="Add comments or explanation..."
                rows={3}
                style={{
                  width: '100%',
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid hsl(var(--border-subtle))',
                  backgroundColor: 'hsl(var(--bg-surface))',
                  fontSize: 'var(--font-size-xs)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowActionModal(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant={showActionModal === 'APPROVE' ? 'primary' : 'danger'}
                size="sm"
                onClick={() => void handleExecuteAction()}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : `Confirm ${showActionModal}`}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Drawer Bottom Action Footer */}
      {!showActionModal && (isPending || isApproved) && (
        <div
          style={{
            padding: 'var(--space-4) var(--space-5)',
            borderTop: '1px solid hsl(var(--border-subtle))',
            backgroundColor: 'hsl(var(--bg-secondary) / 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 'var(--space-3)',
          }}
        >
          {isPending && canApprove && (
            <>
              <Button variant="danger" size="sm" onClick={() => setShowActionModal('REJECT')}>
                <AlertCircle size={14} style={{ marginRight: '6px' }} />
                Reject
              </Button>
              <Button variant="primary" size="sm" onClick={() => setShowActionModal('APPROVE')}>
                <CheckCircle2 size={14} style={{ marginRight: '6px' }} />
                Approve Leave
              </Button>
            </>
          )}

          {isApproved && canRevoke && (
            <Button variant="danger" size="sm" onClick={() => setShowActionModal('REVOKE')}>
              <ShieldAlert size={14} style={{ marginRight: '6px' }} />
              Revoke Approved Leave
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
