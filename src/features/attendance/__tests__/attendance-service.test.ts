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
});
