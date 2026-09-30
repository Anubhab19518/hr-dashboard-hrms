/**
 * Leave Management Types & Models
 * Source of truth: Frontend Integration Guide: Leave Management & HR Dashboard
 */

export enum LeaveGender {
  ALL = 'ALL',
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export enum AccrualType {
  UPFRONT = 'UPFRONT',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
}

export enum HalfDayType {
  FULL = 'FULL',
  FIRST_HALF = 'FIRST_HALF',
  SECOND_HALF = 'SECOND_HALF',
}

export enum LeaveStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  REVOKED = 'REVOKED',
}

export interface LeaveType {
  id: string;
  workspaceId?: string;
  name: string;
  code: string;
  description?: string | null;
  isPaid: boolean;
  isCarryForward: boolean;
  maxCarryForwardDays?: number | null;
  isEncashable: boolean;
  requiresDocument: boolean;
  minDaysNotice: number;
  maxConsecutiveDays?: number | null;
  applicableGender: LeaveGender;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeavePolicyEntitlement {
  id?: string;
  policyId?: string;
  leaveTypeId: string;
  annualQuota?: number;
  quotaDays?: number;
  accrualType: AccrualType;
  leaveType?: LeaveType;
}

export interface LeavePolicyAssignment {
  id: string;
  policyId: string;
  companyId?: string | null;
  companyName?: string | null;
  employeeId?: string | null;
  employeeName?: string | null;
  effectiveFrom: string;
  effectiveTo?: string | null;
  createdAt?: string;
}

export interface LeavePolicy {
  id: string;
  workspaceId?: string;
  companyId?: string | null;
  companyName?: string | null;
  isCustomCompanyPolicy?: boolean;
  name: string;
  description?: string | null;
  effectiveFrom: string;
  effectiveTo?: string | null;
  isActive: boolean;
  entitlements?: LeavePolicyEntitlement[];
  assignments?: LeavePolicyAssignment[];
  assignmentsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeaveBalance {
  id: string;
  employeeId?: string;
  employeeName?: string;
  employeeCode?: string;
  leaveTypeId: string;
  leaveType?: LeaveType;
  leaveTypeCode?: string;
  leaveTypeName?: string;
  year: number;
  openingBalance: number;
  accrued: number;
  used: number;
  lopDays: number;
  adjusted: number;
  closingBalance: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeaveApplicationDocument {
  id: string;
  applicationId: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  fileUrl?: string;
  uploadedAt: string;
}

export interface LeaveApplication {
  id: string;
  workspaceId?: string;
  employeeId: string;
  employeeName?: string;
  employeeCode?: string;
  employeeAvatarUrl?: string;
  companyId?: string | null;
  companyName?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  jobRoleId?: string | null;
  jobRoleName?: string | null;
  designation?: string | null;
  leaveTypeId: string;
  leaveType?: LeaveType;
  leaveTypeCode?: string;
  leaveTypeName?: string;
  fromDate: string;
  toDate: string;
  fromHalf: HalfDayType;
  toHalf: HalfDayType;
  appliedDays: number;
  reason?: string | null;
  status: LeaveStatus;
  approvedBy?: string | null;
  approvedByName?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  cancellationReason?: string | null;
  comments?: string | null;
  documents?: LeaveApplicationDocument[];
  currentBalance?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApplyLeaveRequest {
  leaveTypeId: string;
  fromDate: string;
  toDate: string;
  fromHalf?: HalfDayType;
  toHalf?: HalfDayType;
  reason?: string;
  companyId?: string;
}

export interface LeaveBalanceAdjustmentRequest {
  employeeId: string;
  userId?: string;
  leaveTypeId: string;
  year: number;
  adjustment: number;
  reason: string;
}

export interface PayrollLopBreakdownItem {
  leaveTypeCode: string;
  leaveTypeName: string;
  isPaid: boolean;
  approvedDays: number;
}

export interface PayrollLopSummary {
  employeeId: string;
  employeeName?: string;
  period: {
    month: number;
    year: number;
  };
  leaveBreakdown: PayrollLopBreakdownItem[];
  totalLopDays: number;
  totalPaidLeaveDays: number;
}
