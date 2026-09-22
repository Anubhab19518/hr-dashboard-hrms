import { z } from 'zod';

export const logAttendanceSchema = z.object({
  employeeId: z.string().trim().min(1, 'Employee is required'),
  siteId: z.string().trim().optional(),
  logType: z.enum(['CHECK_IN', 'CHECK_OUT']),
  timestamp: z.string().min(1, 'Timestamp is required'),
  verificationMethod: z.enum(['FACE', 'GPS', 'MANUAL', 'QR', 'BLE']).default('MANUAL'),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  notes: z.string().trim().optional(),
});

export type LogAttendanceInput = z.infer<typeof logAttendanceSchema>;
