/**
 * Holiday Module Domain Types
 */

export enum HolidayType {
  NATIONAL = 'NATIONAL',
  REGIONAL = 'REGIONAL',
  OPTIONAL = 'OPTIONAL',
  CUSTOM = 'CUSTOM',
}

export enum OverrideType {
  ADD = 'ADD',
  REMOVE = 'REMOVE',
}

export interface HolidayCalendar {
  id: string;
  workspaceId?: string;
  name: string;
  code: string;
  year: number;
  description: string | null;
  isBaseline: boolean; // If true, delete button is disabled
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  days?: HolidayCalendarDay[];
}

export interface HolidayCalendarDay {
  id: string;
  workspaceId?: string;
  calendarId: string;
  holidayDate: string; // 'YYYY-MM-DD'
  name: string;
  description: string | null;
  holidayType: HolidayType;
  isPaid: boolean;
  isOptional: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyHolidayCalendarAssignment {
  id: string;
  workspaceId?: string;
  companyId: string;
  calendarId: string;
  effectiveFrom: string; // 'YYYY-MM-DD'
  effectiveTo: string | null; // 'YYYY-MM-DD'
  weeklyOffDays: number[]; // e.g. [0] for Sunday, [0, 6] for Sun + Sat (0=Sun, 1=Mon, ..., 6=Sat)
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  calendar?: HolidayCalendar;
}

export interface EmployeeHolidayCalendarAssignment {
  id: string;
  workspaceId?: string;
  employeeId: string;
  calendarId: string;
  effectiveFrom: string; // 'YYYY-MM-DD'
  effectiveTo: string | null; // 'YYYY-MM-DD'
  weeklyOffDays: number[] | null; // null inherits from company calendar
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  calendar?: HolidayCalendar;
}

export interface EmployeeHolidayOverride {
  id: string;
  workspaceId?: string;
  employeeId: string;
  holidayDate: string; // 'YYYY-MM-DD'
  overrideType: OverrideType; // 'ADD' or 'REMOVE'
  name: string | null; // Required for ADD
  isPaid: boolean;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeHolidaySummary {
  totalCalendarDays: number;
  weeklyOffDays: number[];
  weeklyOffCount: number;
  paidHolidayDays: number;
  unpaidHolidayDays: number;
  workingDays: number;
  paidHolidayDates: string[];
  unpaidHolidayDates: string[];
  weeklyOffDates: string[];
  optionalHolidays?: Array<{
    date: string;
    name: string;
    isPaid: boolean;
  }>;
}
