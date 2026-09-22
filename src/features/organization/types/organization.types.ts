export type OrgEntityStatus = 'ACTIVE' | 'INACTIVE';
export type CompanyType = 'INTERNAL' | 'CLIENT';

export interface Company {
  readonly id: string;
  readonly workspaceId?: string;
  readonly name: string;
  readonly code: string;
  readonly type?: CompanyType;
  readonly legalName?: string;
  readonly description?: string;
  readonly contactEmail?: string;
  readonly contactPhone?: string;
  readonly address?: string;
  readonly status: OrgEntityStatus;
  readonly isActive?: boolean;
  readonly employeesCount?: number;
  readonly employeeCount?: number;
  readonly activeAssignmentsCount?: number;

  // Indian Tax & Statutory Registrations
  readonly gstin?: string;
  readonly pan?: string;
  readonly tan?: string;
  readonly cin?: string;
  readonly epfRegistrationNo?: string;
  readonly esicRegistrationNo?: string;
  readonly ptRegistrationNo?: string;
  readonly lwfRegistrationNo?: string;
  readonly msmeUdyamNo?: string;
  readonly shopEstablishmentNo?: string;
  readonly psaraLicenseNo?: string;

  // Registered & Billing Addresses
  readonly registeredAddress?: string;
  readonly registeredCity?: string;
  readonly registeredState?: string;
  readonly registeredPincode?: string;
  readonly stateCode?: string;
  readonly billingAddress?: string;
  readonly billingCity?: string;
  readonly billingState?: string;
  readonly billingPincode?: string;

  // Bank Account
  readonly bankName?: string;
  readonly bankAccountNumber?: string;
  readonly bankIfscCode?: string;
  readonly bankBranch?: string;

  // Authorized Signatory
  readonly signatoryName?: string;
  readonly signatoryDesignation?: string;
  readonly signatoryEmail?: string;
  readonly signatoryPhone?: string;

  // Location / Geofence Coordinates
  readonly latitude?: number;
  readonly longitude?: number;

  readonly createdAt?: string;
  readonly updatedAt?: string;
}

export interface Site {
  readonly id: string;
  readonly name: string;
  readonly code: string;
  readonly companyId: string;
  readonly companyName?: string;
  readonly address?: string;
  readonly latitude?: number;
  readonly longitude?: number;
  readonly geofenceRadiusMeters?: number;
  readonly status: OrgEntityStatus;
  readonly createdAt?: string;
}

export interface Department {
  readonly id: string;
  readonly workspaceId?: string;
  readonly name: string;
  readonly code: string;
  readonly companyId?: string;
  readonly companyName?: string;
  readonly description?: string;
  readonly costCenterCode?: string;
  readonly isCostCenter?: boolean;
  readonly parentDepartmentId?: string;
  readonly hodEmployeeId?: string;
  readonly siteId?: string;
  readonly siteName?: string;
  readonly status: OrgEntityStatus;
  readonly isActive?: boolean;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

export interface JobRole {
  readonly id: string;
  readonly workspaceId?: string;
  readonly name: string;
  readonly code: string;
  readonly departmentId?: string;
  readonly departmentName?: string;
  readonly companyId?: string;
  readonly description?: string;
  readonly isSupervisorRole?: boolean;
  readonly level?: string;
  readonly status: OrgEntityStatus;
  readonly isActive?: boolean;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

export interface Shift {
  readonly id: string;
  readonly workspaceId?: string;
  readonly name: string;
  readonly code: string;
  readonly companyId?: string;
  readonly siteId?: string;
  readonly startTime: string; // "09:00"
  readonly endTime: string; // "18:00"
  readonly gracePeriodMinutes?: number;
  readonly graceMinutes?: number;
  readonly halfDayHours?: number;
  readonly description?: string;
  readonly isOvernight?: boolean;
  readonly status: OrgEntityStatus;
  readonly isActive?: boolean;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}
