import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AttendanceService } from '../services/attendance.service';
import { apiClient } from '@/lib/client/api-client';

vi.mock('@/lib/client/api-client', () => ({
  apiClient: vi.fn(),
}));

describe('AttendanceService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches attendance logs with query params and fallback', async () => {
    vi.mocked(apiClient).mockResolvedValueOnce({
      status: 'success',
      data: [{ id: 'att-1', employeeId: 'emp-1', status: 'PRESENT' }],
    });

    const logs = await AttendanceService.getLogs({
      date: '2026-09-30',
      employeeId: 'emp-1',
      page: 1,
      limit: 10,
    });
    expect(logs.length).toBe(1);
    expect(logs[0]!.status).toBe('PRESENT');

    // Test fallback path
    vi.mocked(apiClient)
      .mockRejectedValueOnce(new Error('Endpoint not found'))
      .mockResolvedValueOnce({
        logs: [{ id: 'att-2', employeeId: 'emp-2', status: 'LATE' }],
      });

    const fallbackLogs = await AttendanceService.getLogs({ employeeId: 'emp-2' });
    expect(fallbackLogs.length).toBe(1);
    expect(fallbackLogs[0]!.status).toBe('LATE');
  });

  it('fetches daily attendance summary with fallback', async () => {
    const mockSummary = {
      date: '2026-09-30',
      totalExpected: 50,
      totalPresent: 45,
      totalAbsent: 3,
      totalLate: 2,
      onLeave: 0,
      geofenceCompliancePercentage: 98,
    };

    vi.mocked(apiClient).mockResolvedValueOnce({
      summary: mockSummary,
    });

    const summary = await AttendanceService.getDailySummary('2026-09-30');
    expect(summary.totalExpected).toBe(50);
    expect(summary.totalPresent).toBe(45);

    // Fallback path
    vi.mocked(apiClient).mockRejectedValueOnce(new Error('Fail')).mockResolvedValueOnce({
      summary: mockSummary,
    });

    const fallbackSummary = await AttendanceService.getDailySummary();
    expect(fallbackSummary.totalExpected).toBe(50);
  });

  it('records attendance punch with fallback', async () => {
    vi.mocked(apiClient).mockResolvedValueOnce({
      log: { id: 'att-new', employeeId: 'emp-1', status: 'PRESENT' },
    });

    const punch = await AttendanceService.recordAttendance({
      employeeId: 'emp-1',
      timestamp: '2026-09-30T09:00:00Z',
      logType: 'CHECK_IN',
      verificationMethod: 'FACE',
    });
    expect(punch.id).toBe('att-new');

    // Fallback path
    vi.mocked(apiClient)
      .mockRejectedValueOnce(new Error('Check-in error'))
      .mockResolvedValueOnce({
        log: { id: 'att-fallback', employeeId: 'emp-1', status: 'PRESENT' },
      });

    const fallbackPunch = await AttendanceService.recordAttendance({
      employeeId: 'emp-1',
      timestamp: '2026-09-30T09:00:00Z',
      logType: 'CHECK_IN',
      verificationMethod: 'FACE',
    });
    expect(fallbackPunch.id).toBe('att-fallback');
  });

  it('fetches early checkout requests (array, object, and fallback formats)', async () => {
    // 1. Array response
    vi.mocked(apiClient).mockResolvedValueOnce([
      {
        id: 'ec-1',
        employeeId: 'emp-1',
        scheduledShiftEndTime: '17:00',
        requestedCheckoutTime: '15:00',
        reason: 'Medical appointment',
        status: 'PENDING',
        requestedAt: '2026-10-03T14:00:00Z',
      },
    ]);

    const res1 = await AttendanceService.getEarlyCheckoutRequests({ status: 'PENDING' });
    expect(res1.items.length).toBe(1);
    expect(res1.total).toBe(1);
    expect(res1.pendingCount).toBe(1);

    // 2. Object response with items and pendingCount
    vi.mocked(apiClient).mockResolvedValueOnce({
      items: [
        {
          id: 'ec-2',
          employeeId: 'emp-2',
          scheduledShiftEndTime: '18:00',
          requestedCheckoutTime: '16:00',
          reason: 'Family emergency',
          status: 'APPROVED',
          requestedAt: '2026-10-03T12:00:00Z',
        },
      ],
      total: 15,
      page: 2,
      limit: 10,
      pendingCount: 3,
    });

    const res2 = await AttendanceService.getEarlyCheckoutRequests({
      status: 'ALL',
      page: 2,
      limit: 10,
      search: 'emp',
      startDate: '2026-10-01',
      endDate: '2026-10-03',
    });
    expect(res2.items.length).toBe(1);
    expect(res2.total).toBe(15);
    expect(res2.page).toBe(2);
    expect(res2.pendingCount).toBe(3);

    // 3. Fallback path
    vi.mocked(apiClient)
      .mockRejectedValueOnce(new Error('HR endpoint failed'))
      .mockResolvedValueOnce({
        requests: [
          {
            id: 'ec-3',
            employeeId: 'emp-3',
            scheduledShiftEndTime: '19:00',
            requestedCheckoutTime: '17:00',
            reason: 'Transit issue',
            status: 'PENDING',
            requestedAt: '2026-10-03T13:00:00Z',
          },
        ],
        total: 1,
      });

    const res3 = await AttendanceService.getEarlyCheckoutRequests();
    expect(res3.items.length).toBe(1);
    expect(res3.items[0]!.id).toBe('ec-3');
  });

  it('fetches pending early checkout count and handles failures', async () => {
    vi.mocked(apiClient).mockResolvedValueOnce({
      pendingCount: 5,
      total: 5,
      items: [],
    });

    const count = await AttendanceService.getPendingEarlyCheckoutCount();
    expect(count).toBe(5);

    // Error case returns 0
    vi.mocked(apiClient)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Fallback failed'));
    const zeroCount = await AttendanceService.getPendingEarlyCheckoutCount();
    expect(zeroCount).toBe(0);
  });

  it('approves and rejects early checkout requests with fallback', async () => {
    // Approve
    vi.mocked(apiClient).mockResolvedValueOnce({
      request: {
        id: 'ec-1',
        employeeId: 'emp-1',
        status: 'APPROVED',
        scheduledShiftEndTime: '17:00',
        requestedCheckoutTime: '15:00',
        reason: 'Dentist',
        requestedAt: '2026-10-03T10:00:00Z',
      },
    });

    const approved = await AttendanceService.actionEarlyCheckoutRequest('ec-1', {
      action: 'APPROVE',
    });
    expect(approved.status).toBe('APPROVED');

    // Reject with fallback
    vi.mocked(apiClient)
      .mockRejectedValueOnce(new Error('Primary failed'))
      .mockResolvedValueOnce({
        request: {
          id: 'ec-2',
          employeeId: 'emp-2',
          status: 'REJECTED',
          rejectionReason: 'Understaffed',
          scheduledShiftEndTime: '17:00',
          requestedCheckoutTime: '15:00',
          reason: 'Errand',
          requestedAt: '2026-10-03T10:00:00Z',
        },
      });

    const rejected = await AttendanceService.actionEarlyCheckoutRequest('ec-2', {
      action: 'REJECT',
      rejectionReason: 'Understaffed',
    });
    expect(rejected.status).toBe('REJECTED');
    expect(rejected.rejectionReason).toBe('Understaffed');
  });
});
