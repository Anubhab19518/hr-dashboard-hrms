import { z } from 'zod';

export const createCompanySchema = z.object({
  name: z.string().trim().min(2, 'Company name must be at least 2 characters'),
  code: z.string().trim().min(2, 'Company code is required (e.g. ACME01)'),
  type: z.enum(['INTERNAL', 'CLIENT']).default('CLIENT'),
  legalName: z.string().trim().optional(),
  description: z.string().trim().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  contactEmail: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
  contactPhone: z.string().trim().optional(),
  address: z.string().trim().optional(),

  // Tax & Statutory Registrations
  gstin: z.string().trim().optional(),
  pan: z.string().trim().optional(),
  tan: z.string().trim().optional(),
  cin: z.string().trim().optional(),
  epfRegistrationNo: z.string().trim().optional(),
  esicRegistrationNo: z.string().trim().optional(),
  ptRegistrationNo: z.string().trim().optional(),
  lwfRegistrationNo: z.string().trim().optional(),
  msmeUdyamNo: z.string().trim().optional(),
  shopEstablishmentNo: z.string().trim().optional(),
  psaraLicenseNo: z.string().trim().optional(),

  // Addresses
  registeredAddress: z.string().trim().optional(),
  registeredCity: z.string().trim().optional(),
  registeredState: z.string().trim().optional(),
  registeredPincode: z.string().trim().optional(),
  stateCode: z.string().trim().optional(),

  billingAddress: z.string().trim().optional(),
  billingCity: z.string().trim().optional(),
  billingState: z.string().trim().optional(),
  billingPincode: z.string().trim().optional(),

  // Bank Details
  bankName: z.string().trim().optional(),
  bankAccountNumber: z.string().trim().optional(),
  bankIfscCode: z.string().trim().optional(),
  bankBranch: z.string().trim().optional(),

  // Signatory
  signatoryName: z.string().trim().optional(),
  signatoryDesignation: z.string().trim().optional(),
  signatoryEmail: z.string().trim().email('Invalid email').optional().or(z.literal('')),
  signatoryPhone: z.string().trim().optional(),

  // Location Coordinates
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
});
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;

export const createSiteSchema = z.object({
  name: z.string().trim().min(1, 'Site name is required'),
  code: z.string().trim().min(1, 'Site code is required'),
  companyId: z.string().trim().min(1, 'Company is required'),
  address: z.string().trim().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  geofenceRadiusMeters: z.coerce.number().min(10, 'Minimum 10 meters').default(100),
});
export type CreateSiteInput = z.infer<typeof createSiteSchema>;

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(1, 'Department name is required'),
  code: z.string().trim().min(1, 'Department code is required'),
  companyId: z.string().trim().min(1, 'Company is required'),
  siteId: z.string().trim().optional(),
});
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;

export const createJobRoleSchema = z.object({
  name: z.string().trim().min(1, 'Job role name is required'),
  code: z.string().trim().min(1, 'Job role code is required'),
  companyId: z.string().trim().optional(),
  departmentId: z.string().trim().optional(),
  level: z.string().trim().optional(),
});
export type CreateJobRoleInput = z.infer<typeof createJobRoleSchema>;

export const createShiftSchema = z.object({
  name: z.string().trim().min(1, 'Shift name is required'),
  code: z.string().trim().min(1, 'Shift code is required'),
  companyId: z.string().trim().optional(),
  siteId: z.string().trim().optional(),
  startTime: z.string().min(1, 'Start time is required'), // "09:00"
  endTime: z.string().min(1, 'End time is required'), // "18:00"
  gracePeriodMinutes: z.coerce.number().default(15),
  isOvernight: z.boolean().default(false),
});
export type CreateShiftInput = z.infer<typeof createShiftSchema>;
