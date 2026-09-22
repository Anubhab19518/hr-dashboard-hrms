export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'REPORTED' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
export type SOSStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface MapSite {
  readonly id: string;
  readonly name: string;
  readonly code: string;
  readonly address?: string;
  readonly latitude?: number;
  readonly longitude?: number;
  readonly geofenceRadiusMeters?: number;
}

export interface SafetyIncident {
  readonly id: string;
  readonly siteId?: string;
  readonly siteName?: string;
  readonly reportedById?: string;
  readonly reportedByName?: string;
  readonly severity: IncidentSeverity;
  readonly status: IncidentStatus;
  readonly title: string;
  readonly description: string;
  readonly latitude?: number;
  readonly longitude?: number;
  readonly createdAt: string;
  readonly resolvedAt?: string;
}

export interface SOSAlert {
  readonly id: string;
  readonly employeeId: string;
  readonly employeeName?: string;
  readonly employeeCode?: string;
  readonly siteId?: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly status: SOSStatus;
  readonly triggeredAt: string;
  readonly resolvedAt?: string;
}

export interface WorkerLocation {
  readonly employeeId: string;
  readonly employeeName: string;
  readonly employeeCode?: string;
  readonly siteId?: string;
  readonly siteName?: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly batteryLevel?: number;
  readonly lastHeartbeat: string;
  readonly isSafe: boolean;
}
