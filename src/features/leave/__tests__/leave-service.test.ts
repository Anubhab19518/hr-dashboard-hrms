import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LeaveService } from '../services/leave.service';
import { apiClient } from '@/lib/client/api-client';
import {
  LeaveGender,
  LeaveStatus,
  HalfDayType,
  AccrualType,
  type LeavePolicy,
} from '../types/leave.types';

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

    it('uploads supporting document', async () => {
      const mockFile = new File(['dummy'], 'medical.pdf', { type: 'application/pdf' });
      vi.mocked(apiClient).mockResolvedValueOnce({
        document: { id: 'doc-1', fileName: 'medical.pdf' },
      });

      const doc = await LeaveService.uploadApplicationDocument('app-1', mockFile);
      expect(doc.id).toBe('doc-1');
      expect(apiClient).toHaveBeenCalledWith(
        '/leave/applications/app-1/documents',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('fetches my applications history', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({
        data: [{ id: 'app-1', status: LeaveStatus.APPROVED }],
        total: 1,
        page: 1,
        limit: 10,
      });

      const res = await LeaveService.getMyApplications({ page: 1, limit: 10 });
      expect(res.applications.length).toBe(1);
    });
  });

  describe('HR Approvals & Review Endpoints', () => {
    it('fetches applications with filters', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({
        data: [{ id: 'app-1', employeeId: 'emp-1', status: LeaveStatus.PENDING }],
        total: 1,
        page: 1,
        limit: 10,
      });

      const res = await LeaveService.getApplications({
        status: 'PENDING',
        employeeId: 'emp-1',
        page: 1,
        limit: 10,
      });
      expect(res.applications.length).toBe(1);
    });

    it('approves a leave application with comments', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({
        application: { id: 'app-1', status: LeaveStatus.APPROVED },
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
        application: { id: 'app-1', status: LeaveStatus.REJECTED },
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
        application: { id: 'app-1', status: LeaveStatus.REVOKED },
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
    it('fetches, creates, and updates leave types', async () => {
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

      vi.mocked(apiClient)
        .mockResolvedValueOnce({ types: [{ id: 'lt-1', ...payload }] })
        .mockResolvedValueOnce({ type: { id: 'lt-1', ...payload } })
        .mockResolvedValueOnce({ type: { id: 'lt-1', ...payload, name: 'CL Updated' } })
        .mockResolvedValueOnce({});

      const list = await LeaveService.getLeaveTypes();
      expect(list.length).toBe(1);

      const created = await LeaveService.createLeaveType(payload);
      expect(created.id).toBe('lt-1');

      const updated = await LeaveService.updateLeaveType('lt-1', { name: 'CL Updated' });
      expect(updated.name).toBe('CL Updated');

      await LeaveService.deleteLeaveType('lt-1');
      expect(apiClient).toHaveBeenCalledWith('/leave/types/lt-1', { method: 'DELETE' });
    });

    it('fetches policies without hydration', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({
        policies: [{ id: 'pol-1', name: 'Policy 1' }],
      });
      const policies = await LeaveService.getPolicies(false);
      expect(policies.length).toBe(1);
    });

    it('fetches single policy with details', async () => {
      vi.mocked(apiClient)
        .mockResolvedValueOnce({ policy: { id: 'pol-1', name: 'Policy 1', assignments: [] } })
        .mockResolvedValueOnce({ assignments: [] });

      const single = await LeaveService.getPolicy('pol-1');
      expect(single.id).toBe('pol-1');
    });

    it('creates, updates, and deletes policy', async () => {
      const payload = {
        name: 'Standard Policy 2026',
        effectiveFrom: '2026-01-01',
        entitlements: [
          {
            leaveTypeId: 'lt-1',
            quotaDays: 12,
            accrualType: AccrualType.UPFRONT,
          },
        ],
      };

      vi.mocked(apiClient)
        .mockResolvedValueOnce({ policy: { id: 'pol-1', ...payload } })
        .mockResolvedValueOnce({ policy: { id: 'pol-1', ...payload, name: 'Updated Policy' } })
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('404 delete failed'))
        .mockResolvedValueOnce({});

      const created = await LeaveService.createPolicy(payload);
      expect(created.id).toBe('pol-1');

      const updated = await LeaveService.updatePolicy('pol-1', { name: 'Updated Policy' });
      expect(updated.name).toBe('Updated Policy');

      await LeaveService.deletePolicy('pol-1');
      expect(apiClient).toHaveBeenCalledWith('/leave/policies/pol-1', { method: 'DELETE' });

      // Fallback soft-delete test
      await LeaveService.deletePolicy('pol-1');
      expect(apiClient).toHaveBeenCalledWith('/leave/policies/pol-1', {
        method: 'PATCH',
        body: expect.stringContaining('"isActive":false'),
      });
    });

    it('assigns policy and fetches policy assignments', async () => {
      vi.mocked(apiClient)
        .mockResolvedValueOnce({
          assignment: { id: 'asgn-1', policyId: 'pol-1', employeeId: 'emp-1' },
        })
        .mockResolvedValueOnce({ assignments: [{ id: 'asgn-1', policyId: 'pol-1' }] });

      const assigned = await LeaveService.assignPolicy('pol-1', {
        employeeId: 'emp-1',
        effectiveFrom: '2026-01-01',
      });
      expect(assigned.id).toBe('asgn-1');

      const asgns = await LeaveService.getPolicyAssignments('pol-1');
      expect(asgns.length).toBe(1);
    });
  });

  describe('Policy Resolution & Auto Provisioning', () => {
    it('resolves employee override policy, company policy, and fallback standard policy', async () => {
      const policies: LeavePolicy[] = [
        {
          id: 'pol-emp',
          name: 'Emp Policy',
          companyId: 'comp-emp',
          isCustomCompanyPolicy: true,
          effectiveFrom: '2026-01-01',
          isActive: true,
          assignments: [
            {
              id: 'a1',
              policyId: 'pol-emp',
              employeeId: 'emp-target',
              effectiveFrom: '2026-01-01',
            },
          ],
        },
        {
          id: 'pol-comp',
          name: 'Company Policy',
          companyId: 'comp-1',
          isCustomCompanyPolicy: true,
          effectiveFrom: '2026-01-01',
          isActive: true,
        },
        {
          id: 'pol-standard',
          name: 'Standard Workspace Policy',
          effectiveFrom: '2026-01-01',
          isActive: true,
        },
      ];

      // 1. Employee match
      const empRes = await LeaveService.resolveEmployeeEffectivePolicy({
        employeeId: 'emp-target',
        companyId: 'comp-1',
        policies,
      });
      expect(empRes?.id).toBe('pol-emp');

      // 2. Company match
      const compRes = await LeaveService.resolveEmployeeEffectivePolicy({
        employeeId: 'emp-other',
        companyId: 'comp-1',
        policies,
      });
      expect(compRes?.id).toBe('pol-comp');

      // 3. Fallback standard match
      const stdRes = await LeaveService.resolveEmployeeEffectivePolicy({
        employeeId: 'emp-other',
        companyId: 'comp-other',
        policies,
      });
      expect(stdRes?.id).toBe('pol-standard');
    });

    it('provisions company employee balances with monthly and quarterly accrual', async () => {
      const policy: LeavePolicy = {
        id: 'pol-1',
        name: 'Auto Policy',
        effectiveFrom: '2026-01-01',
        isActive: true,
        entitlements: [
          { leaveTypeId: 'lt-1', annualQuota: 12, accrualType: AccrualType.MONTHLY },
          { leaveTypeId: 'lt-2', annualQuota: 8, accrualType: AccrualType.QUARTERLY },
        ],
      };

      vi.mocked(apiClient)
        // Employee list
        .mockResolvedValueOnce({
          records: [{ id: 'emp-1', userId: 'u-1', companyId: 'c-1', status: 'ACTIVE' }],
        })
        // Adjust balance 1
        .mockResolvedValueOnce({ id: 'b1' })
        .mockResolvedValueOnce({ id: 'b1-dup' })
        // Adjust balance 2
        .mockResolvedValueOnce({ id: 'b2' })
        .mockResolvedValueOnce({ id: 'b2-dup' });

      const result = await LeaveService.provisionCompanyEmployeeBalances('c-1', policy, 2026);
      expect(result.employeeCount).toBe(1);
      expect(result.provisionedCount).toBeGreaterThan(0);
    });
  });

  describe('Balances & Payroll LOP', () => {
    it('fetches employee balances with fallback to getMyBalances on error', async () => {
      // Primary /leave/balances endpoint succeeds
      vi.mocked(apiClient).mockResolvedValueOnce({
        balances: [{ id: 'b1', leaveTypeId: 'lt-1', year: 2026 }],
      });

      const res1 = await LeaveService.getEmployeeBalances({ employeeId: 'emp-1', year: 2026 });
      expect(res1.length).toBe(1);

      // Primary fails, fallback to getMyBalances
      vi.mocked(apiClient)
        .mockRejectedValueOnce(new Error('404 not found'))
        .mockResolvedValueOnce({ balances: [{ id: 'b2', leaveTypeId: 'lt-1', year: 2026 }] });

      const res2 = await LeaveService.getEmployeeBalances({ year: 2026 });
      expect(res2.length).toBe(1);
    });

    it('adjusts employee leave balance', async () => {
      const input = {
        employeeId: 'emp-1',
        leaveTypeId: 'lt-1',
        year: 2026,
        adjustment: 2.5,
        reason: 'Comp-off granted',
      };

      vi.mocked(apiClient).mockResolvedValueOnce({
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
        data: mockSummary,
      });

      const res = await LeaveService.getPayrollLop('emp-1', 10, 2026);
      expect(apiClient).toHaveBeenCalledWith(
        '/leave/employees/emp-1/payroll-lop?month=10&year=2026',
      );
      expect(res.totalLopDays).toBe(3);
    });

    it('fetches employee applications list for holiday calendar', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({
        data: [{ id: 'app-1', employeeId: 'emp-1', status: LeaveStatus.APPROVED }],
      });

      const apps = await LeaveService.getEmployeeApplications('emp-1', 'APPROVED');
      expect(apps.length).toBe(1);
      expect(apps[0]!.id).toBe('app-1');
    });

    it('handles all unwrapList payload response variations (rows, items, list, results, applications)', async () => {
      vi.mocked(apiClient)
        .mockResolvedValueOnce([{ id: 'direct-array' }])
        .mockResolvedValueOnce({ rows: [{ id: 'from-rows' }] })
        .mockResolvedValueOnce({ items: [{ id: 'from-items' }] })
        .mockResolvedValueOnce({ list: [{ id: 'from-list' }] })
        .mockResolvedValueOnce({ results: [{ id: 'from-results' }] })
        .mockResolvedValueOnce({ applications: [{ id: 'from-apps' }] })
        .mockResolvedValueOnce({ record: { id: 'single-rec' } })
        .mockResolvedValueOnce('string-primitive');

      const r1 = await LeaveService.getMyBalances();
      expect(r1.length).toBe(1);

      const r2 = await LeaveService.getMyBalances();
      expect(r2.length).toBe(1);

      const r3 = await LeaveService.getMyBalances();
      expect(r3.length).toBe(1);

      const r4 = await LeaveService.getMyBalances();
      expect(r4.length).toBe(1);

      const r5 = await LeaveService.getMyBalances();
      expect(r5.length).toBe(1);

      const r6 = await LeaveService.getMyBalances();
      expect(r6.length).toBe(1);

      const e1 = await LeaveService.applyLeave({
        leaveTypeId: 'lt-1',
        fromDate: '2026-01-01',
        toDate: '2026-01-02',
      });
      expect(e1.id).toBe('single-rec');

      const e2 = await LeaveService.applyLeave({
        leaveTypeId: 'lt-1',
        fromDate: '2026-01-01',
        toDate: '2026-01-02',
      });
      expect(e2).toBe('string-primitive');
    });
  });
});
