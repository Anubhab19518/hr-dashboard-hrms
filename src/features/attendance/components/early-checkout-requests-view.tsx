'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import { Input } from '@/components/atoms/input';
import { Clock, Check, X, Search, RefreshCw } from '@/components/atoms/icons';
import { AttendanceService } from '../services/attendance.service';
import { EmployeeService, type Employee } from '@/features/employees';
import { OrganizationService } from '@/features/organization';
import { useEarlyCheckoutStore } from '@/lib/client/early-checkout-store';
import { toast } from '@/lib/client/toast';
import { RejectEarlyCheckoutModal } from './reject-early-checkout-modal';
import type { EarlyCheckoutRequest, EarlyCheckoutStatus } from '../types/attendance.types';

export function EarlyCheckoutRequestsView() {
  const { setPendingEarlyCheckoutCount, decrementPendingCount } = useEarlyCheckoutStore();

  const [requests, setRequests] = useState<EarlyCheckoutRequest[]>([]);
  const [employeeMap, setEmployeeMap] = useState<Map<string, Employee>>(new Map());
  const [companyMap, setCompanyMap] = useState<Map<string, string>>(new Map());
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [statusFilter, setStatusFilter] = useState<EarlyCheckoutStatus | 'ALL'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Rejection modal state
  const [selectedRequestForReject, setSelectedRequestForReject] =
    useState<EarlyCheckoutRequest | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  // In-flight action loading IDs (for approve button spinners)
  const [actionLoadingIds, setActionLoadingIds] = useState<Record<string, boolean>>({});

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const [resResult, empResult, compResult] = await Promise.allSettled([
        AttendanceService.getEarlyCheckoutRequests({
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          page,
          limit,
          search: searchQuery.trim() || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
        EmployeeService.getEmployees({ limit: 1000 }),
        OrganizationService.getCompanies(),
      ]);

      const compLookup = new Map<string, string>();
      if (compResult.status === 'fulfilled' && Array.isArray(compResult.value)) {
        for (const c of compResult.value) {
          if (c.id) compLookup.set(c.id, c.name);
        }
        setCompanyMap(compLookup);
      }

      const empMap = new Map<string, Employee>();
      if (empResult.status === 'fulfilled' && empResult.value) {
        const records = empResult.value.records || [];
        for (const emp of records) {
          if (emp.id) empMap.set(emp.id, emp);
          if (emp.employeeCode) empMap.set(emp.employeeCode, emp);
          if (emp.userId) empMap.set(emp.userId, emp);
        }
        setEmployeeMap(empMap);
      }

      if (resResult.status === 'fulfilled') {
        const res = resResult.value;
        const enrichedItems = res.items.map((req) => {
          const emp =
            empMap.get(req.employeeId) ||
            (req.employee?.id ? empMap.get(req.employee.id) : undefined);
          const fullName = emp ? `${emp.firstName} ${emp.lastName}`.trim() : undefined;
          const resolvedComp =
            emp?.companyName ||
            (emp?.companyId ? compLookup.get(emp.companyId) : undefined) ||
            emp?.currentAssignment?.companyName;

          return {
            ...req,
            employee: {
              ...req.employee,
              name: req.employee?.name || fullName,
              code: req.employee?.code || emp?.employeeCode,
              companyName:
                req.employee?.companyName ||
                (typeof req.employee?.company === 'string'
                  ? req.employee.company
                  : req.employee?.company?.name) ||
                resolvedComp,
              department:
                req.employee?.department ||
                emp?.departmentName ||
                emp?.currentAssignment?.departmentName,
              departmentName:
                req.employee?.departmentName ||
                emp?.departmentName ||
                emp?.currentAssignment?.departmentName,
              role: req.employee?.role || emp?.designation || emp?.currentAssignment?.jobRoleName,
              designation:
                req.employee?.designation ||
                emp?.designation ||
                emp?.currentAssignment?.jobRoleName,
              avatar: req.employee?.avatar || emp?.avatarUrl,
            },
          };
        });

        setRequests(enrichedItems);
        setTotal(res.total);

        if (typeof res.pendingCount === 'number') {
          setPendingEarlyCheckoutCount(res.pendingCount);
        } else if (statusFilter === 'PENDING') {
          setPendingEarlyCheckoutCount(res.total);
        }
      } else {
        setRequests([]);
        setTotal(0);
        toast.error('Failed to load early check-out requests. Please retry.');
      }
    } catch {
      setRequests([]);
      setTotal(0);
      toast.error('Failed to load early check-out requests. Please retry.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, page, limit, searchQuery, startDate, endDate, setPendingEarlyCheckoutCount]);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  // Derived counts
  const pendingCount = useMemo(() => {
    return requests.filter((r) => r.status === 'PENDING').length;
  }, [requests]);

  const handleApprove = async (request: EarlyCheckoutRequest) => {
    const employeeName =
      request.employee?.name ||
      [request.employee?.firstName, request.employee?.lastName].filter(Boolean).join(' ') ||
      'Employee';

    setActionLoadingIds((prev) => ({ ...prev, [request.id]: true }));

    // Optimistic Update
    const originalRequests = [...requests];
    setRequests((prev) =>
      prev.map((item) =>
        item.id === request.id
          ? {
              ...item,
              status: 'APPROVED' as EarlyCheckoutStatus,
              reviewedAt: new Date().toISOString(),
            }
          : item,
      ),
    );
    decrementPendingCount(1);

    try {
      await AttendanceService.actionEarlyCheckoutRequest(request.id, { action: 'APPROVE' });
      toast.success(`Early check-out approved for ${employeeName}`);
    } catch (err: unknown) {
      // Revert optimistic update
      setRequests(originalRequests);
      const errMsg = err instanceof Error ? err.message : 'Approval failed. Please try again.';
      toast.error(errMsg);
    } finally {
      setActionLoadingIds((prev) => ({ ...prev, [request.id]: false }));
    }
  };

  const handleRejectClick = (request: EarlyCheckoutRequest) => {
    setSelectedRequestForReject(request);
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async (reason: string) => {
    if (!selectedRequestForReject) return;
    const request = selectedRequestForReject;
    const employeeName =
      request.employee?.name ||
      [request.employee?.firstName, request.employee?.lastName].filter(Boolean).join(' ') ||
      'Employee';

    setIsRejecting(true);

    // Optimistic Update
    const originalRequests = [...requests];
    setRequests((prev) =>
      prev.map((item) =>
        item.id === request.id
          ? {
              ...item,
              status: 'REJECTED' as EarlyCheckoutStatus,
              rejectionReason: reason,
              reviewedAt: new Date().toISOString(),
            }
          : item,
      ),
    );
    decrementPendingCount(1);
    setIsRejectModalOpen(false);

    try {
      await AttendanceService.actionEarlyCheckoutRequest(request.id, {
        action: 'REJECT',
        rejectionReason: reason,
      });
      toast.info(`Early check-out request rejected for ${employeeName}`);
    } catch (err: unknown) {
      // Revert optimistic update
      setRequests(originalRequests);
      const errMsg = err instanceof Error ? err.message : 'Rejection failed. Please try again.';
      toast.error(errMsg);
    } finally {
      setIsRejecting(false);
      setSelectedRequestForReject(null);
    }
  };

  const getStatusBadge = (status: EarlyCheckoutStatus) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">Approved</Badge>;
      case 'PENDING':
        return <Badge variant="warning">Pending Review</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const formatTimeDisplay = (timeVal?: string, fallbackTimestamp?: string) => {
    const val = (timeVal || '').trim();
    if (val && val !== '—') {
      if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(val)) {
        const parts = val.split(':');
        const hours = parseInt(parts[0] ?? '0', 10);
        const mins = parts[1] ?? '00';
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
        return `${String(formattedHours).padStart(2, '0')}:${mins} ${ampm}`;
      }
      try {
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
          return d.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });
        }
      } catch {
        // fallback
      }
      return val;
    }

    if (fallbackTimestamp) {
      try {
        const d = new Date(fallbackTimestamp);
        if (!isNaN(d.getTime())) {
          return d.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });
        }
      } catch {
        // fallback
      }
    }

    return '—';
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* 1. Page Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: 'var(--space-10)',
              height: 'var(--space-10)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'hsl(var(--color-warning) / 0.12)',
              color: 'hsl(var(--color-warning))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Clock size={22} strokeWidth={2} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <h1
                style={{
                  fontSize: 'var(--font-size-2xl)',
                  fontWeight: 700,
                  color: 'hsl(var(--text-primary))',
                  letterSpacing: '-0.02em',
                  margin: 0,
                }}
              >
                Early Check-Out Requests
              </h1>
              {pendingCount > 0 && (
                <span
                  style={{
                    backgroundColor: 'hsl(var(--color-warning))',
                    color: 'hsl(var(--text-inverse))',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: 'var(--space-1) var(--space-2)',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  {pendingCount} Pending
                </span>
              )}
            </div>
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'hsl(var(--text-muted))',
                marginTop: 'var(--space-1)',
                margin: 0,
              }}
            >
              Review, approve, or reject employee punch-out requests before scheduled shift end
              times
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="md"
          onClick={() => void fetchRequests()}
          disabled={isLoading}
          leftIcon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* 2. Filter & Search Toolbar */}
      <div
        style={{
          backgroundColor: 'hsl(var(--bg-surface))',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid hsl(var(--border-subtle))',
          padding: 'var(--space-4)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}
      >
        {/* Status Tabs */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 'var(--space-2)',
            borderBottom: '1px solid hsl(var(--border-subtle))',
            paddingBottom: 'var(--space-3)',
          }}
        >
          {(
            [
              { id: 'PENDING', label: 'Pending Review' },
              { id: 'ALL', label: 'All Requests' },
              { id: 'APPROVED', label: 'Approved' },
              { id: 'REJECTED', label: 'Rejected' },
            ] as const
          ).map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-2) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  border: isActive
                    ? '1px solid hsl(var(--color-brand-accent))'
                    : '1px solid transparent',
                  backgroundColor: isActive
                    ? 'hsl(var(--color-brand-accent) / 0.1)'
                    : 'transparent',
                  color: isActive ? 'hsl(var(--color-brand-accent))' : 'hsl(var(--text-secondary))',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <span>{tab.label}</span>
                {tab.id === 'PENDING' && pendingCount > 0 && (
                  <span
                    style={{
                      backgroundColor: 'hsl(var(--color-warning))',
                      color: 'hsl(var(--text-inverse))',
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '1px var(--space-2)',
                      borderRadius: 'var(--radius-full)',
                    }}
                  >
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search & Date Range */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-3)',
            alignItems: 'center',
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
              placeholder="Search employee, department, code, reason..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%',
                height: 'var(--space-9)',
                paddingLeft: 'var(--space-8)',
                paddingRight: 'var(--space-2)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid hsl(var(--border-subtle))',
                backgroundColor: 'hsl(var(--bg-secondary) / 0.4)',
                color: 'hsl(var(--text-primary))',
                fontSize: 'var(--font-size-xs)',
                outline: 'none',
              }}
            />
          </div>

          {/* Start Date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'hsl(var(--text-muted))',
                whiteSpace: 'nowrap',
              }}
            >
              From:
            </span>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              style={{ height: 'var(--space-9)', fontSize: 'var(--font-size-xs)' }}
            />
          </div>

          {/* End Date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'hsl(var(--text-muted))',
                whiteSpace: 'nowrap',
              }}
            >
              To:
            </span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              style={{ height: 'var(--space-9)', fontSize: 'var(--font-size-xs)' }}
            />
          </div>
        </div>
      </div>

      {/* 3. Requests Table Panel */}
      <div
        style={{
          backgroundColor: 'hsl(var(--bg-surface))',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid hsl(var(--border-subtle))',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
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
                  color: 'hsl(var(--text-secondary))',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontSize: '11px',
                }}
              >
                <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Employee</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Scheduled Shift End</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Requested Punch-Out</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', minWidth: '220px' }}>
                  Reason
                </th>
                <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Requested At</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Status</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                      }}
                    >
                      <RefreshCw
                        size={24}
                        className="animate-spin"
                        style={{ color: 'hsl(var(--color-brand-accent))' }}
                      />
                      <span
                        style={{
                          color: 'hsl(var(--text-muted))',
                          fontSize: 'var(--font-size-xs)',
                        }}
                      >
                        Loading early check-out requests...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                      }}
                    >
                      <Clock size={32} style={{ color: 'hsl(var(--text-muted))', opacity: 0.6 }} />
                      <div style={{ fontWeight: 600, color: 'hsl(var(--text-primary))' }}>
                        No Early Check-Out Requests
                      </div>
                      <span
                        style={{
                          color: 'hsl(var(--text-muted))',
                          fontSize: 'var(--font-size-xs)',
                        }}
                      >
                        {statusFilter === 'PENDING'
                          ? 'There are no pending early punch-out requests requiring approval.'
                          : 'No requests found matching your filter criteria.'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                requests.map((req) => {
                  const emp =
                    employeeMap.get(req.employeeId) ||
                    (req.employee?.id ? employeeMap.get(req.employee.id) : undefined);

                  const empName =
                    req.employee?.name ||
                    (emp ? `${emp.firstName} ${emp.lastName}`.trim() : null) ||
                    [req.employee?.firstName, req.employee?.lastName].filter(Boolean).join(' ') ||
                    `Employee #${req.employeeId.slice(0, 8)}`;

                  const empCode =
                    req.employee?.code || req.employee?.employeeCode || emp?.employeeCode;

                  const compName =
                    req.employee?.companyName ||
                    (typeof req.employee?.company === 'string'
                      ? req.employee.company
                      : req.employee?.company?.name) ||
                    emp?.companyName ||
                    (emp?.companyId ? companyMap.get(emp.companyId) : undefined) ||
                    emp?.currentAssignment?.companyName;

                  const dept =
                    typeof req.employee?.department === 'string'
                      ? req.employee.department
                      : req.employee?.department?.name ||
                        req.employee?.departmentName ||
                        emp?.departmentName ||
                        emp?.currentAssignment?.departmentName;

                  const role =
                    typeof req.employee?.role === 'string'
                      ? req.employee.role
                      : req.employee?.role?.name ||
                        req.employee?.designation ||
                        emp?.designation ||
                        emp?.currentAssignment?.jobRoleName;

                  const isActioning = Boolean(actionLoadingIds[req.id]);

                  return (
                    <tr
                      key={req.id}
                      style={{
                        borderBottom: '1px solid hsl(var(--border-subtle))',
                        transition: 'background-color var(--transition-fast)',
                      }}
                    >
                      {/* Employee Column */}
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}
                        >
                          <div
                            style={{
                              width: 'var(--space-8)',
                              height: 'var(--space-8)',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: 'hsl(var(--color-brand-accent) / 0.12)',
                              color: 'hsl(var(--color-brand-accent))',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px',
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {empName
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'hsl(var(--text-primary))' }}>
                              {empName}
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-1)',
                                marginTop: 'var(--space-1)',
                                flexWrap: 'wrap',
                                fontSize: '11px',
                              }}
                            >
                              {empCode && (
                                <span
                                  style={{
                                    fontFamily: 'var(--font-family-mono)',
                                    color: 'hsl(var(--text-muted))',
                                    fontWeight: 600,
                                  }}
                                >
                                  {empCode}
                                </span>
                              )}
                              {compName && (
                                <span
                                  style={{
                                    color: 'hsl(var(--text-secondary))',
                                    fontWeight: 600,
                                  }}
                                >
                                  • {compName}
                                </span>
                              )}
                              {dept && (
                                <span style={{ color: 'hsl(var(--text-muted))' }}>• {dept}</span>
                              )}
                              {role && (
                                <span style={{ color: 'hsl(var(--text-muted))' }}>({role})</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Scheduled Shift End */}
                      <td
                        style={{
                          padding: 'var(--space-3) var(--space-4)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}
                        >
                          <Clock size={13} style={{ color: 'hsl(var(--text-muted))' }} />
                          <span style={{ fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>
                            {formatTimeDisplay(req.scheduledShiftEndTime)}
                          </span>
                        </div>
                      </td>

                      {/* Requested Punch Out */}
                      <td
                        style={{
                          padding: 'var(--space-3) var(--space-4)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}
                        >
                          <Clock size={13} style={{ color: 'hsl(var(--color-warning))' }} />
                          <span style={{ fontWeight: 700, color: 'hsl(var(--color-warning))' }}>
                            {formatTimeDisplay(
                              req.requestedCheckoutTime,
                              req.requestedAt || req.createdAt,
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Reason */}
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <div
                          style={{
                            maxWidth: '320px',
                            color: 'hsl(var(--text-secondary))',
                            lineHeight: 1.4,
                            wordBreak: 'break-word',
                          }}
                        >
                          {req.reason ? `“${req.reason}”` : '—'}
                        </div>
                        {req.rejectionReason && (
                          <div
                            style={{
                              marginTop: 'var(--space-1)',
                              fontSize: '11px',
                              color: 'hsl(var(--color-danger))',
                            }}
                          >
                            Rejection Note: {req.rejectionReason}
                          </div>
                        )}
                      </td>

                      {/* Requested At */}
                      <td
                        style={{
                          padding: 'var(--space-3) var(--space-4)',
                          whiteSpace: 'nowrap',
                          color: 'hsl(var(--text-muted))',
                        }}
                      >
                        {formatDateTime(req.requestedAt || req.createdAt)}
                      </td>

                      {/* Status */}
                      <td
                        style={{
                          padding: 'var(--space-3) var(--space-4)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {getStatusBadge(req.status)}
                      </td>

                      {/* Actions */}
                      <td
                        style={{
                          padding: 'var(--space-3) var(--space-4)',
                          textAlign: 'right',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {req.status === 'PENDING' ? (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              gap: 'var(--space-2)',
                            }}
                          >
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={isActioning}
                              onClick={() => void handleApprove(req)}
                              leftIcon={
                                isActioning ? (
                                  <Clock size={13} className="animate-spin" />
                                ) : (
                                  <Check size={13} strokeWidth={2.5} />
                                )
                              }
                              style={{
                                backgroundColor: 'hsl(var(--color-success))',
                                borderColor: 'hsl(var(--color-success))',
                                color: 'hsl(var(--text-inverse))',
                              }}
                            >
                              Approve
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isActioning}
                              onClick={() => handleRejectClick(req)}
                              leftIcon={<X size={13} strokeWidth={2.5} />}
                              style={{
                                color: 'hsl(var(--color-danger))',
                                borderColor: 'hsl(var(--color-danger) / 0.4)',
                              }}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : req.status === 'APPROVED' ? (
                          <span
                            style={{
                              fontSize: '11px',
                              color: 'hsl(var(--color-success))',
                              fontWeight: 600,
                            }}
                          >
                            Approved
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '11px',
                              color: 'hsl(var(--color-danger))',
                              fontWeight: 600,
                            }}
                          >
                            Rejected
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!isLoading && total > limit && (
          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              borderTop: '1px solid hsl(var(--border-subtle))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 'var(--font-size-xs)',
              color: 'hsl(var(--text-muted))',
            }}
          >
            <div>
              Showing {Math.min((page - 1) * limit + 1, total)} to {Math.min(page * limit, total)}{' '}
              of {total} requests
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span style={{ fontWeight: 600, color: 'hsl(var(--text-primary))' }}>
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Reject Early Checkout Modal */}
      <RejectEarlyCheckoutModal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false);
          setSelectedRequestForReject(null);
        }}
        request={selectedRequestForReject}
        onConfirmReject={handleConfirmReject}
        isSubmitting={isRejecting}
      />
    </div>
  );
}
