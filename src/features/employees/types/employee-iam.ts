/**
 * Employee IAM & Security Permission Types
 * Implements the Centralized Identity + Security Role architecture for HRMS.
 */

export interface Permission {
  id: string;
  code: string;
  name: string;
  description?: string;
  subject: string;
  action: string;
  fields?: string[] | null;
  conditions?: Record<string, unknown> | null;
  inverted?: boolean;
}

export interface PolicyModule {
  id?: string;
  code: string;
  name: string;
  description?: string;
  category?: string;
  permissions: Permission[];
}

export interface SecurityRole {
  id: string;
  code: string;
  name: string;
  description: string;
  isSystem: boolean;
  isWorkspaceAdmin?: boolean;
  policyModules?: PolicyModule[];
  permissions?: Permission[];
}

export interface DirectPermissionOverride {
  permissionId: string;
  code?: string;
  name?: string;
  effect: 'GRANT' | 'DENY';
  reason?: string;
}

export interface EffectivePermissionsData {
  employeeId: string;
  userId?: string;
  assignedRoles: Array<{
    id: string;
    code: string;
    name: string;
    description?: string;
  }>;
  directOverrides: Array<{
    permissionId: string;
    code: string;
    name?: string;
    type: 'GRANT' | 'DENY';
    reason?: string;
  }>;
  effectivePermissions: string[];
}

export interface EmployeeSecurityFormValues {
  // Step 1: Personal & Workforce Info
  employeeCode: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth?: string;
  dateOfJoining: string;
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN' | 'PROBATION';

  // Step 2: Department & HR Job Role
  departmentId?: string;
  jobRoleId?: string;

  // Step 3: Security Roles
  selectedRoleIds: string[];

  // Step 4: Permission Overrides
  grantedOverrides: Array<{ permissionId: string; reason?: string }>;
  deniedOverrides: Array<{ permissionId: string; reason?: string }>;

  // Step 5: Credentials & Password Policy
  initialPassword?: string;
  forceChangePassword: boolean;

  // Optional Additional Demographics / Statutory / Banking
  fatherOrSpouseName?: string;
  fatherOrSpouseRelation?: 'FATHER' | 'HUSBAND';
  maritalStatus?: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
  bloodGroup?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  uanNumber?: string;
  pfNumber?: string;
  esicIpNumber?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  bankAccountHolderName?: string;
  currentAddress?: string;
  currentCity?: string;
  currentState?: string;
  currentPincode?: string;
  permanentAddress?: string;
  permanentCity?: string;
  permanentState?: string;
  permanentPincode?: string;
}
