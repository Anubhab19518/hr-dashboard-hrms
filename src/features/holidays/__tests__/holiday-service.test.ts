import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HolidayService } from '../services/holiday.service';
import { apiClient } from '@/lib/client/api-client';
import { HolidayType, OverrideType } from '../types/holiday.types';

vi.mock('@/lib/client/api-client', () => ({
  apiClient: vi.fn(),
}));

describe('HolidayService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Holiday Calendars', () => {
    it('fetches calendars with year and status parameters', async () => {
      const mockCalendars = [
        {
          id: 'cal-1',
          name: 'India Standard 2026',
          code: 'IND_STD_2026',
          year: 2026,
          isBaseline: true,
          status: 'ACTIVE',
        },
      ];

      vi.mocked(apiClient).mockResolvedValueOnce({
        status: 'success',
        data: mockCalendars,
      });

      const calendars = await HolidayService.getCalendars(2026, true);
      expect(apiClient).toHaveBeenCalledWith('/holidays/calendars?year=2026&isActive=true');
      expect(calendars).toEqual(mockCalendars);
    });

    it('creates a new holiday calendar', async () => {
      const newCal = {
        name: 'Custom Tech 2026',
        code: 'TECH_2026',
        year: 2026,
        description: 'Tech division calendar',
        isActive: true,
      };

      vi.mocked(apiClient).mockResolvedValueOnce({
        status: 'success',
        data: { id: 'cal-2', ...newCal, isBaseline: false, status: 'ACTIVE' },
      });

      const created = await HolidayService.createCalendar(newCal);
      expect(apiClient).toHaveBeenCalledWith('/holidays/calendars', {
        method: 'POST',
        body: JSON.stringify(newCal),
      });
      expect(created.id).toBe('cal-2');
    });

    it('deletes a holiday calendar', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({
        status: 'success',
        data: null,
      });

      await HolidayService.deleteCalendar('cal-2');
      expect(apiClient).toHaveBeenCalledWith('/holidays/calendars/cal-2', {
        method: 'DELETE',
      });
    });
  });

  describe('Calendar Days', () => {
    it('fetches days for a calendar', async () => {
      const mockDays = [
        {
          id: 'day-1',
          calendarId: 'cal-1',
          holidayDate: '2026-01-26',
          name: 'Republic Day',
          holidayType: HolidayType.NATIONAL,
          isPaid: true,
          isOptional: false,
        },
      ];

      vi.mocked(apiClient).mockResolvedValueOnce({
        status: 'success',
        data: mockDays,
      });

      const days = await HolidayService.getCalendarDays('cal-1');
      expect(apiClient).toHaveBeenCalledWith('/holidays/calendars/cal-1/days');
      expect(days).toEqual(mockDays);
    });

    it('adds a holiday day to a calendar', async () => {
      const input = {
        holidayDate: '2026-08-15',
        name: 'Independence Day',
        holidayType: HolidayType.NATIONAL,
        isPaid: true,
        isOptional: false,
      };

      vi.mocked(apiClient).mockResolvedValueOnce({
        status: 'success',
        data: { id: 'day-2', calendarId: 'cal-1', ...input },
      });

      const added = await HolidayService.addCalendarDay('cal-1', input);
      expect(apiClient).toHaveBeenCalledWith('/holidays/calendars/cal-1/days', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      expect(added.id).toBe('day-2');
    });

    it('removes a holiday day from a calendar', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({
        status: 'success',
        data: null,
      });

      await HolidayService.removeCalendarDay('cal-1', 'day-2');
      expect(apiClient).toHaveBeenCalledWith('/holidays/calendars/cal-1/days/day-2', {
        method: 'DELETE',
      });
    });
  });

  describe('Company Holiday Settings & Assignments', () => {
    it('fetches company assignments', async () => {
      const mockAssignments = [
        {
          id: 'c-assign-1',
          companyId: 'comp-1',
          calendarId: 'cal-1',
          effectiveFrom: '2026-01-01',
          weeklyOffs: [0, 6],
        },
      ];

      vi.mocked(apiClient).mockResolvedValueOnce({
        status: 'success',
        data: mockAssignments,
      });

      const assignments = await HolidayService.getCompanyAssignments('comp-1');
      expect(apiClient).toHaveBeenCalledWith('/holidays/companies/comp-1/calendars');
      expect(assignments).toEqual(mockAssignments);
    });

    it('assigns calendar to company', async () => {
      const payload = {
        calendarId: 'cal-1',
        effectiveFrom: '2026-01-01',
        effectiveTo: '2026-12-31',
        weeklyOffDays: [0, 6],
      };

      vi.mocked(apiClient).mockResolvedValueOnce({
        status: 'success',
        data: { id: 'c-assign-2', companyId: 'comp-1', ...payload },
      });

      const res = await HolidayService.assignCompanyCalendar('comp-1', payload);
      expect(apiClient).toHaveBeenCalledWith('/holidays/companies/comp-1/calendars', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      expect(res.id).toBe('c-assign-2');
    });
  });

  describe('Employee Holiday Summary & Overrides', () => {
    it('fetches employee effective holidays for a given month and year', async () => {
      const mockSummary = {
        employeeId: 'emp-1',
        month: 1,
        year: 2026,
        summary: {
          totalDays: 31,
          weeklyOffs: 8,
          paidHolidays: 2,
          unpaidHolidays: 0,
          workingDays: 21,
        },
        days: [],
        optionalHolidays: [],
      };

      vi.mocked(apiClient).mockResolvedValueOnce({
        status: 'success',
        data: mockSummary,
      });

      const summary = await HolidayService.getEmployeeEffectiveHolidays('emp-1', 2026, 1, 'comp-1');
      expect(apiClient).toHaveBeenCalledWith(
        '/holidays/employees/emp-1/effective-holidays?year=2026&month=1&companyId=comp-1',
      );
      expect(summary).toEqual(mockSummary);
    });

    it('creates an employee holiday override', async () => {
      const input = {
        holidayDate: '2026-04-14',
        overrideType: OverrideType.ADD,
        reason: 'Special company event',
      };

      vi.mocked(apiClient).mockResolvedValueOnce({
        status: 'success',
        data: { id: 'ovr-1', employeeId: 'emp-1', ...input },
      });

      const ovr = await HolidayService.createEmployeeOverride('emp-1', input);
      expect(apiClient).toHaveBeenCalledWith('/holidays/employees/emp-1/overrides', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      expect(ovr.id).toBe('ovr-1');
    });

    it('deletes an employee holiday override', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({
        status: 'success',
        data: null,
      });

      await HolidayService.deleteEmployeeOverride('ovr-1');
      expect(apiClient).toHaveBeenCalledWith('/holidays/overrides/ovr-1', {
        method: 'DELETE',
      });
    });
  });
});
