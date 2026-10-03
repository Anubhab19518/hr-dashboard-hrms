import { apiClient } from '@/lib/client/api-client';
import type {
  AttendanceLog,
  AttendanceDailySummary,
  EarlyCheckoutRequest,
  EarlyCheckoutActionInput,
  GetEarlyCheckoutRequestsParams,
  PaginatedEarlyCheckoutResponse,
} from '../types/attendance.types';
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
    if (Array.isArray(obj.items)) return obj.items as T[];
    if (Array.isArray(obj.data)) return obj.data as T[];
    if (Array.isArray(obj.requests)) return obj.requests as T[];
  }
  return [];
}

function unwrapEntity<T>(res: unknown, key?: string): T {
  if (typeof res === 'object' && res !== null) {
    const obj = res as Record<string, unknown>;
    if (key && obj[key] && typeof obj[key] === 'object') return obj[key] as T;
    if (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
      const dataObj = obj.data as Record<string, unknown>;
      if (key && dataObj[key] && typeof dataObj[key] === 'object') return dataObj[key] as T;
      return obj.data as T;
    }
    if (obj.summary && typeof obj.summary === 'object') return obj.summary as T;
    if (obj.stats && typeof obj.stats === 'object') return obj.stats as T;
    if (obj.record && typeof obj.record === 'object') return obj.record as T;
    if (obj.request && typeof obj.request === 'object') return obj.request as T;
  }
  return res as T;
}

function normalizeEarlyCheckoutRequest(raw: unknown): EarlyCheckoutRequest {
  if (typeof raw !== 'object' || raw === null) {
    return raw as EarlyCheckoutRequest;
  }
  const r = raw as Record<string, unknown>;
  const requestedCheckoutTime =
    (typeof r.requestedCheckoutTime === 'string' && r.requestedCheckoutTime) ||
    (typeof r.requestedTime === 'string' && r.requestedTime) ||
    (typeof r.requestedPunchOut === 'string' && r.requestedPunchOut) ||
    (typeof r.requestedPunchOutTime === 'string' && r.requestedPunchOutTime) ||
    (typeof r.checkoutTime === 'string' && r.checkoutTime) ||
    (typeof r.punchOutTime === 'string' && r.punchOutTime) ||
    (typeof r.requested_checkout_time === 'string' && r.requested_checkout_time) ||
    (typeof r.requested_time === 'string' && r.requested_time) ||
    (typeof r.requestTime === 'string' && r.requestTime) ||
    (typeof r.time === 'string' && r.time) ||
    '';

  const scheduledShiftEndTime =
    (typeof r.scheduledShiftEndTime === 'string' && r.scheduledShiftEndTime) ||
    (typeof r.shiftEndTime === 'string' && r.shiftEndTime) ||
    (typeof r.scheduledEndTime === 'string' && r.scheduledEndTime) ||
    (typeof r.scheduled_shift_end_time === 'string' && r.scheduled_shift_end_time) ||
    (typeof r.shiftEnd === 'string' && r.shiftEnd) ||
    (typeof (r.shift as Record<string, unknown>)?.endTime === 'string' &&
      ((r.shift as Record<string, unknown>).endTime as string)) ||
    (typeof (r.shift as Record<string, unknown>)?.shiftEnd === 'string' &&
      ((r.shift as Record<string, unknown>).shiftEnd as string)) ||
    '—';

  const employeeRaw = (r.employee as Record<string, unknown>) || {};
  const employeeName =
    (typeof employeeRaw.name === 'string' && employeeRaw.name) ||
    (typeof employeeRaw.fullName === 'string' && employeeRaw.fullName) ||
    [employeeRaw.firstName, employeeRaw.lastName].filter(Boolean).join(' ') ||
    (typeof r.employeeName === 'string' && r.employeeName) ||
    undefined;

  const employeeCode =
    (typeof employeeRaw.code === 'string' && employeeRaw.code) ||
    (typeof employeeRaw.employeeCode === 'string' && employeeRaw.employeeCode) ||
    (typeof r.employeeCode === 'string' && r.employeeCode) ||
    undefined;

  const employeeDepartment =
    employeeRaw.department || (typeof r.department === 'string' ? r.department : undefined);

  const employeeRole =
    employeeRaw.role ||
    employeeRaw.designation ||
    (typeof r.role === 'string' ? r.role : undefined) ||
    (typeof r.designation === 'string' ? r.designation : undefined);

  return {
    ...r,
    id: String(r.id || ''),
    employeeId: String(r.employeeId || ''),
    requestedCheckoutTime,
    scheduledShiftEndTime,
    reason: String(r.reason || ''),
    status: (r.status as EarlyCheckoutRequest['status']) || 'PENDING',
    requestedAt: String(r.requestedAt || r.createdAt || ''),
    employee: {
      ...employeeRaw,
      name: employeeName,
      code: employeeCode,
      department: employeeDepartment as EarlyCheckoutRequest['employee'] extends {
        department?: infer D;
      }
        ? D
        : undefined,
      role: employeeRole as EarlyCheckoutRequest['employee'] extends { role?: infer R }
        ? R
        : undefined,
    },
  } as EarlyCheckoutRequest;
}

function normalizeAttendanceLog(raw: unknown): AttendanceLog {
  if (typeof raw !== 'object' || raw === null) {
    return raw as AttendanceLog;
  }
  const r = raw as Record<string, unknown>;
  const employeeRaw = (r.employee as Record<string, unknown>) || {};
  const locationRaw = (r.location as Record<string, unknown>) || {};

  const employeeName =
    (typeof employeeRaw.name === 'string' && employeeRaw.name) ||
    (typeof employeeRaw.fullName === 'string' && employeeRaw.fullName) ||
    [employeeRaw.firstName, employeeRaw.lastName].filter(Boolean).join(' ') ||
    (typeof r.employeeName === 'string' && r.employeeName) ||
    undefined;

  const employeeCode =
    (typeof employeeRaw.code === 'string' && employeeRaw.code) ||
    (typeof employeeRaw.employeeCode === 'string' && employeeRaw.employeeCode) ||
    (typeof r.employeeCode === 'string' && r.employeeCode) ||
    undefined;

  const companyRaw =
    (employeeRaw.company as Record<string, unknown>) ||
    (r.company as Record<string, unknown>) ||
    {};
  const companyName =
    (typeof companyRaw.name === 'string' && companyRaw.name) ||
    (typeof r.companyName === 'string' && r.companyName) ||
    undefined;

  const siteName =
    (typeof locationRaw.siteName === 'string' && locationRaw.siteName) ||
    (typeof r.siteName === 'string' && r.siteName) ||
    companyName ||
    undefined;

  const siteAddress =
    (typeof locationRaw.address === 'string' && locationRaw.address) ||
    (typeof r.siteAddress === 'string' && r.siteAddress) ||
    undefined;

  const checkInTime =
    (typeof r.checkInTime === 'string' && r.checkInTime) ||
    (typeof r.timestamp === 'string' && r.timestamp) ||
    null;

  const checkOutTime = (typeof r.checkOutTime === 'string' && r.checkOutTime) || null;

  const logType =
    (typeof r.logType === 'string' && r.logType) ||
    (checkOutTime && !checkInTime
      ? 'CHECK_OUT'
      : checkInTime && !checkOutTime
        ? 'CHECK_IN'
        : 'CHECK_IN');

  return {
    ...r,
    id: String(r.id || ''),
    employeeId: String(r.employeeId || ''),
    status: (r.status as AttendanceLog['status']) || 'PRESENT',
    checkInTime,
    checkOutTime,
    logType: logType as AttendanceLog['logType'],
    employeeName,
    employeeCode,
    companyName,
    siteName,
    siteAddress,
    employee: {
      ...employeeRaw,
      name: employeeName || '',
      employeeCode,
      company: companyName
        ? {
            id: String(companyRaw.id || ''),
            name: companyName,
            code: companyRaw.code as string | undefined,
          }
        : (employeeRaw.company as AttendanceLog['employee'] extends { company?: infer C }
            ? C
            : undefined),
    },
    location: {
      ...locationRaw,
      siteName,
      address: siteAddress,
    },
  } as AttendanceLog;
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
      const raw = unwrapList<unknown>(res, 'logs');
      return raw.map(normalizeAttendanceLog);
    } catch {
      // Fallback
      const res = await apiClient<unknown>(`/attendance/logs${qs ? `?${qs}` : ''}`);
      const raw = unwrapList<unknown>(res, 'logs');
      return raw.map(normalizeAttendanceLog);
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

  /**
   * Get early checkout / punch-out approval requests.
   * Endpoint: GET /api/v1/hr/attendance/early-checkout-requests
   */
  async getEarlyCheckoutRequests(
    params: GetEarlyCheckoutRequestsParams = {},
  ): Promise<PaginatedEarlyCheckoutResponse> {
    const searchParams = new URLSearchParams();
    if (params.status && params.status !== 'ALL') searchParams.set('status', params.status);
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.search) searchParams.set('search', params.search);
    if (params.startDate) searchParams.set('startDate', params.startDate);
    if (params.endDate) searchParams.set('endDate', params.endDate);

    const qs = searchParams.toString();
    const endpoint = `/hr/attendance/early-checkout-requests${qs ? `?${qs}` : ''}`;

    let res: unknown;
    try {
      res = await apiClient<unknown>(endpoint);
    } catch {
      // Fallback endpoint if needed
      res = await apiClient<unknown>(`/attendance/early-checkout-requests${qs ? `?${qs}` : ''}`);
    }

    if (Array.isArray(res)) {
      const normalized = res.map(normalizeEarlyCheckoutRequest);
      return {
        items: normalized,
        total: normalized.length,
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        pendingCount: normalized.filter((r) => r.status === 'PENDING').length,
      };
    }

    if (typeof res === 'object' && res !== null) {
      const obj = res as Record<string, unknown>;
      const rawData =
        obj.data && typeof obj.data === 'object' ? (obj.data as Record<string, unknown>) : null;

      const rawItems =
        unwrapList<unknown>(rawData || obj, 'requests').length > 0
          ? unwrapList<unknown>(rawData || obj, 'requests')
          : unwrapList<unknown>(res, 'items');

      const items = rawItems.map(normalizeEarlyCheckoutRequest);

      const total =
        typeof obj.total === 'number'
          ? obj.total
          : typeof rawData?.total === 'number'
            ? (rawData.total as number)
            : items.length;

      const page =
        typeof obj.page === 'number'
          ? obj.page
          : typeof rawData?.page === 'number'
            ? (rawData.page as number)
            : (params.page ?? 1);

      const limit =
        typeof obj.limit === 'number'
          ? obj.limit
          : typeof rawData?.limit === 'number'
            ? (rawData.limit as number)
            : (params.limit ?? 20);

      const pendingCount =
        typeof obj.pendingCount === 'number'
          ? obj.pendingCount
          : typeof rawData?.pendingCount === 'number'
            ? (rawData.pendingCount as number)
            : undefined;

      return {
        items,
        total,
        page,
        limit,
        pendingCount,
      };
    }

    return {
      items: [],
      total: 0,
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    };
  },

  /**
   * Fast count of pending early checkout requests for badge indicators.
   */
  async getPendingEarlyCheckoutCount(): Promise<number> {
    try {
      const res = await this.getEarlyCheckoutRequests({ status: 'PENDING', page: 1, limit: 1 });
      return typeof res.pendingCount === 'number' ? res.pendingCount : res.total;
    } catch {
      return 0;
    }
  },

  /**
   * Approve or reject an early checkout request.
   * Endpoint: PATCH /api/v1/hr/attendance/early-checkout-requests/:id/action
   */
  async actionEarlyCheckoutRequest(
    id: string,
    input: EarlyCheckoutActionInput,
  ): Promise<EarlyCheckoutRequest> {
    const endpoint = `/hr/attendance/early-checkout-requests/${encodeURIComponent(id)}/action`;
    try {
      const res = await apiClient<unknown>(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
      return unwrapEntity<EarlyCheckoutRequest>(res, 'request');
    } catch {
      // Fallback
      const res = await apiClient<unknown>(
        `/attendance/early-checkout-requests/${encodeURIComponent(id)}/action`,
        {
          method: 'PATCH',
          body: JSON.stringify(input),
        },
      );
      return unwrapEntity<EarlyCheckoutRequest>(res, 'request');
    }
  },
};
