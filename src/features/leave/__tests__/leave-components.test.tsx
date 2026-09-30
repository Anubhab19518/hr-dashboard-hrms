import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LeaveDashboard } from '../components/leave-dashboard';
import { MyLeaveView } from '../components/my-leave-view';
import { LeaveService } from '../services/leave.service';
import { EmployeeService } from '@/features/employees';
import { OrganizationService } from '@/features/organization';
import { LeaveStatus, LeaveGender, HalfDayType } from '../types/leave.types';

vi.mock('../services/leave.service', () => ({
  LeaveService: {
    getLeaveTypes: vi.fn(),
    getPolicies: vi.fn(),
    getEmployeeBalances: vi.fn(),
    getApplications: vi.fn(),
    getMyBalances: vi.fn(),
    getMyApplications: vi.fn(),
    applyLeave: vi.fn(),
    cancelMyApplication: vi.fn(),
    approveApplication: vi.fn(),
    rejectApplication: vi.fn(),
    revokeApplication: vi.fn(),
    createLeaveType: vi.fn(),
    createPolicy: vi.fn(),
    adjustBalance: vi.fn(),
    getPayrollLop: vi.fn(),
  },
}));

vi.mock('@/features/employees', () => ({
  EmployeeService: {
    getEmployees: vi.fn(),
  },
}));

vi.mock('@/features/organization', () => ({
  OrganizationService: {
    getCompanies: vi.fn(),
  },
}));

describe('Leave Management Components', () => {
  const mockLeaveTypes = [
    {
      id: 'lt-1',
      name: 'Casual Leave',
      code: 'CL',
      isPaid: true,
      isCarryForward: false,
      isEncashable: false,
      requiresDocument: false,
      minDaysNotice: 1,
      applicableGender: LeaveGender.ALL,
      isActive: true,
    },
    {
      id: 'lt-2',
      name: 'Sick Leave',
      code: 'SL',
      isPaid: true,
      isCarryForward: true,
      maxCarryForwardDays: 5,
      isEncashable: false,
      requiresDocument: true,
      minDaysNotice: 0,
      applicableGender: LeaveGender.ALL,
      isActive: true,
    },
  ];

  const mockApplications = [
    {
      id: 'app-1',
      employeeId: 'emp-1',
      employeeName: 'Attharva Gupta',
      employeeCode: 'EMP002',
      leaveTypeId: 'lt-1',
      leaveTypeName: 'Casual Leave',
      fromDate: '2026-10-05',
      toDate: '2026-10-06',
      fromHalf: HalfDayType.FULL,
      toHalf: HalfDayType.FULL,
      appliedDays: 2,
      reason: 'Family event',
      status: LeaveStatus.PENDING,
      createdAt: '2026-09-25T06:00:00.000Z',
      updatedAt: '2026-09-25T06:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(LeaveService.getLeaveTypes).mockResolvedValue(mockLeaveTypes);
    vi.mocked(LeaveService.getPolicies).mockResolvedValue([]);
    vi.mocked(LeaveService.getEmployeeBalances).mockResolvedValue([]);
    vi.mocked(LeaveService.getApplications).mockResolvedValue({
      applications: mockApplications,
      total: 1,
      page: 1,
      limit: 20,
    });
    vi.mocked(LeaveService.getMyBalances).mockResolvedValue([
      {
        id: 'bal-1',
        leaveTypeId: 'lt-1',
        year: 2026,
        openingBalance: 12,
        accrued: 4,
        used: 2,
        lopDays: 0,
        adjusted: 0,
        closingBalance: 14,
      },
    ]);
    vi.mocked(LeaveService.getMyApplications).mockResolvedValue({
      applications: mockApplications,
      total: 1,
      page: 1,
      limit: 15,
    });
    vi.mocked(OrganizationService.getCompanies).mockResolvedValue([]);
    vi.mocked(EmployeeService.getEmployees).mockResolvedValue({
      records: [],
      pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
    });
  });

  it('renders LeaveDashboard with master header and navigation tabs', async () => {
    render(<LeaveDashboard />);

    expect(screen.getByText('Leave Management & Time-Off System')).toBeInTheDocument();
    expect(screen.getByText('Overview & Metrics')).toBeInTheDocument();
    expect(screen.getByText('Approval Queue')).toBeInTheDocument();
    expect(screen.getByText('My Leave (Self-Service)')).toBeInTheDocument();
    expect(screen.getByText('Leave Types')).toBeInTheDocument();
    expect(screen.getByText('Policies & Quotas')).toBeInTheDocument();
    expect(screen.getByText('Employee Balances')).toBeInTheDocument();

    await waitFor(() => {
      expect(LeaveService.getLeaveTypes).toHaveBeenCalled();
    });
  });

  it('switches to Approval Queue tab and renders pending applications', async () => {
    render(<LeaveDashboard />);

    const approvalsTab = screen.getByText('Approval Queue');
    fireEvent.click(approvalsTab);

    await waitFor(() => {
      expect(screen.getByText('Leave Approval Queue & Applications')).toBeInTheDocument();
      expect(screen.getByText('Attharva Gupta')).toBeInTheDocument();
    });
  });

  it('renders MyLeaveView with balance cards and history table', async () => {
    render(<MyLeaveView />);

    await waitFor(() => {
      expect(screen.getByText(/My Leave & Balances/)).toBeInTheDocument();
      expect(screen.getByText('14')).toBeInTheDocument(); // 14 days available
      expect(screen.getByText('Apply for Leave')).toBeInTheDocument();
    });
  });
});
