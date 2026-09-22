import { apiClient } from '@/lib/client/api-client';
import type { AttendanceLog, AttendanceDailySummary } from '../types/attendance.types';
import type { LogAttendanceInput } from '../schemas/attendance.schema';

export interface GetAttendanceLogsParams {
  date?: string;
  startDate?: string;
  endDate?: string;
  employeeId?: string;
  siteId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

function unwrapList<T>(res: unknown, key?: string): T[] {
  if (Array.isArray(res)) return res;
  if (typeof res === 'object' && res !== null) {
    const obj = res as Record<string, unknown>;
    if (Array.isArray(obj.records)) return obj.records as T[];
    if (key && Array.isArray(obj[key])) return obj[key] as T[];
    if (Array.isArray(obj.data)) return obj.data as T[];
  }
  return [];
}

function unwrapEntity<T>(res: unknown, key?: string): T {
  if (typeof res === 'object' && res !== null) {
    const obj = res as Record<string, unknown>;
    if (key && obj[key] && typeof obj[key] === 'object') return obj[key] as T;
  }
  return res as T;
}

export const AttendanceService = {
  /**
   * Get attendance punch logs with optional filters.
   */
  async getLogs(params: GetAttendanceLogsParams = {}): Promise<AttendanceLog[]> {
    const searchParams = new URLSearchParams();
    if (params.date) {
      searchParams.set('startDate', params.date);
      searchParams.set('endDate', params.date);
    }
    if (params.startDate) searchParams.set('startDate', params.startDate);
    if (params.endDate) searchParams.set('endDate', params.endDate);
    if (params.employeeId) searchParams.set('employeeId', params.employeeId);
    if (params.siteId) searchParams.set('siteId', params.siteId);
    if (params.status) searchParams.set('status', params.status);
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));

    const qs = searchParams.toString();
    try {
      const res = await apiClient<unknown>(`/hr/attendance${qs ? `?${qs}` : ''}`);
      return unwrapList<AttendanceLog>(res, 'logs');
    } catch {
      // Fallback
      const res = await apiClient<unknown>(`/attendance/logs${qs ? `?${qs}` : ''}`);
      return unwrapList<AttendanceLog>(res, 'logs');
    }
  },

  /**
   * Get daily summary statistics (present, absent, late, geofence compliance).
   */
  async getDailySummary(date?: string): Promise<AttendanceDailySummary> {
    const qs = date ? `?date=${encodeURIComponent(date)}` : '';
    try {
      const res = await apiClient<unknown>(`/hr/attendance/summary${qs}`);
      return unwrapEntity<AttendanceDailySummary>(res, 'summary');
    } catch {
      const res = await apiClient<unknown>(`/attendance/summary${qs}`);
      return unwrapEntity<AttendanceDailySummary>(res, 'summary');
    }
  },

  /**
   * Record a new attendance log entry (manual punch or override).
   */
  async recordAttendance(data: LogAttendanceInput): Promise<AttendanceLog> {
    try {
      const res = await apiClient<unknown>('/hr/attendance/check-in', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return unwrapEntity<AttendanceLog>(res, 'log');
    } catch {
      const res = await apiClient<unknown>('/attendance/logs', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return unwrapEntity<AttendanceLog>(res, 'log');
    }
  },
};
