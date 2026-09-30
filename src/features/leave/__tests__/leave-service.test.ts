import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LeaveService } from '../services/leave.service';
import { apiClient } from '@/lib/client/api-client';
import { LeaveGender, LeaveStatus, HalfDayType, AccrualType } from '../types/leave.types';

vi.mock('@/lib/client/api-client', () => ({
  apiClient: vi.fn(),
}));

describe('LeaveService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Self-Service Endpoints', () => {
    it('fetches user balances with year filter', async () => {
      const mockBalances = [
        {
          id: 'bal-1',
          leaveTypeId: 'type-1',
          year: 2026,
          openingBalance: 12,
          accrued: 4,
          used: 2,
          lopDays: 0,
          adjusted: 0,
          closingBalance: 14,
        },
      ];

      vi.mocked(apiClient).mockResolvedValueOnce({
        status: 'success',
        data: mockBalances,
      });

      const res = await LeaveService.getMyBalances(2026);
      expect(apiClient).toHaveBeenCalledWith('/leave/balances/me?year=2026');
      expect(res).toEqual(mockBalances);
    });

    it('submits a leave application', async () => {
      const input = {
        leaveTypeId: 'type-1',
        fromDate: '2026-10-05',
        toDate: '2026-10-06',
        fromHalf: HalfDayType.FULL,
        toHalf: HalfDayType.FULL,
        reason: 'Family vacation',
      };

      const mockResponse = {
        id: 'app-1',
        ...input,
        appliedDays: 2,
        status: LeaveStatus.PENDING,
        createdAt: '2026-09-25T06:00:00.000Z',
      };

      vi.mocked(apiClient).mockResolvedValueOnce({
        status: 'success',
        data: mockResponse,
      });

      const res = await LeaveService.applyLeave(input);
      expect(apiClient).toHaveBeenCalledWith('/leave/applications/apply', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      expect(res.id).toBe('app-1');
    });

    it('cancels pending application with reason', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({
        status: 'success',
        data: { id: 'app-1', status: LeaveStatus.CANCELLED },
      });

      const res = await LeaveService.cancelMyApplication('app-1', 'Rescheduled');
      expect(apiClient).toHaveBeenCalledWith('/leave/applications/app-1/cancel', {
        method: 'PATCH',
        body: JSON.stringify({ cancellationReason: 'Rescheduled' }),
      });
      expect(res.status).toBe(LeaveStatus.CANCELLED);
    });
  });

  describe('HR Approvals & Review Endpoints', () => {
    it('approves a leave application with comments', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({
        status: 'success',
        data: { id: 'app-1', status: LeaveStatus.APPROVED },
      });

      const res = await LeaveService.approveApplication('app-1', 'Approved coverage confirmed');
      expect(apiClient).toHaveBeenCalledWith(
        '/leave/applications/app-1/approve',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Approved coverage confirmed'),
        }),
      );
      expect(res.status).toBe(LeaveStatus.APPROVED);
    });

    it('rejects a leave application', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({
        status: 'success',
        data: { id: 'app-1', status: LeaveStatus.REJECTED },
      });

      const res = await LeaveService.rejectApplication('app-1', 'Critical deadline');
      expect(apiClient).toHaveBeenCalledWith(
        '/leave/applications/app-1/reject',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Critical deadline'),
        }),
      );
      expect(res.status).toBe(LeaveStatus.REJECTED);
    });

    it('revokes an approved leave application', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({
        status: 'success',
        data: { id: 'app-1', status: LeaveStatus.REVOKED },
      });

      const res = await LeaveService.revokeApplication('app-1', 'Emergency recall');
      expect(apiClient).toHaveBeenCalledWith(
        '/leave/applications/app-1/revoke',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Emergency recall'),
        }),
      );
      expect(res.status).toBe(LeaveStatus.REVOKED);
    });
  });

  describe('Leave Types & Policies', () => {
    it('creates a leave type', async () => {
      const payload = {
        name: 'Casual Leave',
        code: 'CL',
        isPaid: true,
        isCarryForward: false,
        isEncashable: false,
        requiresDocument: false,
        minDaysNotice: 2,
        applicableGender: LeaveGender.ALL,
        isActive: true,
      };

      vi.mocked(apiClient).mockResolvedValueOnce({
        status: 'success',
        data: { id: 'lt-1', ...payload },
      });

      const res = await LeaveService.createLeaveType(payload);
      expect(apiClient).toHaveBeenCalledWith('/leave/types', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      expect(res.id).toBe('lt-1');
    });

    it('creates a policy with entitlements', async () => {
      const payload = {
        name: 'Standard Corporate Policy 2026',
        effectiveFrom: '2026-01-01',
        entitlements: [
          {
            leaveTypeId: 'lt-1',
            quotaDays: 12,
            accrualType: AccrualType.UPFRONT,
          },
        ],
      };

      vi.mocked(apiClient).mockResolvedValueOnce({
        status: 'success',
        data: { id: 'pol-1', ...payload },
      });

      const res = await LeaveService.createPolicy(payload);
      expect(apiClient).toHaveBeenCalledWith('/leave/policies', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      expect(res.id).toBe('pol-1');
    });
  });

  describe('Balances & Payroll LOP', () => {
    it('adjusts employee leave balance', async () => {
      const input = {
        employeeId: 'emp-1',
        leaveTypeId: 'lt-1',
        year: 2026,
        adjustment: 2.5,
        reason: 'Comp-off granted',
      };

      vi.mocked(apiClient).mockResolvedValueOnce({
        status: 'success',
        data: { id: 'bal-1', ...input, closingBalance: 14.5 },
      });

      const res = await LeaveService.adjustBalance(input);
      expect(apiClient).toHaveBeenCalledWith(
        '/leave/balances/adjust',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"employeeId":"emp-1"'),
        }),
      );
      expect(res.closingBalance).toBe(14.5);
    });

    it('fetches payroll LOP breakdown for employee', async () => {
      const mockSummary = {
        employeeId: 'emp-1',
        period: { month: 10, year: 2026 },
        leaveBreakdown: [
          { leaveTypeCode: 'CL', leaveTypeName: 'Casual Leave', isPaid: true, approvedDays: 2 },
          { leaveTypeCode: 'LOP', leaveTypeName: 'Loss of Pay', isPaid: false, approvedDays: 3 },
        ],
        totalLopDays: 3,
        totalPaidLeaveDays: 2,
      };

      vi.mocked(apiClient).mockResolvedValueOnce({
        status: 'success',
        data: mockSummary,
      });

      const res = await LeaveService.getPayrollLop('emp-1', 10, 2026);
      expect(apiClient).toHaveBeenCalledWith(
        '/leave/employees/emp-1/payroll-lop?month=10&year=2026',
      );
      expect(res.totalLopDays).toBe(3);
    });
  });
});
