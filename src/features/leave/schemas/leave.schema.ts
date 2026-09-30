import { z } from 'zod';
import { LeaveGender, AccrualType, HalfDayType } from '../types/leave.types';

export const applyLeaveSchema = z
  .object({
    leaveTypeId: z.string().min(1, 'Please select a leave type'),
    fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid start date (YYYY-MM-DD) is required'),
    toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid end date (YYYY-MM-DD) is required'),
    fromHalf: z.nativeEnum(HalfDayType).default(HalfDayType.FULL),
    toHalf: z.nativeEnum(HalfDayType).default(HalfDayType.FULL),
    reason: z
      .string()
      .trim()
      .min(3, 'Please provide a reason with at least 3 characters')
      .max(500, 'Reason must not exceed 500 characters'),
    companyId: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (!data.fromDate || !data.toDate) return true;
      return new Date(data.fromDate) <= new Date(data.toDate);
    },
    {
      message: 'End date must be on or after start date',
      path: ['toDate'],
    },
  );

export type ApplyLeaveInput = z.infer<typeof applyLeaveSchema>;

export const cancelLeaveSchema = z.object({
  cancellationReason: z
    .string()
    .trim()
    .min(3, 'Please provide a cancellation reason (min 3 characters)')
    .max(300, 'Reason must not exceed 300 characters'),
});

export type CancelLeaveInput = z.infer<typeof cancelLeaveSchema>;

export const reviewLeaveSchema = z.object({
  comments: z.string().trim().max(500, 'Comments must not exceed 500 characters').optional(),
});

export type ReviewLeaveInput = z.infer<typeof reviewLeaveSchema>;

export const createLeaveTypeSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  code: z
    .string()
    .trim()
    .min(1, 'Code is required')
    .max(20)
    .regex(/^[A-Z0-9_-]+$/i, 'Code must contain only letters, numbers, and underscores/dashes'),
  description: z.string().trim().max(300).optional().nullable(),
  isPaid: z.boolean().default(true),
  isCarryForward: z.boolean().default(false),
  maxCarryForwardDays: z.coerce.number().min(0).max(365).optional().nullable(),
  isEncashable: z.boolean().default(false),
  requiresDocument: z.boolean().default(false),
  minDaysNotice: z.coerce.number().min(0).max(90).default(0),
  maxConsecutiveDays: z.coerce.number().min(1).max(365).optional().nullable(),
  applicableGender: z.nativeEnum(LeaveGender).default(LeaveGender.ALL),
  isActive: z.boolean().default(true),
});

export type CreateLeaveTypeInput = z.infer<typeof createLeaveTypeSchema>;

export const updateLeaveTypeSchema = createLeaveTypeSchema.partial();
export type UpdateLeaveTypeInput = z.infer<typeof updateLeaveTypeSchema>;

export const leavePolicyEntitlementSchema = z.object({
  leaveTypeId: z.string().min(1, 'Leave type is required'),
  annualQuota: z.coerce.number().min(0, 'Annual quota must be >= 0').max(365).optional(),
  quotaDays: z.coerce.number().min(0, 'Quota days must be >= 0').max(365).optional(),
  accrualType: z.nativeEnum(AccrualType).default(AccrualType.UPFRONT),
});

export const createLeavePolicySchema = z.object({
  name: z.string().trim().min(2, 'Policy name is required').max(120),
  description: z.string().trim().max(300).optional().nullable(),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid effective from date is required'),
  effectiveTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid effective to date is required')
    .optional()
    .nullable(),
  companyId: z.string().optional().nullable(),
  isCustomCompanyPolicy: z.boolean().optional(),
  entitlements: z
    .array(leavePolicyEntitlementSchema)
    .min(1, 'Policy must have at least one leave type quota entitlement'),
});

export type CreateLeavePolicyInput = z.infer<typeof createLeavePolicySchema>;

export const updateLeavePolicySchema = createLeavePolicySchema.partial();
export type UpdateLeavePolicyInput = z.infer<typeof updateLeavePolicySchema>;

export const assignLeavePolicySchema = z
  .object({
    companyId: z.string().optional().nullable(),
    employeeId: z.string().optional().nullable(),
    effectiveFrom: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid assignment start date is required'),
    effectiveTo: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid assignment end date is required')
      .optional()
      .nullable(),
  })
  .refine((data) => Boolean(data.companyId || data.employeeId), {
    message: 'Please assign policy to either a Company or an Employee',
    path: ['companyId'],
  });

export type AssignLeavePolicyInput = z.infer<typeof assignLeavePolicySchema>;

export const adjustLeaveBalanceSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  leaveTypeId: z.string().min(1, 'Leave type is required'),
  year: z.coerce.number().int().min(2020).max(2100).default(new Date().getFullYear()),
  adjustment: z.coerce
    .number()
    .refine((val) => val !== 0, { message: 'Adjustment cannot be zero' })
    .refine((val) => val >= -100 && val <= 100, {
      message: 'Adjustment must be between -100 and +100 days',
    }),
  reason: z
    .string()
    .trim()
    .min(3, 'Adjustment reason is required (min 3 characters)')
    .max(300, 'Reason must not exceed 300 characters'),
});

export type AdjustLeaveBalanceInput = z.infer<typeof adjustLeaveBalanceSchema>;
