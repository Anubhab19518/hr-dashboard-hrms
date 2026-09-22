import { z } from 'zod';

export const employmentTypeEnum = z.enum([
  'FULL_TIME',
  'PART_TIME',
  'CONTRACTOR',
  'CASUAL',
  'INTERN',
]);
export const employeeStatusEnum = z.enum([
  'ACTIVE',
  'PROBATION',
  'SUSPENDED',
  'TERMINATED',
  'RESIGNED',
]);
export const bloodGroupEnum = z.enum([
  'A_POSITIVE',
  'A_NEGATIVE',
  'B_POSITIVE',
  'B_NEGATIVE',
  'AB_POSITIVE',
  'AB_NEGATIVE',
  'O_POSITIVE',
  'O_NEGATIVE',
]);

export const createEmployeeSchema = z.object({
  employeeCode: z.string().trim().min(1, 'Employee code is required'),
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().trim().optional(),
  companyId: z.string().trim().optional(),
  dateOfJoining: z.string().min(1, 'Date of joining is required'),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  employmentType: employmentTypeEnum.default('FULL_TIME'),
  status: employeeStatusEnum.default('ACTIVE'),

  // Emergency Contact
  emergencyContactName: z.string().trim().optional(),
  emergencyContactPhone: z.string().trim().optional(),
  emergencyContactRelation: z.string().trim().optional(),

  // Statutory & KYC
  aadhaarNumber: z.string().trim().optional(),
  panNumber: z.string().trim().optional(),
  uanNumber: z.string().trim().optional(),
  pfNumber: z.string().trim().optional(),
  esicIpNumber: z.string().trim().optional(),

  // Bank Details
  bankName: z.string().trim().optional(),
  bankAccountNumber: z.string().trim().optional(),
  bankIfscCode: z.string().trim().optional(),
  bankAccountHolderName: z.string().trim().optional(),

  // Family & Personal Demographics
  fatherOrSpouseName: z.string().trim().optional(),
  fatherOrSpouseRelation: z.enum(['FATHER', 'HUSBAND', 'WIFE', 'MOTHER']).optional(),
  maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']).optional(),
  bloodGroup: bloodGroupEnum.optional().or(z.literal('')),
  nationality: z.string().trim().default('INDIAN'),
  physicallyChallenged: z.boolean().default(false),

  // Addresses
  currentAddress: z.string().trim().optional(),
  currentCity: z.string().trim().optional(),
  currentState: z.string().trim().optional(),
  currentPincode: z.string().trim().optional(),
  permanentAddress: z.string().trim().optional(),
  permanentCity: z.string().trim().optional(),
  permanentState: z.string().trim().optional(),
  permanentPincode: z.string().trim().optional(),

  // Police Verification
  policeVerificationCertNo: z.string().trim().optional(),
  policeStationName: z.string().trim().optional(),
  policeVerificationDate: z.string().optional(),
  policeVerificationExpiryDate: z.string().optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const updateEmployeeSchema = createEmployeeSchema.partial();
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

export const assignEmployeeSchema = z
  .object({
    assignmentType: z.enum(['INTERNAL', 'CLIENT_DEPLOYMENT']).default('INTERNAL'),
    companyId: z.string().trim().optional(),
    departmentId: z.string().trim().optional(),
    jobRoleId: z.string().trim().min(1, 'Job role is required'),
    siteId: z.string().trim().optional(),
    shiftId: z.string().trim().optional(),
    supervisorId: z.string().trim().optional(),
    reportingToEmployeeId: z.string().trim().optional(),
    effectiveFrom: z.string().min(1, 'Effective from date is required'),
    effectiveTo: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.assignmentType === 'CLIENT_DEPLOYMENT' &&
      (!data.companyId || data.companyId.trim() === '')
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Client company is required for Client Deployment',
        path: ['companyId'],
      });
    }
  });

export type AssignEmployeeInput = z.infer<typeof assignEmployeeSchema>;
