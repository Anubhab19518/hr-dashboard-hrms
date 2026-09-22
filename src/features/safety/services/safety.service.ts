import { apiClient } from '@/lib/client/api-client';
import type {
  SafetyIncident,
  SOSAlert,
  WorkerLocation,
  IncidentStatus,
} from '../types/safety.types';
import type { ReportIncidentInput } from '../schemas/safety.schema';

function unwrapList<T>(res: unknown, key?: string): T[] {
  if (Array.isArray(res)) return res;
  if (typeof res === 'object' && res !== null) {
    const obj = res as Record<string, unknown>;
    if (Array.isArray(obj.records)) return obj.records as T[];
    if (key && Array.isArray(obj[key])) return obj[key] as T[];
    if (Array.isArray(obj.data)) return obj.data as T[];
    if (Array.isArray(obj.alerts)) return obj.alerts as T[];
    if (Array.isArray(obj.incidents)) return obj.incidents as T[];
    if (Array.isArray(obj.locations)) return obj.locations as T[];
  }
  return [];
}

function unwrapEntity<T>(res: unknown, key?: string): T {
  if (typeof res === 'object' && res !== null) {
    const obj = res as Record<string, unknown>;
    if (key && obj[key] && typeof obj[key] === 'object') return obj[key] as T;
  }
  return res as T;
}

export const SafetyService = {
  /**
   * Fetch all logged safety incidents.
   */
  async getIncidents(): Promise<SafetyIncident[]> {
    try {
      const res = await apiClient<unknown>('/hr/safety/incidents');
      return unwrapList<SafetyIncident>(res, 'incidents');
    } catch {
      try {
        const res = await apiClient<unknown>('/safety/incidents');
        return unwrapList<SafetyIncident>(res, 'incidents');
      } catch {
        return [];
      }
    }
  },

  /**
   * Log a new safety incident.
   */
  async reportIncident(data: ReportIncidentInput): Promise<SafetyIncident> {
    try {
      const res = await apiClient<unknown>('/hr/safety/incidents', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return unwrapEntity<SafetyIncident>(res, 'incident');
    } catch {
      const res = await apiClient<unknown>('/safety/incidents', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return unwrapEntity<SafetyIncident>(res, 'incident');
    }
  },

  /**
   * Update incident investigation / resolution status.
   */
  async updateIncidentStatus(id: string, status: IncidentStatus): Promise<SafetyIncident> {
    try {
      const res = await apiClient<unknown>(`/hr/safety/incidents/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      return unwrapEntity<SafetyIncident>(res, 'incident');
    } catch {
      const res = await apiClient<unknown>(`/safety/incidents/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      return unwrapEntity<SafetyIncident>(res, 'incident');
    }
  },

  /**
   * Fetch active and acknowledged emergency SOS alerts.
   */
  async getSOSAlerts(): Promise<SOSAlert[]> {
    try {
      const res = await apiClient<unknown>('/hr/safety/alerts?resolved=false');
      return unwrapList<SOSAlert>(res, 'alerts');
    } catch {
      try {
        const res = await apiClient<unknown>('/safety/sos');
        return unwrapList<SOSAlert>(res, 'alerts');
      } catch {
        return [];
      }
    }
  },

  /**
   * Acknowledge or resolve an active SOS emergency trigger.
   */
  async resolveSOS(id: string): Promise<SOSAlert> {
    try {
      const res = await apiClient<unknown>(`/hr/safety/alerts/${id}/resolve`, {
        method: 'POST',
      });
      return unwrapEntity<SOSAlert>(res, 'alert');
    } catch {
      const res = await apiClient<unknown>(`/safety/sos/${id}/resolve`, {
        method: 'POST',
      });
      return unwrapEntity<SOSAlert>(res, 'alert');
    }
  },

  /**
   * Fetch live GPS telemetry coordinates of on-duty workforce.
   */
  async getWorkerLocations(): Promise<WorkerLocation[]> {
    try {
      const res = await apiClient<unknown>('/hr/location-tracking/live');
      return unwrapList<WorkerLocation>(res, 'locations');
    } catch {
      try {
        const res = await apiClient<unknown>('/safety/workers/locations');
        return unwrapList<WorkerLocation>(res, 'locations');
      } catch {
        return [];
      }
    }
  },
};
