import { apiClient } from '@/lib/client/api-client';
import type {
  Employee,
  EmployeeAssignment,
  EmployeeListResponse,
  EmploymentType,
  EmployeeStatus,
  FaceRegistrationSession,
  FaceRegistrationSessionResponse,
  FaceProfileResponse,
  CompanyOption,
  JobRoleOption,
  SiteOption,
  ShiftOption,
  SupervisorOption,
  AttendanceHistoryResponse,
  AttendanceRecord,
} from '../types/employee.types';
import type {
  CreateEmployeeInput,
  UpdateEmployeeInput,
  AssignEmployeeInput,
} from '../schemas/employee.schema';

export interface GetEmployeesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  companyId?: string;
}

function unwrapList<T>(res: unknown, key?: string): T[] {
  if (Array.isArray(res)) return res;
  if (typeof res === 'object' && res !== null) {
    const obj = res as Record<string, unknown>;
    if (Array.isArray(obj.records)) return obj.records as T[];
    if (key && Array.isArray(obj[key])) return obj[key] as T[];
    if (Array.isArray(obj.data)) return obj.data as T[];
    if (Array.isArray(obj.employees)) return obj.employees as T[];
    if (Array.isArray(obj.items)) return obj.items as T[];
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

function normalizeEmploymentType(val: unknown): EmploymentType {
  if (typeof val !== 'string') return 'FULL_TIME';
  const upper = val.trim().toUpperCase();
  if (
    upper === 'FULL_TIME' ||
    upper === 'SALARIED' ||
    upper === 'FULLTIME' ||
    upper === 'PERMANENT'
  )
    return 'FULL_TIME';
  if (upper === 'PART_TIME' || upper === 'HOURLY' || upper === 'PARTTIME') return 'PART_TIME';
  if (upper === 'CONTRACTOR' || upper === 'CONTRACT' || upper === 'CONTRACTUAL')
    return 'CONTRACTOR';
  if (
    upper === 'CASUAL' ||
    upper === 'DAILY_WAGE' ||
    upper === 'DAILYWAGE' ||
    upper === 'TEMP' ||
    upper === 'TEMPORARY'
  )
    return 'CASUAL';
  if (upper === 'INTERN' || upper === 'TRAINEE' || upper === 'INTERNSHIP') return 'INTERN';
  return 'FULL_TIME';
}

function normalizeEmployeeStatus(val: unknown, isActive?: boolean): EmployeeStatus {
  if (typeof val === 'string') {
    const upper = val.trim().toUpperCase();
    if (upper === 'ACTIVE') return 'ACTIVE';
    if (upper === 'PROBATION') return 'PROBATION';
    if (upper === 'SUSPENDED') return 'SUSPENDED';
    if (upper === 'TERMINATED' || upper === 'EXITED') return 'TERMINATED';
    if (upper === 'RESIGNED') return 'RESIGNED';
  }
  if (isActive === false) return 'SUSPENDED';
  return 'ACTIVE';
}

export function normalizeEmployee(raw: unknown): Employee {
  if (!raw || typeof raw !== 'object') {
    return {
      id: '',
      employeeCode: '',
      firstName: '',
      lastName: '',
      dateOfJoining: new Date().toISOString().split('T')[0] ?? '',
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
    };
  }

  const obj = raw as Record<string, unknown>;

  const firstName = (obj.firstName ?? obj.first_name ?? '') as string;
  const lastName = (obj.lastName ?? obj.last_name ?? '') as string;

  const rawEmploymentType =
    obj.employmentType ?? obj.employment_type ?? obj.type ?? obj.employment_category ?? 'FULL_TIME';

  const rawStatus =
    obj.status ??
    obj.employee_status ??
    obj.state ??
    (obj.isActive === false || obj.is_active === false ? 'INACTIVE' : 'ACTIVE');

  return {
    id: String(obj.id ?? ''),
    employeeCode: String(obj.employeeCode ?? obj.employee_code ?? obj.code ?? ''),
    firstName,
    lastName,
    email: (obj.email as string) || undefined,
    phone: (obj.phone ?? obj.mobile_number ?? obj.mobile) as string | undefined,
    designation: (obj.designation ?? obj.job_title ?? obj.role_name) as string | undefined,
    companyId: (obj.companyId ?? obj.company_id) as string | undefined,
    companyName: (obj.companyName ?? obj.company_name) as string | undefined,
    departmentName: (obj.departmentName ?? obj.department_name) as string | undefined,
    avatarUrl: (obj.avatarUrl ?? obj.avatar_url ?? obj.avatar) as string | undefined,
    reportingManagerName: (obj.reportingManagerName ??
      obj.reporting_manager_name ??
      obj.reporting_manager) as string | undefined,
    reportingManagerRole: (obj.reportingManagerRole ?? obj.reporting_manager_role) as
      string | undefined,
    reportingManagerAvatar: (obj.reportingManagerAvatar ?? obj.reporting_manager_avatar) as
      string | undefined,
    dateOfJoining: String(
      obj.dateOfJoining ??
        obj.date_of_joining ??
        obj.joining_date ??
        obj.createdAt ??
        obj.created_at ??
        new Date().toISOString().split('T')[0],
    ),
    dateOfBirth: (obj.dateOfBirth ?? obj.date_of_birth ?? obj.dob) as string | undefined,
    gender: (obj.gender as 'MALE' | 'FEMALE' | 'OTHER') || undefined,
    employmentType: normalizeEmploymentType(rawEmploymentType),
    status: normalizeEmployeeStatus(
      rawStatus,
      (obj.isActive as boolean | undefined) ?? (obj.is_active as boolean | undefined),
    ),

    // Emergency Contact
    emergencyContactName: (obj.emergencyContactName ?? obj.emergency_contact_name) as
      string | undefined,
    emergencyContactPhone: (obj.emergencyContactPhone ?? obj.emergency_contact_phone) as
      string | undefined,
    emergencyContactRelation: (obj.emergencyContactRelation ?? obj.emergency_contact_relation) as
      string | undefined,

    // Indian Statutory & KYC
    aadhaarNumber: (obj.aadhaarNumber ?? obj.aadhaar_number ?? obj.aadhaar) as string | undefined,
    panNumber: (obj.panNumber ?? obj.pan_number ?? obj.pan) as string | undefined,
    uanNumber: (obj.uanNumber ?? obj.uan_number ?? obj.uan) as string | undefined,
    pfNumber: (obj.pfNumber ?? obj.pf_number ?? obj.pf_member_id) as string | undefined,
    esicIpNumber: (obj.esicIpNumber ?? obj.esic_ip_number ?? obj.esic_number) as string | undefined,

    // Bank Details
    bankName: (obj.bankName ?? obj.bank_name) as string | undefined,
    bankAccountNumber: (obj.bankAccountNumber ?? obj.bank_account_number ?? obj.account_number) as
      string | undefined,
    bankIfscCode: (obj.bankIfscCode ?? obj.bank_ifsc_code ?? obj.ifsc_code) as string | undefined,
    bankAccountHolderName: (obj.bankAccountHolderName ??
      obj.bank_account_holder_name ??
      obj.account_holder_name) as string | undefined,

    // Demographics & Family
    fatherOrSpouseName: (obj.fatherOrSpouseName ?? obj.father_or_spouse_name ?? obj.father_name) as
      string | undefined,
    fatherOrSpouseRelation: (obj.fatherOrSpouseRelation ?? obj.father_or_spouse_relation) as
      'FATHER' | 'HUSBAND' | 'WIFE' | 'MOTHER' | undefined,
    maritalStatus: (obj.maritalStatus ?? obj.marital_status) as
      'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | undefined,
    bloodGroup: (obj.bloodGroup ?? obj.blood_group) as string | undefined,
    nationality: (obj.nationality ?? 'INDIAN') as string,
    physicallyChallenged: Boolean(
      obj.physicallyChallenged ?? obj.physically_challenged ?? obj.is_pwd,
    ),

    // Addresses
    currentAddress: (obj.currentAddress ?? obj.current_address) as string | undefined,
    currentCity: (obj.currentCity ?? obj.current_city) as string | undefined,
    currentState: (obj.currentState ?? obj.current_state) as string | undefined,
    currentPincode: (obj.currentPincode ?? obj.current_pincode ?? obj.current_zip) as
      string | undefined,
    permanentAddress: (obj.permanentAddress ?? obj.permanent_address) as string | undefined,
    permanentCity: (obj.permanentCity ?? obj.permanent_city) as string | undefined,
    permanentState: (obj.permanentState ?? obj.permanent_state) as string | undefined,
    permanentPincode: (obj.permanentPincode ?? obj.permanent_pincode ?? obj.permanent_zip) as
      string | undefined,

    // Police Verification
    policeVerificationCertNo: (obj.policeVerificationCertNo ??
      obj.police_verification_cert_no ??
      obj.police_verification_number) as string | undefined,
    policeStationName: (obj.policeStationName ?? obj.police_station_name) as string | undefined,
    policeVerificationDate: (obj.policeVerificationDate ?? obj.police_verification_date) as
      string | undefined,
    policeVerificationExpiryDate: (obj.policeVerificationExpiryDate ??
      obj.police_verification_expiry_date) as string | undefined,

    userId: (obj.userId ?? obj.user_id) as string | undefined,
    createdAt: (obj.createdAt ?? obj.created_at) as string | undefined,
    updatedAt: (obj.updatedAt ?? obj.updated_at) as string | undefined,
  };
}

export const EmployeeService = {
  /**
   * Fetch paginated list of employees with optional filters.
   */
  async getEmployees(params: GetEmployeesParams = {}): Promise<EmployeeListResponse> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.search) searchParams.set('search', params.search);
    if (params.status) searchParams.set('status', params.status);
    if (params.companyId) searchParams.set('companyId', params.companyId);

    const qs = searchParams.toString();
    const endpoint = `/hr/employees${qs ? `?${qs}` : ''}`;

    const res = await apiClient<unknown>(endpoint);
    if (typeof res === 'object' && res !== null && 'records' in (res as Record<string, unknown>)) {
      const obj = res as { records: unknown[]; pagination?: EmployeeListResponse['pagination'] };
      const normalizedList = Array.isArray(obj.records) ? obj.records.map(normalizeEmployee) : [];
      return {
        records: normalizedList,
        pagination: obj.pagination || {
          total: normalizedList.length,
          page: params.page ?? 1,
          limit: params.limit ?? 20,
          totalPages: Math.ceil(normalizedList.length / (params.limit ?? 20)) || 1,
        },
      };
    }
    const list = unwrapList<unknown>(res, 'employees');
    const normalizedList = list.map(normalizeEmployee);
    return {
      records: normalizedList,
      pagination: {
        total: normalizedList.length,
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        totalPages: Math.ceil(normalizedList.length / (params.limit ?? 20)) || 1,
      },
    };
  },

  /**
   * Fetch single employee details by ID.
   */
  async getEmployeeById(id: string): Promise<Employee> {
    const res = await apiClient<unknown>(`/hr/employees/${id}`);
    const entity = unwrapEntity<unknown>(res, 'employee');
    return normalizeEmployee(entity);
  },

  /**
   * Create a new employee record.
   */
  async createEmployee(data: CreateEmployeeInput): Promise<Employee> {
    const cleanedPayload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v !== '' && v !== undefined && v !== null) {
        cleanedPayload[k] = v;
      }
    }

    const res = await apiClient<unknown>('/hr/employees', {
      method: 'POST',
      body: JSON.stringify(cleanedPayload),
    });
    const entity = unwrapEntity<unknown>(res, 'employee');
    return normalizeEmployee(entity);
  },

  /**
   * Update existing employee record.
   */
  async updateEmployee(id: string, data: UpdateEmployeeInput): Promise<Employee> {
    const cleanedPayload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v !== '' && v !== undefined && v !== null) {
        cleanedPayload[k] = v;
      }
    }

    const res = await apiClient<unknown>(`/hr/employees/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(cleanedPayload),
    });
    const entity = unwrapEntity<unknown>(res, 'employee');
    return normalizeEmployee(entity);
  },

  /**
   * Delete an employee record.
   */
  async deleteEmployee(id: string): Promise<{ success: boolean }> {
    return apiClient<{ success: boolean }>(`/hr/employees/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Fetch assignments for a specific employee.
   */
  async getEmployeeAssignments(employeeId: string): Promise<EmployeeAssignment[]> {
    const res = await apiClient<unknown>(`/hr/employees/${employeeId}/assignments`);
    return unwrapList<EmployeeAssignment>(res, 'assignments');
  },

  /**
   * Assign employee to company, site, job role, and shift.
   */
  async createAssignment(
    employeeId: string,
    data: AssignEmployeeInput,
  ): Promise<EmployeeAssignment> {
    const payload: Record<string, unknown> = { ...data };
    if (payload.assignmentType === 'INTERNAL') {
      delete payload.companyId;
      delete payload.siteId;
    }
    for (const [k, v] of Object.entries(payload)) {
      if (v === '' || v === undefined) {
        delete payload[k];
      }
    }
    const res = await apiClient<unknown>(`/hr/employees/${employeeId}/assignments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return unwrapEntity<EmployeeAssignment>(res, 'assignment');
  },

  /**
   * Get active assignment for an employee.
   */
  async getActiveAssignment(employeeId: string): Promise<EmployeeAssignment | null> {
    try {
      const res = await apiClient<unknown>(`/hr/employees/${employeeId}/assignments/active`);
      if (!res || typeof res !== 'object') return null;
      return unwrapEntity<EmployeeAssignment>(res, 'assignment');
    } catch {
      return null;
    }
  },

  /**
   * Terminate active assignment for an employee.
   */
  async terminateAssignment(
    employeeId: string,
    data: { endDate: string },
  ): Promise<{ success: boolean }> {
    return apiClient<{ success: boolean }>(`/hr/employees/${employeeId}/assignments/terminate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Start a 5-angle face registration session and retrieve S3 presigned upload URLs.
   */
  async startFaceRegistration(data: {
    employeeId: string;
    collectionId?: string;
  }): Promise<FaceRegistrationSessionResponse> {
    const res = await apiClient<unknown>(
      `/hr/employees/${data.employeeId}/face-registration-sessions`,
      {
        method: 'POST',
        body: JSON.stringify({ collectionId: data.collectionId || 'default-hrms-collection' }),
      },
    );

    if (typeof res === 'object' && res !== null) {
      const obj = res as Record<string, unknown>;
      if (obj.registrationSessionId || obj.images || obj.urls) {
        return obj as unknown as FaceRegistrationSessionResponse;
      }
      if (obj.data && typeof obj.data === 'object') {
        return obj.data as FaceRegistrationSessionResponse;
      }
    }
    return res as FaceRegistrationSessionResponse;
  },

  /**
   * Direct HTTP PUT upload of a captured angle image blob directly to AWS S3.
   * Does NOT send image files through the application backend.
   */
  async uploadFaceAngleToS3(uploadUrl: string, imageBlob: Blob | File): Promise<void> {
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'image/jpeg',
      },
      body: imageBlob,
    });
    if (!res.ok) {
      throw new Error(`Failed to upload face image to S3: ${res.status} ${res.statusText}`);
    }
  },

  /**
   * Notify backend that all 5 face angle images have been uploaded to S3.
   * This triggers server-side AWS Rekognition vector indexing.
   */
  async completeFaceRegistrationSession(
    employeeId: string,
    sessionId: string,
  ): Promise<FaceProfileResponse | null> {
    try {
      const res = await apiClient<unknown>(
        `/hr/employees/${employeeId}/face-registration-sessions/${sessionId}/complete`,
        {
          method: 'POST',
        },
      );
      if (!res || typeof res !== 'object') return null;
      return res as FaceProfileResponse;
    } catch {
      return null;
    }
  },

  /**
   * Check employee facial biometric profile status.
   */
  async getFaceProfile(employeeId: string): Promise<FaceProfileResponse | null> {
    try {
      const res = await apiClient<unknown>(`/hr/employees/${employeeId}/face-profile`);
      if (!res || typeof res !== 'object') return null;
      return res as FaceProfileResponse;
    } catch {
      return null;
    }
  },

  /**
   * Fetch face registration sessions for an employee.
   */
  async getFaceSessions(employeeId: string): Promise<FaceRegistrationSession[]> {
    try {
      const res = await apiClient<unknown>(
        `/hr/employees/${employeeId}/face-registration-sessions`,
      );
      return unwrapList<FaceRegistrationSession>(res, 'sessions');
    } catch {
      return [];
    }
  },

  /**
   * Fetch active company options (optionally filtered by type: INTERNAL | CLIENT).
   */
  async getCompanyOptions(type?: 'INTERNAL' | 'CLIENT'): Promise<CompanyOption[]> {
    try {
      const qs = type ? `?type=${encodeURIComponent(type)}` : '';
      const res = await apiClient<unknown>(`/hr/companies${qs}`);
      return unwrapList<CompanyOption>(res, 'companies');
    } catch {
      return [];
    }
  },

  /**
   * Fetch active department options (optionally filtered by companyId).
   */
  async getDepartmentOptions(
    companyId?: string,
  ): Promise<Array<{ id: string; name: string; code?: string }>> {
    try {
      const qs = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '';
      const res = await apiClient<unknown>(`/hr/departments${qs}`);
      return unwrapList<{ id: string; name: string; code?: string }>(res, 'departments');
    } catch {
      return [];
    }
  },

  /**
   * Fetch active job role options (optionally filtered by departmentId).
   */
  async getJobRoleOptions(departmentId?: string): Promise<JobRoleOption[]> {
    try {
      const qs = departmentId ? `?departmentId=${encodeURIComponent(departmentId)}` : '';
      const res = await apiClient<unknown>(`/hr/job-roles${qs}`);
      return unwrapList<JobRoleOption>(res, 'roles');
    } catch {
      return [];
    }
  },

  /**
   * Fetch active work site options (optionally filtered by companyId).
   */
  async getSiteOptions(companyId?: string): Promise<SiteOption[]> {
    try {
      const qs = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '';
      const res = await apiClient<unknown>(`/hr/sites${qs}`);
      return unwrapList<SiteOption>(res, 'sites');
    } catch {
      return [];
    }
  },

  /**
   * Fetch active shift schedule options (optionally filtered by companyId).
   */
  async getShiftOptions(companyId?: string): Promise<ShiftOption[]> {
    try {
      const qs = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '';
      const res = await apiClient<unknown>(`/hr/shifts${qs}`);
      return unwrapList<ShiftOption>(res, 'shifts');
    } catch {
      return [];
    }
  },

  /**
   * Fetch registered employees to serve as reporting supervisors / managers.
   * Supervisors can manage workers across multiple client deployments.
   */
  async getSupervisorOptions(excludeEmployeeId?: string): Promise<SupervisorOption[]> {
    try {
      const res = await apiClient<unknown>('/hr/employees?limit=100');
      const list = unwrapList<Employee>(res, 'records');
      return list
        .filter((emp) => emp.id !== excludeEmployeeId)
        .map((emp) => ({
          id: emp.id,
          name: `${emp.firstName} ${emp.lastName}`.trim(),
          code: emp.employeeCode,
        }));
    } catch {
      return [];
    }
  },

  /**
   * Fetch employee self-service 30-day attendance history from /hr/attendance/my-history
   */
  async getMyAttendanceHistory(params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<AttendanceHistoryResponse | null> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.startDate) searchParams.set('startDate', params.startDate);
      if (params?.endDate) searchParams.set('endDate', params.endDate);
      const qs = searchParams.toString();
      const res = await apiClient<unknown>(`/hr/attendance/my-history${qs ? `?${qs}` : ''}`);
      if (res && typeof res === 'object') {
        const obj = res as Record<string, unknown>;
        return {
          presentDays: Number(obj.presentDays ?? 0),
          halfDays: Number(obj.halfDays ?? 0),
          absentDays: Number(obj.absentDays ?? 0),
          onLeaveDays: Number(obj.onLeaveDays ?? 0),
          totalWorkedHours: Number(obj.totalWorkedHours ?? 0),
          records: Array.isArray(obj.records)
            ? (obj.records as AttendanceRecord[])
            : Array.isArray(obj.data)
              ? (obj.data as AttendanceRecord[])
              : [],
        };
      }
      return null;
    } catch {
      return null;
    }
  },
};
