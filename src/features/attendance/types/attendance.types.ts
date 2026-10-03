export type VerificationMethod =
  | 'FACE'
  | 'GPS'
  | 'MANUAL'
  | 'QR'
  | 'BLE'
  | 'MOBILE_APP'
  | 'WEB_PORTAL'
  | 'KIOSK'
  | 'MANUAL_OVERRIDE';

export type AttendanceLogType = 'CHECK_IN' | 'CHECK_OUT';
export type AttendanceStatus =
  'PRESENT' | 'LATE' | 'HALF_DAY' | 'OVERTIME' | 'EARLY_EXIT' | 'ABSENT' | 'ON_LEAVE';

export interface AttendanceCompanyInfo {
  readonly id: string;
  readonly name: string;
  readonly code?: string;
}

export interface AttendanceJobRoleInfo {
  readonly id: string;
  readonly name: string;
  readonly code?: string;
}

export interface AttendanceDepartmentInfo {
  readonly id: string;
  readonly name: string;
  readonly code?: string;
}

export interface AttendanceEmployeeDisambiguation {
  readonly id: string;
  readonly employeeCode?: string;
  readonly name: string;
  readonly company?: AttendanceCompanyInfo | null;
  readonly jobRole?: AttendanceJobRoleInfo | null;
  readonly department?: AttendanceDepartmentInfo | null;
}

export interface AttendanceLocation {
  readonly siteId?: string | null;
  readonly siteName?: string | null;
  readonly siteCode?: string | null;
  readonly address?: string | null;
  readonly city?: string | null;
  readonly state?: string | null;
  readonly latitude?: number | null;
  readonly longitude?: number | null;
  readonly h3Index?: string | null;
}

export interface AttendanceLog {
  readonly id: string;
  readonly employeeId: string;
  readonly attendanceDate?: string;
  readonly status: AttendanceStatus;
  readonly checkInTime?: string | null;
  readonly checkOutTime?: string | null;
  readonly source?: 'MOBILE_APP' | 'WEB_PORTAL' | 'KIOSK' | 'MANUAL_OVERRIDE' | string;
  readonly faceMatchScore?: number | null;
  readonly checkInLatitude?: number | null;
  readonly checkInLongitude?: number | null;
  // Disambiguation Details
  readonly employee?: AttendanceEmployeeDisambiguation | null;
  // Flattened fallbacks
  readonly employeeName?: string | null;
  readonly employeeCode?: string | null;
  readonly companyName?: string | null;
  readonly jobRoleName?: string | null;
  readonly departmentName?: string | null;
  readonly siteName?: string | null;
  readonly siteAddress?: string | null;
  // Resolved Site Location
  readonly location?: AttendanceLocation | null;
  // Legacy / backward-compat fields
  readonly siteId?: string;
  readonly logType?: AttendanceLogType;
  readonly timestamp?: string;
  readonly verificationMethod?: VerificationMethod;
  readonly confidenceScore?: number;
  readonly latitude?: number;
  readonly longitude?: number;
  readonly isWithinGeofence?: boolean;
  readonly notes?: string;
  readonly createdAt?: string;
}

export type AttendanceRecord = AttendanceLog;

export interface AttendanceDailySummary {
  readonly date?: string;
  readonly totalExpected?: number;
  readonly totalPresent?: number;
  readonly totalLate?: number;
  readonly totalAbsent?: number;
  readonly onLeave?: number;
  readonly geofenceCompliancePercentage?: number;
  readonly present?: number;
  readonly presentCount?: number;
  readonly expected?: number;
  readonly totalEmployees?: number;
  readonly totalScheduled?: number;
  readonly late?: number;
  readonly lateCount?: number;
  readonly absent?: number;
  readonly absentCount?: number;
  readonly leave?: number;
  readonly onLeaveCount?: number;
  readonly compliance?: number;
  readonly geofenceCompliance?: number;
}

export type EarlyCheckoutStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface EarlyCheckoutEmployeeInfo {
  readonly id?: string;
  readonly name?: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly code?: string;
  readonly employeeCode?: string;
  readonly company?: string | AttendanceCompanyInfo | null;
  readonly companyName?: string | null;
  readonly department?: string | { readonly id?: string; readonly name?: string } | null;
  readonly departmentName?: string | null;
  readonly role?: string | { readonly id?: string; readonly name?: string } | null;
  readonly designation?: string | null;
  readonly avatar?: string;
  readonly avatarUrl?: string;
  readonly photoUrl?: string;
  readonly email?: string;
}

export interface EarlyCheckoutRequest {
  readonly id: string;
  readonly employeeId: string;
  readonly employee?: EarlyCheckoutEmployeeInfo;
  readonly shiftId?: string;
  readonly shiftName?: string;
  readonly scheduledShiftEndTime: string;
  readonly requestedCheckoutTime: string;
  readonly reason: string;
  readonly status: EarlyCheckoutStatus;
  readonly requestedAt: string;
  readonly reviewedBy?:
    string | { readonly id?: string; readonly name?: string; readonly email?: string };
  readonly reviewedAt?: string;
  readonly rejectionReason?: string;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

export interface EarlyCheckoutActionInput {
  action: 'APPROVE' | 'REJECT';
  rejectionReason?: string;
}

export interface GetEarlyCheckoutRequestsParams {
  status?: EarlyCheckoutStatus | 'ALL' | string;
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedEarlyCheckoutResponse {
  items: EarlyCheckoutRequest[];
  total: number;
  page: number;
  limit: number;
  pendingCount?: number;
}
