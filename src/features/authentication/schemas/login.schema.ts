import { z } from 'zod';

export const adminLoginSchema = z.object({
  email: z.string().trim().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

export const employeeLoginSchema = z.object({
  employeeCode: z
    .string()
    .trim()
    .min(2, { message: 'Please enter a valid employee code (e.g., EMP4991)' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

export const unifiedLoginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(2, { message: 'Please enter your email address or employee code' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

export const sendOtpSchema = z.object({
  email: z.string().trim().email({ message: 'Please enter a valid email address' }),
});

export const verifyOtpSchema = z.object({
  email: z.string().trim().email({ message: 'Please enter a valid email address' }),
  otp: z
    .string()
    .length(4, { message: 'OTP must be exactly 4 digits' })
    .regex(/^\d{4}$/, { message: 'OTP must contain only digits' }),
});

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(2, { message: 'Workspace name must be at least 2 characters' }),
  slug: z
    .string()
    .trim()
    .min(2, { message: 'Slug must be at least 2 characters' })
    .regex(/^[a-z0-9-]+$/, {
      message: 'Slug must contain only lowercase letters, numbers, and hyphens',
    }),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type EmployeeLoginInput = z.infer<typeof employeeLoginSchema>;
export type UnifiedLoginInput = z.infer<typeof unifiedLoginSchema>;
export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
