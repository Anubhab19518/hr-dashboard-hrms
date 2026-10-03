import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EarlyCheckoutRequestsView } from '../components/early-checkout-requests-view';
import { RejectEarlyCheckoutModal } from '../components/reject-early-checkout-modal';
import { AttendanceService } from '../services/attendance.service';
import type { EarlyCheckoutRequest } from '../types/attendance.types';

vi.mock('../services/attendance.service', () => ({
  AttendanceService: {
    getEarlyCheckoutRequests: vi.fn(),
    getPendingEarlyCheckoutCount: vi.fn(),
    actionEarlyCheckoutRequest: vi.fn(),
  },
}));

vi.mock('@/lib/client/toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

const mockRequests: EarlyCheckoutRequest[] = [
  {
    id: 'req-1',
    employeeId: 'emp-1',
    employee: {
      name: 'John Doe',
      code: 'EMP001',
      department: 'Engineering',
      role: 'Frontend Engineer',
    },
    scheduledShiftEndTime: '18:00',
    requestedCheckoutTime: '16:00',
    reason: 'Doctor appointment',
    status: 'PENDING',
    requestedAt: '2026-10-03T10:00:00Z',
  },
  {
    id: 'req-2',
    employeeId: 'emp-2',
    employee: {
      name: 'Sarah Connor',
      code: 'EMP002',
      department: 'Operations',
      role: 'Site Supervisor',
    },
    scheduledShiftEndTime: '19:00',
    requestedCheckoutTime: '17:30',
    reason: 'Family event',
    status: 'APPROVED',
    requestedAt: '2026-10-03T09:00:00Z',
  },
];

describe('EarlyCheckoutRequestsView & RejectModal Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders table and handles approve action optimistically', async () => {
    vi.mocked(AttendanceService.getEarlyCheckoutRequests).mockResolvedValueOnce({
      items: mockRequests,
      total: 2,
      page: 1,
      limit: 20,
      pendingCount: 1,
    });
    vi.mocked(AttendanceService.actionEarlyCheckoutRequest).mockResolvedValueOnce({
      ...mockRequests[0]!,
      status: 'APPROVED',
    });

    render(<EarlyCheckoutRequestsView />);

    expect(screen.getByText(/Loading early check-out requests/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText(/Doctor appointment/i)).toBeInTheDocument();
      expect(screen.getByText('Sarah Connor')).toBeInTheDocument();
    });

    // Click Approve on John Doe's request
    const approveBtn = screen.getByRole('button', { name: /^Approve$/i });
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(AttendanceService.actionEarlyCheckoutRequest).toHaveBeenCalledWith('req-1', {
        action: 'APPROVE',
      });
    });
  });

  it('opens reject modal and submits rejection reason', async () => {
    vi.mocked(AttendanceService.getEarlyCheckoutRequests).mockResolvedValueOnce({
      items: [mockRequests[0]!],
      total: 1,
      page: 1,
      limit: 20,
      pendingCount: 1,
    });
    vi.mocked(AttendanceService.actionEarlyCheckoutRequest).mockResolvedValueOnce({
      ...mockRequests[0]!,
      status: 'REJECTED',
      rejectionReason: 'Shift coverage needed',
    });

    render(<EarlyCheckoutRequestsView />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click Reject button in action column
    const rejectBtn = screen.getByRole('button', { name: /^Reject$/i });
    fireEvent.click(rejectBtn);

    // Modal opens
    expect(screen.getByText(/Reject Early Check-Out Request/i)).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/Explain why this request is being rejected/i);
    fireEvent.change(textarea, { target: { value: 'Shift coverage needed' } });

    const confirmRejectBtn = screen.getByRole('button', { name: /Confirm Rejection/i });
    fireEvent.click(confirmRejectBtn);

    await waitFor(() => {
      expect(AttendanceService.actionEarlyCheckoutRequest).toHaveBeenCalledWith('req-1', {
        action: 'REJECT',
        rejectionReason: 'Shift coverage needed',
      });
    });
  });

  it('validates empty rejection reason in RejectEarlyCheckoutModal', async () => {
    const onConfirmReject = vi.fn();
    const onClose = vi.fn();

    render(
      <RejectEarlyCheckoutModal
        isOpen={true}
        onClose={onClose}
        request={mockRequests[0]!}
        onConfirmReject={onConfirmReject}
      />,
    );

    const confirmBtn = screen.getByRole('button', { name: /Confirm Rejection/i });
    fireEvent.click(confirmBtn);

    expect(screen.getByText(/Please provide a brief reason for rejecting/i)).toBeInTheDocument();
    expect(onConfirmReject).not.toHaveBeenCalled();
  });
});
