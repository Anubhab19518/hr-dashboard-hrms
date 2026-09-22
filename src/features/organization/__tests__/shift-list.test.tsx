import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ShiftList } from '../components/shift-list';
import { OrganizationService } from '../services/organization.service';
import type { Shift } from '../types/organization.types';

vi.mock('../services/organization.service', () => ({
  OrganizationService: {
    getShifts: vi.fn(),
    createShift: vi.fn(),
    updateShift: vi.fn(),
    deleteShift: vi.fn(),
  },
}));

const mockShift: Shift = {
  id: 'shift-1',
  name: 'General Day Shift',
  code: 'SFT-DAY',
  startTime: '09:00',
  endTime: '18:00',
  graceMinutes: 15,
  gracePeriodMinutes: 15,
  halfDayHours: 4,
  isOvernight: false,
  status: 'ACTIVE',
};

const mockShifts: Shift[] = [mockShift];

describe('ShiftList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders shift list with correct grace period minutes and hours', async () => {
    vi.mocked(OrganizationService.getShifts).mockResolvedValue(mockShifts);

    render(<ShiftList />);

    expect(await screen.findByText('General Day Shift')).toBeInTheDocument();
    expect(screen.getByText('CODE: SFT-DAY')).toBeInTheDocument();
    expect(screen.getByText('09:00 – 18:00')).toBeInTheDocument();
    expect(screen.getByText('15 mins')).toBeInTheDocument();
  });

  it('opens edit modal with pre-populated values and updates shift', async () => {
    vi.mocked(OrganizationService.getShifts).mockResolvedValue(mockShifts);
    vi.mocked(OrganizationService.updateShift).mockResolvedValue({
      ...mockShift,
      id: 'shift-1',
      name: 'Updated Morning Shift',
      graceMinutes: 20,
      gracePeriodMinutes: 20,
    });

    render(<ShiftList />);

    expect(await screen.findByText('General Day Shift')).toBeInTheDocument();

    const editBtn = screen.getByTitle('Edit Shift');
    fireEvent.click(editBtn);

    expect(screen.getByText('Edit Shift Schedule')).toBeInTheDocument();

    const saveBtn = screen.getByRole('button', { name: 'Save Changes' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(OrganizationService.updateShift).toHaveBeenCalledWith(
        'shift-1',
        expect.objectContaining({
          name: 'General Day Shift',
          code: 'SFT-DAY',
          startTime: '09:00',
          endTime: '18:00',
          gracePeriodMinutes: 15,
        }),
      );
    });
  });

  it('opens delete confirmation modal and removes shift on confirm', async () => {
    vi.mocked(OrganizationService.getShifts).mockResolvedValue(mockShifts);
    vi.mocked(OrganizationService.deleteShift).mockResolvedValue();

    render(<ShiftList />);

    expect(await screen.findByText('General Day Shift')).toBeInTheDocument();

    const deleteBtn = screen.getByTitle('Delete Shift');
    fireEvent.click(deleteBtn);

    expect(screen.getByText('Delete Shift Schedule')).toBeInTheDocument();
    expect(screen.getByText(/Deleting shift/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: 'Confirm Delete' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(OrganizationService.deleteShift).toHaveBeenCalledWith('shift-1');
    });

    expect(screen.queryByText('General Day Shift')).not.toBeInTheDocument();
  });
});
