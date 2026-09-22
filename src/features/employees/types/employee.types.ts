export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACTOR' | 'CASUAL' | 'INTERN';
export type EmployeeStatus = 'ACTIVE' | 'PROBATION' | 'SUSPENDED' | 'TERMINATED' | 'RESIGNED';
export type BloodGroup =
  | 'A_POSITIVE'
  | 'A_NEGATIVE'
  | 'B_POSITIVE'
  | 'B_NEGATIVE'
  | 'AB_POSITIVE'
  | 'AB_NEGATIVE'
  | 'O_POSITIVE'
  | 'O_NEGATIVE';

export type AssignmentType = 'INTERNAL' | 'CLIENT_DEPLOYMENT';

export interface CurrentAssignmentSummary {
  readonly id?: string;
  readonly assignmentType?: AssignmentType;
  readonly companyId?: string;
  readonly companyName?: string;
  readonly companyType?: 'INTERNAL' | 'CLIENT';
  readonly departmentId?: string;
  readonly departmentName?: string;
  readonly jobRoleId?: string;
  readonly jobRoleName?: string;
  readonly siteId?: string;
  readonly siteName?: string;
  readonly shiftId?: string;
  readonly shiftName?: string;
  readonly supervisorId?: string;
  readonly supervisorName?: string;
  readonly reportingToEmployeeId?: string;
  readonly reportingToEmployeeName?: string;
  readonly effectiveFrom?: string;
  readonly effectiveTo?: string;
  readonly isActive?: boolean;
}

export interface Employee {
  readonly id: string;
  readonly employeeCode: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email?: string;
  readonly phone?: string;
  readonly designation?: string;
  readonly companyId?: string;
  readonly companyName?: string;
  readonly departmentName?: string;
  readonly avatarUrl?: string;
  readonly reportingManagerName?: string;
  readonly reportingManagerRole?: string;
  readonly reportingManagerAvatar?: string;
  readonly dateOfJoining: string;
  readonly dateOfBirth?: string;
  readonly gender?: 'MALE' | 'FEMALE' | 'OTHER';
  readonly employmentType: EmploymentType;
  readonly status: EmployeeStatus;

  // Operational Assignment Context
  readonly currentAssignment?: CurrentAssignmentSummary;

  // Emergency Contact
  readonly emergencyContactName?: string;
  readonly emergencyContactPhone?: string;
  readonly emergencyContactRelation?: string;

  // Indian Statutory & KYC (EPFO Form 11 / ESIC)
  readonly aadhaarNumber?: string;
  readonly panNumber?: string;
  readonly uanNumber?: string;
  readonly pfNumber?: string;
  readonly esicIpNumber?: string;

  // Bank Details
  readonly bankName?: string;
  readonly bankAccountNumber?: string;
  readonly bankIfscCode?: string;
  readonly bankAccountHolderName?: string;

  // Family & Personal Demographics
  readonly fatherOrSpouseName?: string;
  readonly fatherOrSpouseRelation?: 'FATHER' | 'HUSBAND' | 'WIFE' | 'MOTHER';
  readonly maritalStatus?: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
  readonly bloodGroup?: string;
  readonly nationality?: string;
  readonly physicallyChallenged?: boolean;

  // Addresses
  readonly currentAddress?: string;
  readonly currentCity?: string;
  readonly currentState?: string;
  readonly currentPincode?: string;
  readonly permanentAddress?: string;
  readonly permanentCity?: string;
  readonly permanentState?: string;
  readonly permanentPincode?: string;

  // Police Verification
  readonly policeVerificationCertNo?: string;
  readonly policeStationName?: string;
  readonly policeVerificationDate?: string;
  readonly policeVerificationExpiryDate?: string;

  readonly userId?: string;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

export interface EmployeeAssignment {
  readonly id: string;
  readonly employeeId: string;
  readonly assignmentType?: AssignmentType;
  readonly companyId?: string;
  readonly companyName?: string;
  readonly departmentId?: string;
  readonly departmentName?: string;
  readonly jobRoleId: string;
  readonly jobRoleName?: string;
  readonly siteId?: string;
  readonly siteName?: string;
  readonly shiftId?: string;
  readonly shiftName?: string;
  readonly supervisorId?: string;
  readonly supervisorName?: string;
  readonly reportingToEmployeeId?: string;
  readonly reportingToEmployeeName?: string;
  readonly effectiveFrom: string;
  readonly effectiveTo?: string;
  readonly isActive: boolean;
}

export interface EmployeeListResponse {
  readonly records: Employee[];
  readonly pagination: {
    readonly total: number;
    readonly page: number;
    readonly limit: number;
    readonly totalPages: number;
  };
}

export type FaceImageType = 'FRONT' | 'LEFT' | 'RIGHT' | 'UP' | 'DOWN';

export interface FaceImageUploadTarget {
  readonly imageType: FaceImageType;
  readonly uploadUrl: string;
  readonly s3ObjectKey?: string;
}

export interface FaceRegistrationSessionResponse {
  readonly registrationSessionId: string;
  readonly employeeId: string;
  readonly images?: FaceImageUploadTarget[];
  readonly urls?: Record<FaceImageType, string>;
  readonly s3ObjectKeys?: Record<FaceImageType, string>;
}

export type FaceProfileStatus =
  'PENDING' | 'IN_PROGRESS' | 'ACTIVE' | 'READY' | 'NOT_ENROLLED' | 'FAILED';

export interface FaceImageRecord {
  readonly id?: string;
  readonly employeeId?: string;
  readonly imageType?: FaceImageType;
  readonly s3ObjectKey?: string;
  readonly uploadStatus?: string;
  readonly indexStatus?: string;
  readonly confidenceScore?: number;
  readonly s3Url?: string;
  readonly createdAt?: string;
}

export interface FaceProfile {
  readonly id?: string;
  readonly employeeId: string;
  readonly collectionId?: string;
  readonly rekognitionCollectionId?: string;
  readonly rekognitionUserId?: string;
  readonly status?: FaceProfileStatus | string;
  readonly isRegistered?: boolean;
  readonly registeredAt?: string;
  readonly faceEmbeddingCount?: number;
}

export interface FaceProfileResponse {
  readonly profile?: FaceProfile | null;
  readonly images?: FaceImageRecord[];
  readonly id?: string;
  readonly employeeId?: string;
  readonly collectionId?: string;
  readonly rekognitionCollectionId?: string;
  readonly rekognitionUserId?: string;
  readonly status?: FaceProfileStatus | string;
  readonly isRegistered?: boolean;
  readonly registeredAt?: string;
  readonly faceEmbeddingCount?: number;
}

export interface FaceRegistrationSession {
  readonly id: string;
  readonly employeeId: string;
  readonly collectionId?: string;
  readonly status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  readonly anglesCompleted?: number;
  readonly totalAngles?: number;
  readonly images?: FaceImageUploadTarget[];
  readonly urls?: Record<FaceImageType, string>;
  readonly s3ObjectKeys?: Record<FaceImageType, string>;
  readonly createdAt?: string;
}

export interface CompanyOption {
  readonly id: string;
  readonly name: string;
  readonly code?: string;
  readonly type?: 'INTERNAL' | 'CLIENT';
}

export interface JobRoleOption {
  readonly id: string;
  readonly name: string;
  readonly code?: string;
}

export interface SiteOption {
  readonly id: string;
  readonly name: string;
  readonly companyId?: string;
  readonly city?: string;
}

export interface ShiftOption {
  readonly id: string;
  readonly name: string;
  readonly startTime?: string;
  readonly endTime?: string;
}

export interface SupervisorOption {
  readonly id: string;
  readonly name: string;
  readonly code?: string;
}

export interface AttendanceRecord {
  readonly id?: string;
  readonly employeeId?: string;
  readonly date: string;
  readonly checkInTime?: string | null;
  readonly checkOutTime?: string | null;
  readonly status: string;
  readonly hoursWorked?: number | null;
  readonly verificationMethod?: string | null;
  readonly siteName?: string | null;
  readonly companyName?: string | null;
}

export interface AttendanceHistoryResponse {
  readonly presentDays: number;
  readonly halfDays: number;
  readonly absentDays: number;
  readonly onLeaveDays: number;
  readonly totalWorkedHours: number;
  readonly records: AttendanceRecord[];
}
