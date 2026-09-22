import { apiClient } from '@/lib/client/api-client';
import type { Company, Site, Department, JobRole, Shift } from '../types/organization.types';
import type {
  CreateCompanyInput,
  CreateSiteInput,
  CreateDepartmentInput,
  CreateJobRoleInput,
  CreateShiftInput,
} from '../schemas/organization.schema';

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
    if (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) return obj.data as T;
    if (obj.company && typeof obj.company === 'object') return obj.company as T;
    if (obj.record && typeof obj.record === 'object') return obj.record as T;
  }
  return res as T;
}

function normalizeDepartment(d: unknown): Department {
  if (typeof d !== 'object' || d === null) return d as Department;
  const obj = d as Record<string, unknown>;
  const compObj =
    typeof obj.company === 'object' && obj.company !== null
      ? (obj.company as Record<string, unknown>)
      : null;
  return {
    id: (obj.id as string) || '',
    workspaceId: (obj.workspaceId as string) || (obj.workspace_id as string) || undefined,
    name: (obj.name as string) || '',
    code: (obj.code as string) || '',
    companyId:
      (obj.companyId as string) ||
      (obj.company_id as string) ||
      (compObj?.id as string) ||
      undefined,
    companyName:
      (obj.companyName as string) ||
      (obj.company_name as string) ||
      (compObj?.name as string) ||
      undefined,
    description: (obj.description as string) || undefined,
    costCenterCode: (obj.costCenterCode as string) || (obj.cost_center_code as string) || undefined,
    isCostCenter: (obj.isCostCenter as boolean) ?? (obj.is_cost_center as boolean) ?? true,
    parentDepartmentId:
      (obj.parentDepartmentId as string) || (obj.parent_department_id as string) || undefined,
    hodEmployeeId: (obj.hodEmployeeId as string) || (obj.hod_employee_id as string) || undefined,
    siteId: (obj.siteId as string) || (obj.site_id as string) || undefined,
    siteName: (obj.siteName as string) || (obj.site_name as string) || undefined,
    status: (obj.status as 'ACTIVE' | 'INACTIVE') || 'ACTIVE',
    isActive: (obj.isActive as boolean) ?? (obj.is_active as boolean) ?? true,
    createdAt: (obj.createdAt as string) || (obj.created_at as string) || undefined,
    updatedAt: (obj.updatedAt as string) || (obj.updated_at as string) || undefined,
  };
}

function normalizeJobRole(r: unknown): JobRole {
  if (typeof r !== 'object' || r === null) return r as JobRole;
  const obj = r as Record<string, unknown>;
  return {
    id: (obj.id as string) || '',
    workspaceId: (obj.workspaceId as string) || (obj.workspace_id as string) || undefined,
    name: (obj.name as string) || '',
    code: (obj.code as string) || '',
    departmentId: (obj.departmentId as string) || (obj.department_id as string) || undefined,
    departmentName: (obj.departmentName as string) || (obj.department_name as string) || undefined,
    companyId: (obj.companyId as string) || (obj.company_id as string) || undefined,
    description: (obj.description as string) || undefined,
    isSupervisorRole:
      (obj.isSupervisorRole as boolean) ?? (obj.is_supervisor_role as boolean) ?? false,
    level: (obj.level as string) || undefined,
    status: (obj.status as 'ACTIVE' | 'INACTIVE') || 'ACTIVE',
    isActive: (obj.isActive as boolean) ?? (obj.is_active as boolean) ?? true,
    createdAt: (obj.createdAt as string) || (obj.created_at as string) || undefined,
    updatedAt: (obj.updatedAt as string) || (obj.updated_at as string) || undefined,
  };
}

function normalizeShift(s: unknown): Shift {
  if (typeof s !== 'object' || s === null) return s as Shift;
  const obj = s as Record<string, unknown>;
  const grace =
    (obj.graceMinutes as number) ??
    (obj.grace_minutes as number) ??
    (obj.gracePeriodMinutes as number) ??
    15;
  const halfDay = (obj.halfDayHours as number) ?? (obj.half_day_hours as number) ?? 4;
  return {
    id: (obj.id as string) || '',
    workspaceId: (obj.workspaceId as string) || (obj.workspace_id as string) || undefined,
    name: (obj.name as string) || '',
    code: (obj.code as string) || '',
    companyId: (obj.companyId as string) || (obj.company_id as string) || undefined,
    siteId: (obj.siteId as string) || (obj.site_id as string) || undefined,
    startTime: (obj.startTime as string) || (obj.start_time as string) || '09:00',
    endTime: (obj.endTime as string) || (obj.end_time as string) || '18:00',
    graceMinutes: Number(grace),
    gracePeriodMinutes: Number(grace),
    halfDayHours: Number(halfDay),
    description: (obj.description as string) || undefined,
    isOvernight: (obj.isOvernight as boolean) ?? (obj.is_overnight as boolean) ?? false,
    status: (obj.status as 'ACTIVE' | 'INACTIVE') || 'ACTIVE',
    isActive: (obj.isActive as boolean) ?? (obj.is_active as boolean) ?? true,
    createdAt: (obj.createdAt as string) || (obj.created_at as string) || undefined,
    updatedAt: (obj.updatedAt as string) || (obj.updated_at as string) || undefined,
  };
}

export const OrganizationService = {
  // Companies
  async getCompanies(type?: 'INTERNAL' | 'CLIENT'): Promise<Company[]> {
    const qs = type ? `?type=${encodeURIComponent(type)}` : '';
    const res = await apiClient<unknown>(`/hr/companies${qs}`);
    return unwrapList<Company>(res, 'companies');
  },
  async getCompany(id: string): Promise<Company> {
    const res = await apiClient<unknown>(`/hr/companies/${encodeURIComponent(id)}`);
    return unwrapEntity<Company>(res, 'company');
  },
  async getInternalCompany(): Promise<Company | null> {
    try {
      const res = await apiClient<unknown>('/hr/companies/internal');
      return unwrapEntity<Company>(res, 'company');
    } catch {
      return null;
    }
  },
  async createCompany(data: CreateCompanyInput): Promise<Company> {
    const res = await apiClient<unknown>('/hr/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return unwrapEntity<Company>(res, 'company');
  },
  async updateCompany(id: string, data: Partial<CreateCompanyInput>): Promise<Company> {
    const res = await apiClient<unknown>(`/hr/companies/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return unwrapEntity<Company>(res, 'company');
  },

  // Sites
  async getSites(companyId?: string): Promise<Site[]> {
    const qs = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '';
    const res = await apiClient<unknown>(`/hr/sites${qs}`);
    return unwrapList<Site>(res, 'sites');
  },
  async createSite(data: CreateSiteInput): Promise<Site> {
    const res = await apiClient<unknown>('/hr/sites', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return unwrapEntity<Site>(res, 'site');
  },

  // Departments
  async getDepartments(companyId?: string): Promise<Department[]> {
    const qs = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '';
    const res = await apiClient<unknown>(`/hr/departments${qs}`);
    const rawList = unwrapList<unknown>(res, 'departments');
    return rawList.map(normalizeDepartment);
  },
  async createDepartment(data: CreateDepartmentInput): Promise<Department> {
    const payload = {
      ...data,
      companyId: data.companyId || undefined,
      company_id: data.companyId || undefined,
    };
    const res = await apiClient<unknown>('/hr/departments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const entity = unwrapEntity<unknown>(res, 'department');
    const normalized = normalizeDepartment(entity);
    return {
      ...normalized,
      companyId: normalized.companyId || data.companyId,
    };
  },

  // Job Roles
  async getJobRoles(departmentId?: string): Promise<JobRole[]> {
    const qs = departmentId ? `?departmentId=${encodeURIComponent(departmentId)}` : '';
    const res = await apiClient<unknown>(`/hr/job-roles${qs}`);
    const rawList = unwrapList<unknown>(res, 'jobRoles');
    return rawList.map(normalizeJobRole);
  },
  async createJobRole(data: CreateJobRoleInput): Promise<JobRole> {
    const payload = {
      ...data,
      departmentId: data.departmentId || undefined,
      department_id: data.departmentId || undefined,
    };
    const res = await apiClient<unknown>('/hr/job-roles', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const entity = unwrapEntity<unknown>(res, 'jobRole');
    return normalizeJobRole(entity);
  },

  // Shifts
  async getShifts(companyId?: string): Promise<Shift[]> {
    const qs = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '';
    const res = await apiClient<unknown>(`/hr/shifts${qs}`);
    const rawList = unwrapList<unknown>(res, 'shifts');
    return rawList.map(normalizeShift);
  },
  async createShift(data: CreateShiftInput): Promise<Shift> {
    const graceVal = data.gracePeriodMinutes ?? 15;
    const payload = {
      ...data,
      graceMinutes: graceVal,
      grace_minutes: graceVal,
      halfDayHours: 4,
      half_day_hours: 4,
    };
    const res = await apiClient<unknown>('/hr/shifts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const entity = unwrapEntity<unknown>(res, 'shift');
    return normalizeShift(entity);
  },
  async updateShift(id: string, data: Partial<CreateShiftInput>): Promise<Shift> {
    const graceVal = data.gracePeriodMinutes !== undefined ? data.gracePeriodMinutes : undefined;
    const payload = {
      ...data,
      graceMinutes: graceVal,
      grace_minutes: graceVal,
    };
    const res = await apiClient<unknown>(`/hr/shifts/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    const entity = unwrapEntity<unknown>(res, 'shift');
    return normalizeShift(entity);
  },
  async deleteShift(id: string): Promise<void> {
    await apiClient<unknown>(`/hr/shifts/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};
