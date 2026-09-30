import { apiClient } from '@/lib/client/api-client';
import {
  HalfDayType,
  LeaveStatus,
  type LeaveType,
  type LeaveBalance,
  type LeaveApplication,
  type LeavePolicy,
  type LeavePolicyAssignment,
  type LeaveApplicationDocument,
  type ApplyLeaveRequest,
  type LeaveBalanceAdjustmentRequest,
  type PayrollLopSummary,
} from '../types/leave.types';
import type {
  CreateLeaveTypeInput,
  UpdateLeaveTypeInput,
  CreateLeavePolicyInput,
  UpdateLeavePolicyInput,
  AssignLeavePolicyInput,
} from '../schemas/leave.schema';

function unwrapList<T>(res: unknown, key?: string): T[] {
  if (Array.isArray(res)) return res;
  if (typeof res === 'object' && res !== null) {
    const obj = res as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as T[];
    if (Array.isArray(obj.records)) return obj.records as T[];
    if (Array.isArray(obj.rows)) return obj.rows as T[];
    if (Array.isArray(obj.items)) return obj.items as T[];
    if (Array.isArray(obj.list)) return obj.list as T[];
    if (Array.isArray(obj.results)) return obj.results as T[];
    if (Array.isArray(obj.applications)) return obj.applications as T[];
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

export interface GetApplicationsParams {
  employeeId?: string;
  leaveTypeId?: string;
  status?: LeaveStatus | string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface ApplicationsListResponse {
  applications: LeaveApplication[];
  total: number;
  page: number;
  limit: number;
}

export const LeaveService = {
  // -------------------------------------------------------------
  // 1. Employee Self-Service Endpoints
  // -------------------------------------------------------------

  /**
   * Fetch current user's leave balances.
   * GET /api/v1/leave/balances/me?year=2026
   */
  async getMyBalances(year?: number): Promise<LeaveBalance[]> {
    const qs = year ? `?year=${year}` : '';
    const res = await apiClient<unknown>(`/leave/balances/me${qs}`);
    return unwrapList<LeaveBalance>(res, 'balances');
  },

  /**
   * Apply for leave.
   * POST /api/v1/leave/applications/apply
   */
  async applyLeave(data: ApplyLeaveRequest): Promise<LeaveApplication> {
    const payload = {
      leaveTypeId: data.leaveTypeId,
      fromDate: data.fromDate,
      toDate: data.toDate,
      fromHalf: data.fromHalf || HalfDayType.FULL,
      toHalf: data.toHalf || HalfDayType.FULL,
      reason: data.reason,
      companyId: data.companyId,
    };

    const res = await apiClient<unknown>('/leave/applications/apply', {
      method: 'POST',
      body: JSON.stringify(cleanPayload(payload as Record<string, unknown>)),
    });
    return unwrapEntity<LeaveApplication>(res, 'application');
  },

  /**
   * List current user's leave applications.
   * GET /api/v1/leave/applications/me?page=1&limit=20&status=PENDING
   */
  async getMyApplications(params: GetApplicationsParams = {}): Promise<ApplicationsListResponse> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.status && params.status !== 'ALL') searchParams.set('status', params.status);

    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await apiClient<unknown>(`/leave/applications/me${qs}`);

    const items = unwrapList<LeaveApplication>(res, 'applications');
    let total = items.length;
    let page = params.page || 1;
    let limit = params.limit || 20;

    if (typeof res === 'object' && res !== null) {
      const obj = res as Record<string, unknown>;
      if (typeof obj.total === 'number') total = obj.total;
      if (typeof obj.page === 'number') page = obj.page;
      if (typeof obj.limit === 'number') limit = obj.limit;
    }

    return {
      applications: items,
      total,
      page,
      limit,
    };
  },

  /**
   * Cancel own pending leave application.
   * PATCH /api/v1/leave/applications/:applicationId/cancel
   */
  async cancelMyApplication(
    applicationId: string,
    cancellationReason?: string,
  ): Promise<LeaveApplication> {
    const res = await apiClient<unknown>(
      `/leave/applications/${encodeURIComponent(applicationId)}/cancel`,
      {
        method: 'PATCH',
        body: JSON.stringify(cancellationReason ? { cancellationReason } : {}),
      },
    );
    return unwrapEntity<LeaveApplication>(res, 'application');
  },

  /**
   * Upload supporting document (medical certificate / proof).
   * POST /api/v1/leave/applications/:applicationId/documents
   */
  async uploadApplicationDocument(
    applicationId: string,
    file: File,
  ): Promise<LeaveApplicationDocument> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await apiClient<unknown>(
      `/leave/applications/${encodeURIComponent(applicationId)}/documents`,
      {
        method: 'POST',
        body: formData,
      },
    );
    return unwrapEntity<LeaveApplicationDocument>(res, 'document');
  },

  // -------------------------------------------------------------
  // 2. HR & Admin Leave Approvals & Management
  // -------------------------------------------------------------

  /**
   * List all leave applications across the organization / workspace.
   * GET /api/v1/leave/applications
   */
  async getApplications(params: GetApplicationsParams = {}): Promise<ApplicationsListResponse> {
    const searchParams = new URLSearchParams();
    if (params.employeeId) searchParams.set('employeeId', params.employeeId);
    if (params.leaveTypeId) searchParams.set('leaveTypeId', params.leaveTypeId);
    if (params.status && params.status !== 'ALL') searchParams.set('status', params.status);
    if (params.fromDate) searchParams.set('fromDate', params.fromDate);
    if (params.toDate) searchParams.set('toDate', params.toDate);
    if (params.page) searchParams.set('page', String(params.page));
    const safeLimit = Math.min(Math.max(1, params.limit || 20), 100);
    searchParams.set('limit', String(safeLimit));

    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await apiClient<unknown>(`/leave/applications${qs}`);

    const items = unwrapList<LeaveApplication>(res, 'applications');
    let total = items.length;
    let page = params.page || 1;
    let limit = params.limit || 20;

    if (typeof res === 'object' && res !== null) {
      const obj = res as Record<string, unknown>;
      if (typeof obj.total === 'number') total = obj.total;
      else if (typeof obj.count === 'number') total = obj.count;
      if (typeof obj.page === 'number') page = obj.page;
      if (typeof obj.limit === 'number') limit = obj.limit;
    }

    return {
      applications: items,
      total,
      page,
      limit,
    };
  },

  /**
   * Approve leave application.
   * POST /api/v1/leave/applications/:applicationId/approve
   */
  async approveApplication(applicationId: string, comments?: string): Promise<LeaveApplication> {
    const payload = comments ? { comments, remarks: comments, approvalComments: comments } : {};
    try {
      const res = await apiClient<unknown>(
        `/leave/applications/${encodeURIComponent(applicationId)}/approve`,
        {
          method: 'POST',
          body: JSON.stringify(cleanPayload(payload)),
        },
      );
      return unwrapEntity<LeaveApplication>(res, 'application');
    } catch (err: unknown) {
      const isConflict =
        (typeof err === 'object' &&
          err !== null &&
          'status' in err &&
          (err as { status: number }).status === 409) ||
        (err instanceof Error &&
          (err.message.toLowerCase().includes('already') ||
            err.message.toLowerCase().includes('conflict')));

      if (isConflict) {
        return { id: applicationId, status: LeaveStatus.APPROVED } as LeaveApplication;
      }

      // Verify if DB state transitioned successfully despite secondary hook warnings
      try {
        const checkRes = await apiClient<unknown>(
          `/leave/applications/${encodeURIComponent(applicationId)}`,
        ).catch(() => null);
        const entity = unwrapEntity<LeaveApplication>(checkRes, 'application');
        if (entity && entity.status === LeaveStatus.APPROVED) {
          return entity;
        }
      } catch {
        // Continue
      }
      throw err;
    }
  },

  /**
   * Reject leave application.
   * POST /api/v1/leave/applications/:applicationId/reject
   */
  async rejectApplication(applicationId: string, comments?: string): Promise<LeaveApplication> {
    const defaultReason = comments || 'Rejected by Manager / Administrator';
    const payload = {
      comments: defaultReason,
      rejectionReason: defaultReason,
      reason: defaultReason,
      remarks: defaultReason,
    };
    try {
      const res = await apiClient<unknown>(
        `/leave/applications/${encodeURIComponent(applicationId)}/reject`,
        {
          method: 'POST',
          body: JSON.stringify(cleanPayload(payload)),
        },
      );
      return unwrapEntity<LeaveApplication>(res, 'application');
    } catch (err: unknown) {
      const isConflict =
        (typeof err === 'object' &&
          err !== null &&
          'status' in err &&
          (err as { status: number }).status === 409) ||
        (err instanceof Error &&
          (err.message.toLowerCase().includes('already') ||
            err.message.toLowerCase().includes('conflict')));

      if (isConflict) {
        return { id: applicationId, status: LeaveStatus.REJECTED } as LeaveApplication;
      }

      // Verify if DB state transitioned successfully despite secondary hook warnings
      try {
        const checkRes = await apiClient<unknown>(
          `/leave/applications/${encodeURIComponent(applicationId)}`,
        ).catch(() => null);
        const entity = unwrapEntity<LeaveApplication>(checkRes, 'application');
        if (entity && entity.status === LeaveStatus.REJECTED) {
          return entity;
        }
      } catch {
        // Continue
      }
      throw err;
    }
  },

  /**
   * Revoke already approved leave application.
   * POST /api/v1/leave/applications/:applicationId/revoke
   */
  async revokeApplication(applicationId: string, comments?: string): Promise<LeaveApplication> {
    const payload = comments ? { comments, remarks: comments, reason: comments } : {};
    try {
      const res = await apiClient<unknown>(
        `/leave/applications/${encodeURIComponent(applicationId)}/revoke`,
        {
          method: 'POST',
          body: JSON.stringify(cleanPayload(payload)),
        },
      );
      return unwrapEntity<LeaveApplication>(res, 'application');
    } catch (err: unknown) {
      const isConflict =
        (typeof err === 'object' &&
          err !== null &&
          'status' in err &&
          (err as { status: number }).status === 409) ||
        (err instanceof Error &&
          (err.message.toLowerCase().includes('already') ||
            err.message.toLowerCase().includes('conflict')));

      if (isConflict) {
        return { id: applicationId, status: LeaveStatus.REVOKED } as LeaveApplication;
      }
      throw err;
    }
  },

  // -------------------------------------------------------------
  // 3. Leave Types Management
  // -------------------------------------------------------------

  /**
   * Get all leave categories/types.
   * GET /api/v1/leave/types?activeOnly=true
   */
  async getLeaveTypes(activeOnly?: boolean): Promise<LeaveType[]> {
    const qs = activeOnly !== undefined ? `?activeOnly=${activeOnly}` : '';
    const res = await apiClient<unknown>(`/leave/types${qs}`);
    return unwrapList<LeaveType>(res, 'types');
  },

  /**
   * Create new leave type.
   * POST /api/v1/leave/types
   */
  async createLeaveType(data: CreateLeaveTypeInput): Promise<LeaveType> {
    const res = await apiClient<unknown>('/leave/types', {
      method: 'POST',
      body: JSON.stringify(cleanPayload(data as unknown as Record<string, unknown>)),
    });
    return unwrapEntity<LeaveType>(res, 'type');
  },

  /**
   * Update existing leave type.
   * PATCH /api/v1/leave/types/:leaveTypeId
   */
  async updateLeaveType(leaveTypeId: string, data: UpdateLeaveTypeInput): Promise<LeaveType> {
    const res = await apiClient<unknown>(`/leave/types/${encodeURIComponent(leaveTypeId)}`, {
      method: 'PATCH',
      body: JSON.stringify(cleanPayload(data as unknown as Record<string, unknown>)),
    });
    return unwrapEntity<LeaveType>(res, 'type');
  },

  /**
   * Deactivate/delete leave type.
   * DELETE /api/v1/leave/types/:leaveTypeId
   */
  async deleteLeaveType(leaveTypeId: string): Promise<void> {
    await apiClient<unknown>(`/leave/types/${encodeURIComponent(leaveTypeId)}`, {
      method: 'DELETE',
    });
  },

  // -------------------------------------------------------------
  // 4. Leave Policies & Quotas
  // -------------------------------------------------------------

  /**
   * Get all leave policies.
   * GET /api/v1/leave/policies
   */
  async getPolicies(hydrate = true): Promise<LeavePolicy[]> {
    const res = await apiClient<unknown>('/leave/policies');
    const list = unwrapList<LeavePolicy>(res, 'policies');
    if (!hydrate || list.length === 0) return list;

    // Hydrate full policy entities with entitlements & assignments in parallel
    const detailed = await Promise.all(
      list.map(async (p) => {
        try {
          const detail = await this.getPolicy(p.id);
          return { ...p, ...detail };
        } catch {
          return p;
        }
      }),
    );
    return detailed;
  },

  /**
   * Get policy detail by ID with entitlements.
   * GET /api/v1/leave/policies/:policyId
   */
  async getPolicy(policyId: string): Promise<LeavePolicy> {
    const res = await apiClient<unknown>(`/leave/policies/${encodeURIComponent(policyId)}`);
    const policy = unwrapEntity<LeavePolicy>(res, 'policy');

    // Also attempt to load assignments if not populated on entity
    if (
      !policy.assignments ||
      !Array.isArray(policy.assignments) ||
      policy.assignments.length === 0
    ) {
      try {
        const assRes = await apiClient<unknown>(
          `/leave/policies/${encodeURIComponent(policyId)}/assignments`,
        );
        const assList = unwrapList<LeavePolicyAssignment>(assRes, 'assignments');
        if (assList && assList.length > 0) {
          policy.assignments = assList;
        }
      } catch {
        // Silently skip if assignments endpoint is not available
      }
    }

    return policy;
  },

  /**
   * Get assignments list for a policy.
   * GET /api/v1/leave/policies/:policyId/assignments
   */
  async getPolicyAssignments(policyId: string): Promise<LeavePolicyAssignment[]> {
    try {
      const res = await apiClient<unknown>(
        `/leave/policies/${encodeURIComponent(policyId)}/assignments`,
      );
      return unwrapList<LeavePolicyAssignment>(res, 'assignments');
    } catch {
      return [];
    }
  },

  /**
   * Create a leave policy with entitlements.
   * POST /api/v1/leave/policies
   */
  async createPolicy(data: CreateLeavePolicyInput): Promise<LeavePolicy> {
    const res = await apiClient<unknown>('/leave/policies', {
      method: 'POST',
      body: JSON.stringify(cleanPayload(data as unknown as Record<string, unknown>)),
    });
    return unwrapEntity<LeavePolicy>(res, 'policy');
  },

  /**
   * Update existing policy and entitlements.
   * PATCH /api/v1/leave/policies/:policyId
   */
  async updatePolicy(policyId: string, data: UpdateLeavePolicyInput): Promise<LeavePolicy> {
    const res = await apiClient<unknown>(`/leave/policies/${encodeURIComponent(policyId)}`, {
      method: 'PATCH',
      body: JSON.stringify(cleanPayload(data as unknown as Record<string, unknown>)),
    });
    return unwrapEntity<LeavePolicy>(res, 'policy');
  },

  /**
   * Delete or deactivate leave policy.
   * DELETE /api/v1/leave/policies/:policyId
   */
  async deletePolicy(policyId: string): Promise<void> {
    try {
      await apiClient<unknown>(`/leave/policies/${encodeURIComponent(policyId)}`, {
        method: 'DELETE',
      });
    } catch {
      // If DELETE endpoint is 404 or not supported by backend, soft-deactivate policy
      try {
        await this.updatePolicy(policyId, {
          isActive: false,
          effectiveTo: new Date().toISOString().slice(0, 10),
        } as unknown as UpdateLeavePolicyInput);
      } catch {
        // Silently continue
      }
    }
  },

  /**
   * Assign policy to company or employee.
   * POST /api/v1/leave/policies/:policyId/assignments
   */
  async assignPolicy(
    policyId: string,
    data: AssignLeavePolicyInput,
  ): Promise<LeavePolicyAssignment> {
    const res = await apiClient<unknown>(
      `/leave/policies/${encodeURIComponent(policyId)}/assignments`,
      {
        method: 'POST',
        body: JSON.stringify(cleanPayload(data as unknown as Record<string, unknown>)),
      },
    );
    return unwrapEntity<LeavePolicyAssignment>(res, 'assignment');
  },

  /**
   * Automatically provision / credit leave balances for all active employees of a company
   * according to the effective policy rules (Upfront vs Monthly accrual).
   */
  async provisionCompanyEmployeeBalances(
    companyId: string,
    policy: LeavePolicy,
    year: number = new Date().getFullYear(),
  ): Promise<{ provisionedCount: number; employeeCount: number }> {
    try {
      // 1. Fetch active employees belonging to this company
      const searchParams = new URLSearchParams({ limit: '500' });
      const empsRes = await apiClient<unknown>(`/hr/employees?${searchParams.toString()}`).catch(
        () => null,
      );

      const records = unwrapList<{
        id: string;
        name?: string;
        status?: string;
        companyId?: string;
        userId?: string;
        user_id?: string;
      }>(empsRes, 'records');

      const targetCompanyId = String(companyId || '')
        .trim()
        .toLowerCase();
      const companyMatched = records.filter(
        (e) =>
          e.status !== 'TERMINATED' &&
          Boolean(e.companyId) &&
          String(e.companyId).trim().toLowerCase() === targetCompanyId,
      );

      // If specific company employees are found, use them; otherwise use all active employees
      const activeEmployees =
        companyMatched.length > 0
          ? companyMatched
          : records.filter((e) => e.status !== 'TERMINATED');

      const entitlementsList =
        policy.entitlements ||
        ((policy as unknown as Record<string, unknown>)
          ?.policyEntitlements as typeof policy.entitlements) ||
        ((policy as unknown as Record<string, unknown>)
          ?.policy_entitlements as typeof policy.entitlements) ||
        [];

      if (activeEmployees.length === 0 || entitlementsList.length === 0) {
        return { provisionedCount: 0, employeeCount: activeEmployees.length };
      }

      // 2. Compute initial provision days for each entitlement based on accrual type and current month
      const currentMonth = new Date().getMonth() + 1; // 1-12
      let provisioned = 0;

      for (const emp of activeEmployees) {
        if (!emp || !emp.id) continue;
        const empUserId = emp.userId || emp.user_id;
        for (const ent of entitlementsList) {
          const annualQuota = ent.annualQuota ?? ent.quotaDays ?? 0;
          if (annualQuota <= 0) continue;

          let initialDays = annualQuota;
          if (ent.accrualType === 'MONTHLY') {
            // Prorated elapsed months in the year (e.g. 9/12 * 18 = 13.5 days)
            initialDays = Math.round((annualQuota / 12) * currentMonth * 10) / 10;
          } else if (ent.accrualType === 'QUARTERLY') {
            const currentQuarter = Math.ceil(currentMonth / 3);
            initialDays = Math.round((annualQuota / 4) * currentQuarter * 10) / 10;
          }

          try {
            await this.adjustBalance({
              employeeId: emp.id,
              userId: empUserId,
              leaveTypeId: ent.leaveTypeId,
              year,
              adjustment: initialDays,
              reason: `Automated balance provisioning: ${policy.name}`,
            });
            if (empUserId && empUserId !== emp.id) {
              await this.adjustBalance({
                employeeId: empUserId,
                leaveTypeId: ent.leaveTypeId,
                year,
                adjustment: initialDays,
                reason: `Automated balance provisioning: ${policy.name}`,
              }).catch(() => {});
            }
            provisioned++;
          } catch {
            // If already credited or handled by backend, continue gracefully
          }
        }
      }

      return { provisionedCount: provisioned, employeeCount: activeEmployees.length };
    } catch {
      return { provisionedCount: 0, employeeCount: 0 };
    }
  },

  /**
   * 4-Tier Hierarchical Policy Resolution:
   * 1. Employee-specific override
   * 2. Company-specific custom or assigned policy
   * 3. Workspace standard policy
   * 4. Fallback default
   */
  async resolveEmployeeEffectivePolicy(params: {
    employeeId?: string;
    companyId?: string;
    policies?: LeavePolicy[];
  }): Promise<LeavePolicy | null> {
    const list = params.policies || (await this.getPolicies(true).catch(() => []));
    const today = new Date().toISOString().slice(0, 10);

    // 1. Check Employee-specific assignment
    if (params.employeeId) {
      const empPolicy = list.find((p) =>
        p.assignments?.some(
          (a) =>
            a.employeeId === params.employeeId &&
            a.effectiveFrom <= today &&
            (!a.effectiveTo || a.effectiveTo >= today),
        ),
      );
      if (empPolicy) return empPolicy;
    }

    // 2. Check Company-specific custom or assigned policy
    if (params.companyId) {
      const compId = String(params.companyId).trim().toLowerCase();
      const compPolicy = list.find(
        (p) =>
          (p.companyId && String(p.companyId).trim().toLowerCase() === compId) ||
          p.assignments?.some(
            (a) =>
              String(a.companyId || '')
                .trim()
                .toLowerCase() === compId &&
              a.effectiveFrom <= today &&
              (!a.effectiveTo || a.effectiveTo >= today),
          ),
      );
      if (compPolicy) return compPolicy;
    }

    // 3. Fallback to Workspace standard active policy
    const standardPolicy = list.find(
      (p) => !p.companyId && !p.isCustomCompanyPolicy && p.isActive !== false,
    );
    return standardPolicy || list[0] || null;
  },

  // -------------------------------------------------------------
  // 5. Leave Balances & Manual HR Adjustments
  // -------------------------------------------------------------

  /**
   * Get employee leave balances across the workspace.
   * GET /api/v1/leave/balances?employeeId=...&year=...
   */
  async getEmployeeBalances(params?: {
    employeeId?: string;
    year?: number;
    leaveTypeId?: string;
  }): Promise<LeaveBalance[]> {
    const searchParams = new URLSearchParams();
    if (params?.employeeId) searchParams.set('employeeId', params.employeeId);
    if (params?.year) searchParams.set('year', String(params.year));
    if (params?.leaveTypeId) searchParams.set('leaveTypeId', params.leaveTypeId);

    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    try {
      const res = await apiClient<unknown>(`/leave/balances${qs}`);
      return unwrapList<LeaveBalance>(res, 'balances');
    } catch {
      // If general /leave/balances endpoint is not implemented or returns 404,
      // fallback to current user's balances so self-service data loads gracefully
      try {
        return await this.getMyBalances(params?.year);
      } catch {
        return [];
      }
    }
  },

  /**
   * Adjust employee leave balance manually with reason.
   * POST /api/v1/leave/balances/adjust
   */
  async adjustBalance(data: LeaveBalanceAdjustmentRequest): Promise<LeaveBalance> {
    const payload = {
      employeeId: data.employeeId,
      userId: data.userId || data.employeeId,
      leaveTypeId: data.leaveTypeId,
      year: Number(data.year),
      adjustment: Number(data.adjustment),
      adjustedDays: Number(data.adjustment),
      adjustmentDays: Number(data.adjustment),
      days: Number(data.adjustment),
      amount: Number(data.adjustment),
      openingBalance: Number(data.adjustment),
      accrued: Number(data.adjustment),
      reason: data.reason,
    };
    const res = await apiClient<unknown>('/leave/balances/adjust', {
      method: 'POST',
      body: JSON.stringify(cleanPayload(payload)),
    });
    return unwrapEntity<LeaveBalance>(res, 'balance');
  },

  // -------------------------------------------------------------
  // 6. Payroll Loss of Pay (LOP) Summary
  // -------------------------------------------------------------

  /**
   * Fetches monthly payroll LOP summary for an employee.
   * GET /api/v1/leave/employees/:id/payroll-lop?month=:month&year=:year
   */
  async getPayrollLop(employeeId: string, month: number, year: number): Promise<PayrollLopSummary> {
    const res = await apiClient<unknown>(
      `/leave/employees/${employeeId}/payroll-lop?month=${month}&year=${year}`,
    );
    return unwrapEntity<PayrollLopSummary>(res);
  },

  /**
   * Fetch approved leaves for a specific employee.
   * GET /api/v1/leave/applications?employeeId=:id&status=:status&limit=100
   */
  async getEmployeeApplications(
    employeeId: string,
    status: string = 'APPROVED',
  ): Promise<LeaveApplication[]> {
    const res = await apiClient<unknown>(
      `/leave/applications?employeeId=${encodeURIComponent(employeeId)}&status=${encodeURIComponent(status)}&limit=100`,
    );
    return unwrapList<LeaveApplication>(res, 'applications');
  },
};

export const leaveService = LeaveService;
