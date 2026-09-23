import { z } from 'zod';
import { HolidayType, OverrideType } from '../types/holiday.types';

export const holidayTypeSchema = z.nativeEnum(HolidayType);
export const overrideTypeSchema = z.nativeEnum(OverrideType);

export const createHolidayCalendarSchema = z.object({
  name: z.string().min(2, 'Calendar name must be at least 2 characters').max(100),
  code: z
    .string()
    .min(2, 'Calendar code must be at least 2 characters')
    .max(50)
    .regex(/^[A-Z0-9_-]+$/i, 'Code must contain only letters, numbers, underscores, or hyphens')
    .transform((val) => val.toUpperCase()),
  year: z.coerce.number().int().min(2000).max(2100),
  description: z.string().max(500).optional().nullable(),
  isActive: z.boolean().default(true).optional(),
});

export const updateHolidayCalendarSchema = createHolidayCalendarSchema.partial();

export const createHolidayCalendarDaySchema = z.object({
  holidayDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  name: z.string().min(1, 'Holiday name is required').max(100),
  description: z.string().max(500).optional().nullable(),
  holidayType: holidayTypeSchema.default(HolidayType.NATIONAL),
  isPaid: z.boolean().default(true),
  isOptional: z.boolean().default(false),
});

export const updateHolidayCalendarDaySchema = createHolidayCalendarDaySchema.partial();

export const assignCompanyHolidayCalendarSchema = z.object({
  calendarId: z.string().uuid('Valid calendar ID is required'),
  effectiveFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Effective from date must be formatted as YYYY-MM-DD'),
  effectiveTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Effective to date must be formatted as YYYY-MM-DD')
    .optional()
    .nullable(),
  weeklyOffDays: z
    .array(z.number().int().min(0).max(6))
    .min(1, 'Select at least one weekly-off day')
    .default([0]),
});

export const updateCompanyHolidayCalendarSchema = z.object({
  effectiveTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Effective to date must be formatted as YYYY-MM-DD')
    .optional()
    .nullable(),
  weeklyOffDays: z.array(z.number().int().min(0).max(6)).optional(),
  isActive: z.boolean().optional(),
});

export const createEmployeeHolidayOverrideSchema = z.object({
  holidayDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Holiday date must be formatted as YYYY-MM-DD'),
  overrideType: overrideTypeSchema,
  name: z.string().max(100).optional().nullable(),
  isPaid: z.boolean().default(true).optional(),
  reason: z.string().max(500).optional().nullable(),
});

export type CreateHolidayCalendarInput = z.infer<typeof createHolidayCalendarSchema>;
export type UpdateHolidayCalendarInput = z.infer<typeof updateHolidayCalendarSchema>;
export type CreateHolidayCalendarDayInput = z.infer<typeof createHolidayCalendarDaySchema>;
export type UpdateHolidayCalendarDayInput = z.infer<typeof updateHolidayCalendarDaySchema>;
export type AssignCompanyHolidayCalendarInput = z.infer<typeof assignCompanyHolidayCalendarSchema>;
export type UpdateCompanyHolidayCalendarInput = z.infer<typeof updateCompanyHolidayCalendarSchema>;
export type CreateEmployeeHolidayOverrideInput = z.infer<
  typeof createEmployeeHolidayOverrideSchema
>;
