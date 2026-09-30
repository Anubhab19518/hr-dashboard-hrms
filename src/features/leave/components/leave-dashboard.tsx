'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import {
  Calendar,
  Clock,
  Plus,
  RefreshCw,
  FileText,
  Layers,
  Wallet,
  FileSpreadsheet,
  AlertCircle,
  SlidersHorizontal,
} from '@/components/atoms/icons';
import { useAuthStore } from '@/lib/client/auth-store';
import {
  LeaveStatus,
  type LeaveApplication,
  type LeaveType,
  type LeavePolicy,
  type LeaveBalance,
} from '../types/leave.types';
import { LeaveService } from '../services/leave.service';
import { EmployeeService } from '@/features/employees';

// Sub-components
import { LeaveOverviewTab } from './leave-overview-tab';
import { LeaveApprovalsTab } from './leave-approvals-tab';
import { MyLeaveView } from './my-leave-view';
import { LeaveTypesTab } from './leave-types-tab';
import { LeavePoliciesTab } from './leave-policies-tab';
import { LeaveBalancesTab } from './leave-balances-tab';
import { PayrollLopTab } from './payroll-lop-tab';
import { LeaveApplicationDrawer } from './leave-application-drawer';
import { ApplyLeaveModal } from './apply-leave-modal';
import { AdjustBalanceModal } from './adjust-balance-modal';
import { RejectLeaveModal } from './reject-leave-modal';

export type LeaveTabId =
  'overview' | 'approvals' | 'my-leave' | 'types' | 'policies' | 'balances' | 'payroll-lop';

interface TabConfig {
  id: LeaveTabId;
  label: string;
  icon: typeof Calendar;
  countBadge?: number;
}

export function LeaveDashboard() {
  const user = useAuthStore((s) => s.user);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [activeTab, setActiveTab] = useState<LeaveTabId>('overview');

  // Master Data States
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [totalApplications, setTotalApplications] = useState(0);
  const [appsPage, setAppsPage] = useState(1);
  const [appsLimit] = useState(20);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [employees, setEmployees] = useState<
    Array<{
      id: string;
      name?: string;
      firstName?: string;
      lastName?: string;
      employeeCode?: string;
    }>
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals & Drawers state
  const [selectedAppForDrawer, setSelectedAppForDrawer] = useState<LeaveApplication | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [appToReject, setAppToReject] = useState<LeaveApplication | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  // Permissions / Roles
  const isSuperAdmin = Boolean(user?.isSuperAdmin);
  const userRole = (user?.role || '').toUpperCase();
  const isHRorAdmin =
    isSuperAdmin || userRole === 'ADMIN' || userRole === 'HR_ADMIN' || userRole === 'HR_EXECUTIVE';

  const fetchMasterData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [typesRes, policiesRes, balRes, appsRes, empsRes] = await Promise.all([
        LeaveService.getLeaveTypes(false).catch(() => []),
        LeaveService.getPolicies().catch(() => []),
        LeaveService.getEmployeeBalances({ year: selectedYear }).catch(() => []),
        LeaveService.getApplications({
          page: appsPage,
          limit: appsLimit,
          status: statusFilter,
          leaveTypeId: leaveTypeFilter !== 'ALL' ? leaveTypeFilter : undefined,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
        }).catch(() => ({
          applications: [],
          total: 0,
          page: 1,
          limit: appsLimit,
        })),
        EmployeeService.getEmployees({ limit: 500 }).catch(() => ({ records: [] })),
      ]);

      const employeeRecords = Array.isArray(empsRes)
        ? empsRes
        : (empsRes as { records?: unknown[] })?.records || [];

      const enrichedApplications: LeaveApplication[] = (appsRes.applications || []).map((app) => {
        const matchingEmp = (employeeRecords as Array<Record<string, unknown>>).find(
          (e) =>
            e &&
            (e.id === app.employeeId ||
              (e.userId && e.userId === app.employeeId) ||
              ((app as unknown as Record<string, unknown>).userId &&
                e.id === (app as unknown as Record<string, unknown>).userId)),
        );

        const currentAss = matchingEmp?.currentAssignment as Record<string, unknown> | undefined;
        const empFullName = matchingEmp
          ? `${(matchingEmp.firstName as string) || ''} ${(matchingEmp.lastName as string) || ''}`.trim() ||
            (matchingEmp.name as string)
          : '';

        const employeeName =
          app.employeeName && app.employeeName !== 'Employee'
            ? app.employeeName
            : empFullName || app.employeeName || 'Employee';

        const employeeCode = app.employeeCode || (matchingEmp?.employeeCode as string) || '';
        const companyName =
          app.companyName ||
          (matchingEmp?.companyName as string) ||
          (currentAss?.companyName as string) ||
          null;
        const departmentName =
          app.departmentName ||
          (matchingEmp?.departmentName as string) ||
          (currentAss?.departmentName as string) ||
          null;
        const jobRoleName =
          app.jobRoleName ||
          app.designation ||
          (matchingEmp?.designation as string) ||
          (currentAss?.jobRoleName as string) ||
          null;
        const employeeAvatarUrl = app.employeeAvatarUrl || (matchingEmp?.avatarUrl as string);

        return {
          ...app,
          employeeName,
          employeeCode,
          companyName,
          departmentName,
          jobRoleName,
          designation: jobRoleName,
          employeeAvatarUrl,
        };
      });

      setLeaveTypes(Array.isArray(typesRes) ? typesRes : []);
      setPolicies(Array.isArray(policiesRes) ? policiesRes : []);
      setBalances(Array.isArray(balRes) ? balRes : []);
      setApplications(enrichedApplications);
      setTotalApplications(appsRes.total || 0);
      setEmployees(Array.isArray(employeeRecords) ? (employeeRecords as typeof employees) : []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch leave management data';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, appsPage, appsLimit, statusFilter, leaveTypeFilter, fromDate, toDate]);

  useEffect(() => {
    void fetchMasterData();
  }, [fetchMasterData]);

  // Quick Action Handlers
  const handleApproveQuick = async (app: LeaveApplication) => {
    try {
      await LeaveService.approveApplication(app.id);
      void fetchMasterData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Approval failed';
      alert(msg);
    }
  };

  const handleRejectQuick = (app: LeaveApplication) => {
    setAppToReject(app);
    setIsRejectModalOpen(true);
  };

  const pendingCount = useMemo(
    () => applications.filter((a) => a.status === LeaveStatus.PENDING).length,
    [applications],
  );

  const tabs: TabConfig[] = [
    { id: 'overview', label: 'Overview & Metrics', icon: Calendar },
    { id: 'approvals', label: 'Approval Queue', icon: Clock, countBadge: pendingCount },
    { id: 'my-leave', label: 'My Leave (Self-Service)', icon: Plus },
    { id: 'types', label: 'Leave Types', icon: FileText },
    { id: 'policies', label: 'Policies & Quotas', icon: Layers },
    { id: 'balances', label: 'Employee Balances', icon: Wallet },
    { id: 'payroll-lop', label: 'Payroll LOP View', icon: FileSpreadsheet },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* 1. Header Banner & Year Selector */}
      <div
        style={{
          backgroundColor: 'hsl(var(--bg-surface))',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid hsl(var(--border-subtle))',
          padding: 'var(--space-5)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
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
            <Calendar size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'hsl(var(--text-muted))',
                }}
              >
                Workforce Management
              </span>
              <Badge variant="primary">{selectedYear} LEAVE CYCLE</Badge>
              {pendingCount > 0 && <Badge variant="warning">{pendingCount} PENDING</Badge>}
            </div>
            <h1
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 700,
                color: 'hsl(var(--text-primary))',
                margin: '2px 0 0 0',
              }}
            >
              Leave Management & Time-Off System
            </h1>
          </div>
        </div>

        {/* Header Action Controls */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}
        >
          <Button variant="outline" size="sm" onClick={() => void fetchMasterData()}>
            <RefreshCw size={13} style={{ marginRight: '6px' }} />
            Refresh
          </Button>

          <Button variant="outline" size="sm" onClick={() => setIsApplyModalOpen(true)}>
            <Plus size={13} style={{ marginRight: '4px' }} />
            Apply Leave
          </Button>

          {isHRorAdmin && (
            <Button variant="primary" size="sm" onClick={() => setIsAdjustModalOpen(true)}>
              <SlidersHorizontal size={13} style={{ marginRight: '4px' }} />
              Adjust Balance
            </Button>
          )}
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

      {/* 2. Top Navigation Tabs Bar */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-2)',
          backgroundColor: 'hsl(var(--bg-surface))',
          padding: 'var(--space-2) var(--space-3)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid hsl(var(--border-subtle))',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-2) var(--space-4)',
                borderRadius: 'var(--radius-lg)',
                border: 'none',
                backgroundColor: isActive ? 'hsl(var(--primary-color))' : 'transparent',
                color: isActive
                  ? 'hsl(var(--primary-foreground, 0 0% 100%))'
                  : 'hsl(var(--text-secondary))',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
            >
              <TabIcon size={14} />
              <span>{tab.label}</span>
              {tab.countBadge !== undefined && tab.countBadge > 0 && (
                <span
                  style={{
                    backgroundColor: isActive
                      ? 'rgba(255,255,255,0.25)'
                      : 'hsl(var(--color-warning))',
                    color: isActive ? '#fff' : '#000',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  {tab.countBadge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Active Tab Content Rendering */}
      {activeTab === 'overview' && (
        <LeaveOverviewTab
          applications={applications}
          leaveTypes={leaveTypes}
          balances={balances}
          onSelectApplication={(app) => setSelectedAppForDrawer(app)}
          onNavigateTab={(tabId) => setActiveTab(tabId as LeaveTabId)}
          onApproveQuick={(app) => void handleApproveQuick(app)}
          onRejectQuick={(app) => void handleRejectQuick(app)}
        />
      )}

      {activeTab === 'approvals' && (
        <LeaveApprovalsTab
          applications={applications}
          total={totalApplications}
          page={appsPage}
          limit={appsLimit}
          leaveTypes={leaveTypes}
          isLoading={isLoading}
          statusFilter={statusFilter}
          leaveTypeFilter={leaveTypeFilter}
          searchQuery={searchQuery}
          fromDate={fromDate}
          toDate={toDate}
          onStatusChange={setStatusFilter}
          onLeaveTypeChange={setLeaveTypeFilter}
          onSearchChange={setSearchQuery}
          onFromDateChange={setFromDate}
          onToDateChange={setToDate}
          onPageChange={setAppsPage}
          onSelectApplication={(app) => setSelectedAppForDrawer(app)}
          onApproveQuick={(app) => void handleApproveQuick(app)}
          onRejectQuick={(app) => void handleRejectQuick(app)}
          canApprove={isHRorAdmin}
        />
      )}

      {activeTab === 'my-leave' && <MyLeaveView onRefreshParent={() => void fetchMasterData()} />}

      {activeTab === 'types' && (
        <LeaveTypesTab
          leaveTypes={leaveTypes}
          isLoading={isLoading}
          onRefresh={() => void fetchMasterData()}
          canManage={isHRorAdmin}
        />
      )}

      {activeTab === 'policies' && (
        <LeavePoliciesTab
          policies={policies}
          leaveTypes={leaveTypes}
          isLoading={isLoading}
          onRefresh={() => void fetchMasterData()}
          canManage={isHRorAdmin}
        />
      )}

      {activeTab === 'balances' && (
        <LeaveBalancesTab
          balances={balances}
          leaveTypes={leaveTypes}
          employees={employees}
          isLoading={isLoading}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          onRefresh={() => void fetchMasterData()}
          canManage={isHRorAdmin}
        />
      )}

      {activeTab === 'payroll-lop' && <PayrollLopTab employees={employees} />}

      {/* Detail Application Drawer */}
      {selectedAppForDrawer && (
        <LeaveApplicationDrawer
          application={selectedAppForDrawer}
          onClose={() => setSelectedAppForDrawer(null)}
          onUpdated={() => void fetchMasterData()}
          canApprove={isHRorAdmin}
          canRevoke={isHRorAdmin}
        />
      )}

      {/* Global Apply Leave Modal */}
      {isApplyModalOpen && (
        <ApplyLeaveModal
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          leaveTypes={leaveTypes}
          balances={balances}
          policies={policies}
          onSuccess={() => void fetchMasterData()}
        />
      )}

      {/* Global Adjust Balance Modal */}
      {isAdjustModalOpen && (
        <AdjustBalanceModal
          isOpen={isAdjustModalOpen}
          onClose={() => setIsAdjustModalOpen(false)}
          leaveTypes={leaveTypes}
          employees={employees}
          onAdjusted={() => {
            void fetchMasterData();
            alert('Balance adjustment recorded successfully!');
          }}
        />
      )}

      {/* Dedicated Rejection Reason Modal */}
      {isRejectModalOpen && (
        <RejectLeaveModal
          isOpen={isRejectModalOpen}
          onClose={() => {
            setIsRejectModalOpen(false);
            setAppToReject(null);
          }}
          application={appToReject}
          onRejected={() => void fetchMasterData()}
        />
      )}
    </div>
  );
}
