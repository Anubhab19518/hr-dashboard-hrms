import { z } from 'zod';

export const announcementTypeEnum = z.enum([
  'GENERAL',
  'URGENT',
  'HOLIDAY',
  'POLICY_UPDATE',
  'EVENT',
  'MAINTENANCE',
  'PAYROLL',
  'POLICY',
  'EMERGENCY',
]);

export const announcementPriorityEnum = z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']);

export const createAnnouncementSchema = z.object({
  companyId: z.string().nullable().optional(),
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(255, 'Title cannot exceed 255 characters'),
  message: z.string().trim().min(1, 'Message body is required'),
  type: announcementTypeEnum.default('GENERAL'),
  priority: announcementPriorityEnum.default('NORMAL'),
  isPublished: z.boolean().default(true),
  publishedAt: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
});

export const updateAnnouncementSchema = createAnnouncementSchema.partial();

export type CreateAnnouncementSchemaInput = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementSchemaInput = z.infer<typeof updateAnnouncementSchema>;
