import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HolidayCalendarList } from '../components/holiday-calendar-list';
import { HolidayService } from '../services/holiday.service';
import type { HolidayCalendar } from '../types/holiday.types';

vi.mock('../services/holiday.service', () => ({
  HolidayService: {
    getCalendars: vi.fn(),
    getCalendar: vi.fn(),
    createCalendar: vi.fn(),
    updateCalendar: vi.fn(),
    deleteCalendar: vi.fn(),
    addCalendarDay: vi.fn(),
    updateCalendarDay: vi.fn(),
    removeCalendarDay: vi.fn(),
  },
}));

vi.mock('@/lib/client/auth-store', () => ({
  useAuthStore: vi.fn((selector) =>
    selector({
      user: {
        id: 'usr_admin',
        name: 'Super Admin',
        email: 'admin@company.com',
        role: 'SUPER_ADMIN',
        roles: ['SUPER_ADMIN'],
        permissions: ['holiday:read', 'holiday:create', 'holiday:update', 'holiday:delete'],
      },
    }),
  ),
}));

const mockCalendars: HolidayCalendar[] = [
  {
    id: 'cal_1',
    name: 'National Standard India 2026',
    code: 'IND_STD_2026',
    year: 2026,
    isBaseline: true,
    isActive: true,
    description: 'Statutory national calendar',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cal_2',
    name: 'Regional IT Ops 2026',
    code: 'REG_IT_2026',
    year: 2026,
    isBaseline: false,
    isActive: true,
    description: 'Custom IT shift calendar',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

describe('HolidayCalendarList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(HolidayService.getCalendars).mockResolvedValue(mockCalendars);
  });

  it('renders calendar list with year selector and calendars', async () => {
    render(<HolidayCalendarList />);

    expect(screen.getByText(/Loading holiday calendars/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('National Standard India 2026')).toBeInTheDocument();
      expect(screen.getByText('Regional IT Ops 2026')).toBeInTheDocument();
    });

    expect(screen.getByText('IND_STD_2026')).toBeInTheDocument();
    expect(screen.getByText('REG_IT_2026')).toBeInTheDocument();
    expect(screen.getByText('Baseline')).toBeInTheDocument();
  });

  it('disables delete button for baseline calendar', async () => {
    render(<HolidayCalendarList />);

    await waitFor(() => {
      expect(screen.getByText('National Standard India 2026')).toBeInTheDocument();
    });

    expect(screen.getByTitle('Baseline calendars cannot be deleted')).toBeInTheDocument();
  });

  it('opens Create Calendar modal on click', async () => {
    render(<HolidayCalendarList />);

    await waitFor(() => {
      expect(screen.getByText('Create Calendar')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Create Calendar'));

    await waitFor(() => {
      expect(screen.getByText('Create Holiday Calendar')).toBeInTheDocument();
    });
  });
});
