export type VerificationMethod = 'FACE' | 'GPS' | 'MANUAL' | 'QR' | 'BLE';
export type AttendanceLogType = 'CHECK_IN' | 'CHECK_OUT';
export type AttendanceStatus = 'PRESENT' | 'LATE' | 'HALF_DAY' | 'OVERTIME' | 'EARLY_EXIT';

export interface AttendanceLog {
  readonly id: string;
  readonly employeeId: string;
  readonly employeeName?: string;
  readonly employeeCode?: string;
  readonly siteId?: string;
  readonly siteName?: string;
  readonly logType: AttendanceLogType;
  readonly timestamp: string;
  readonly verificationMethod: VerificationMethod;
  readonly confidenceScore?: number;
  readonly latitude?: number;
  readonly longitude?: number;
  readonly isWithinGeofence?: boolean;
  readonly status: AttendanceStatus;
  readonly notes?: string;
  readonly createdAt?: string;
}

export interface AttendanceDailySummary {
  readonly date: string;
  readonly totalExpected: number;
  readonly totalPresent: number;
  readonly totalLate: number;
  readonly totalAbsent: number;
  readonly onLeave: number;
  readonly geofenceCompliancePercentage: number;
}
