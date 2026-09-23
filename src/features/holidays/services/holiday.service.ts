import { apiClient } from '@/lib/client/api-client';
import type {
  HolidayCalendar,
  HolidayCalendarDay,
  CompanyHolidayCalendarAssignment,
  EmployeeHolidayOverride,
  EmployeeHolidaySummary,
} from '../types/holiday.types';
import type {
  CreateHolidayCalendarInput,
  UpdateHolidayCalendarInput,
  CreateHolidayCalendarDayInput,
  UpdateHolidayCalendarDayInput,
  AssignCompanyHolidayCalendarInput,
  UpdateCompanyHolidayCalendarInput,
  CreateEmployeeHolidayOverrideInput,
} from '../schemas/holiday.schema';

function unwrapList<T>(res: unknown, key?: string): T[] {
  if (Array.isArray(res)) return res;
  if (typeof res === 'object' && res !== null) {
    const obj = res as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as T[];
    if (Array.isArray(obj.records)) return obj.records as T[];
    if (key && Array.isArray(obj[key])) return obj[key] as T[];
  }
  return [];
}

function unwrapEntity<T>(res: unknown, key?: string): T {
  if (typeof res === 'object' && res !== null) {
    const obj = res as Record<string, unknown>;
    if (key && obj[key] && typeof obj[key] === 'object') return obj[key] as T;
    if (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) return obj.data as T;
    if (obj.record && typeof obj.record === 'object') return obj.record as T;
  }
  return res as T;
}

function cleanPayload(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== null && value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

export const HolidayService = {
  // 1. Holiday Calendars
  async getCalendars(year?: number, isActive?: boolean): Promise<HolidayCalendar[]> {
    const params = new URLSearchParams();
    if (year !== undefined) params.append('year', String(year));
    if (isActive !== undefined) params.append('isActive', String(isActive));
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient<unknown>(`/holidays/calendars${qs}`);
    return unwrapList<HolidayCalendar>(res, 'calendars');
  },

  async getCalendar(calendarId: string): Promise<HolidayCalendar> {
    const res = await apiClient<unknown>(`/holidays/calendars/${encodeURIComponent(calendarId)}`);
    return unwrapEntity<HolidayCalendar>(res, 'calendar');
  },

  async createCalendar(data: CreateHolidayCalendarInput): Promise<HolidayCalendar> {
    const res = await apiClient<unknown>('/holidays/calendars', {
      method: 'POST',
      body: JSON.stringify(cleanPayload(data as unknown as Record<string, unknown>)),
    });
    return unwrapEntity<HolidayCalendar>(res, 'calendar');
  },

  async updateCalendar(
    calendarId: string,
    data: UpdateHolidayCalendarInput,
  ): Promise<HolidayCalendar> {
    const res = await apiClient<unknown>(`/holidays/calendars/${encodeURIComponent(calendarId)}`, {
      method: 'PATCH',
      body: JSON.stringify(cleanPayload(data as unknown as Record<string, unknown>)),
    });
    return unwrapEntity<HolidayCalendar>(res, 'calendar');
  },

  async deleteCalendar(calendarId: string): Promise<void> {
    await apiClient<unknown>(`/holidays/calendars/${encodeURIComponent(calendarId)}`, {
      method: 'DELETE',
    });
  },

  // 2. Holiday Calendar Days
  async getCalendarDays(calendarId: string): Promise<HolidayCalendarDay[]> {
    const res = await apiClient<unknown>(
      `/holidays/calendars/${encodeURIComponent(calendarId)}/days`,
    );
    return unwrapList<HolidayCalendarDay>(res, 'days');
  },

  async addCalendarDay(
    calendarId: string,
    data: CreateHolidayCalendarDayInput,
  ): Promise<HolidayCalendarDay> {
    const res = await apiClient<unknown>(
      `/holidays/calendars/${encodeURIComponent(calendarId)}/days`,
      {
        method: 'POST',
        body: JSON.stringify(cleanPayload(data as unknown as Record<string, unknown>)),
      },
    );
    return unwrapEntity<HolidayCalendarDay>(res, 'day');
  },

  async updateCalendarDay(
    calendarId: string,
    dayId: string,
    data: UpdateHolidayCalendarDayInput,
  ): Promise<HolidayCalendarDay> {
    const res = await apiClient<unknown>(
      `/holidays/calendars/${encodeURIComponent(calendarId)}/days/${encodeURIComponent(dayId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(cleanPayload(data as unknown as Record<string, unknown>)),
      },
    );
    return unwrapEntity<HolidayCalendarDay>(res, 'day');
  },

  async removeCalendarDay(calendarId: string, dayId: string): Promise<void> {
    await apiClient<unknown>(
      `/holidays/calendars/${encodeURIComponent(calendarId)}/days/${encodeURIComponent(dayId)}`,
      {
        method: 'DELETE',
      },
    );
  },

  // 3. Company Holiday Assignments
  async getCompanyAssignments(companyId: string): Promise<CompanyHolidayCalendarAssignment[]> {
    const res = await apiClient<unknown>(
      `/holidays/companies/${encodeURIComponent(companyId)}/calendars`,
    );
    return unwrapList<CompanyHolidayCalendarAssignment>(res, 'assignments');
  },

  async assignCompanyCalendar(
    companyId: string,
    data: AssignCompanyHolidayCalendarInput,
  ): Promise<CompanyHolidayCalendarAssignment> {
    const res = await apiClient<unknown>(
      `/holidays/companies/${encodeURIComponent(companyId)}/calendars`,
      {
        method: 'POST',
        body: JSON.stringify(cleanPayload(data as unknown as Record<string, unknown>)),
      },
    );
    return unwrapEntity<CompanyHolidayCalendarAssignment>(res, 'assignment');
  },

  async updateCompanyAssignment(
    assignmentId: string,
    data: UpdateCompanyHolidayCalendarInput,
  ): Promise<CompanyHolidayCalendarAssignment> {
    const res = await apiClient<unknown>(
      `/holidays/company-calendars/${encodeURIComponent(assignmentId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(cleanPayload(data as unknown as Record<string, unknown>)),
      },
    );
    return unwrapEntity<CompanyHolidayCalendarAssignment>(res, 'assignment');
  },

  async unassignCompanyCalendar(assignmentId: string): Promise<void> {
    await apiClient<unknown>(`/holidays/company-calendars/${encodeURIComponent(assignmentId)}`, {
      method: 'DELETE',
    });
  },

  // 4. Employee Holiday Overrides & Effective Holidays
  async getEmployeeEffectiveHolidays(
    employeeId: string,
    year: number,
    month: number,
    companyId?: string,
  ): Promise<EmployeeHolidaySummary> {
    const params = new URLSearchParams();
    params.append('year', String(year));
    params.append('month', String(month));
    if (companyId) params.append('companyId', companyId);
    const res = await apiClient<unknown>(
      `/holidays/employees/${encodeURIComponent(employeeId)}/effective-holidays?${params.toString()}`,
    );
    return unwrapEntity<EmployeeHolidaySummary>(res, 'summary');
  },

  async getEmployeeOverrides(employeeId: string): Promise<EmployeeHolidayOverride[]> {
    const res = await apiClient<unknown>(
      `/holidays/employees/${encodeURIComponent(employeeId)}/overrides`,
    );
    return unwrapList<EmployeeHolidayOverride>(res, 'overrides');
  },

  async createEmployeeOverride(
    employeeId: string,
    data: CreateEmployeeHolidayOverrideInput,
  ): Promise<EmployeeHolidayOverride> {
    const res = await apiClient<unknown>(
      `/holidays/employees/${encodeURIComponent(employeeId)}/overrides`,
      {
        method: 'POST',
        body: JSON.stringify(cleanPayload(data as unknown as Record<string, unknown>)),
      },
    );
    return unwrapEntity<EmployeeHolidayOverride>(res, 'override');
  },

  async deleteEmployeeOverride(overrideId: string): Promise<void> {
    await apiClient<unknown>(`/holidays/overrides/${encodeURIComponent(overrideId)}`, {
      method: 'DELETE',
    });
  },
};
