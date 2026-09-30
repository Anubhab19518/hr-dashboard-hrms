import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SafetyService } from '../services/safety.service';
import { apiClient } from '@/lib/client/api-client';

vi.mock('@/lib/client/api-client', () => ({
  apiClient: vi.fn(),
}));

describe('SafetyService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches safety incidents with fallback and error handling', async () => {
    vi.mocked(apiClient).mockResolvedValueOnce({
      incidents: [{ id: 'inc-1', title: 'Slip hazard', severity: 'LOW' }],
    });

    const incidents = await SafetyService.getIncidents();
    expect(incidents.length).toBe(1);
    expect(incidents[0]!.title).toBe('Slip hazard');

    // Test secondary endpoint and safe fallback
    vi.mocked(apiClient)
      .mockRejectedValueOnce(new Error('404'))
      .mockResolvedValueOnce({
        incidents: [{ id: 'inc-2', title: 'Fall', severity: 'HIGH' }],
      });

    const fallbackIncidents = await SafetyService.getIncidents();
    expect(fallbackIncidents.length).toBe(1);

    vi.mocked(apiClient)
      .mockRejectedValueOnce(new Error('404'))
      .mockRejectedValueOnce(new Error('500'));
    const empty = await SafetyService.getIncidents();
    expect(empty).toEqual([]);
  });

  it('reports incident and updates incident status with fallback', async () => {
    vi.mocked(apiClient)
      .mockResolvedValueOnce({
        incident: { id: 'inc-new', title: 'Chemical spill', severity: 'CRITICAL' },
      })
      .mockResolvedValueOnce({
        incident: { id: 'inc-new', title: 'Chemical spill', status: 'INVESTIGATING' },
      });

    const created = await SafetyService.reportIncident({
      title: 'Chemical spill',
      severity: 'CRITICAL',
      description: 'Minor acid leak',
    });
    expect(created.id).toBe('inc-new');

    const updated = await SafetyService.updateIncidentStatus('inc-new', 'INVESTIGATING');
    expect(updated.status).toBe('INVESTIGATING');

    // Fallback branch when primary fails
    vi.mocked(apiClient)
      .mockRejectedValueOnce(new Error('Primary report failed'))
      .mockResolvedValueOnce({
        incident: { id: 'inc-fb', title: 'Spill FB' },
      })
      .mockRejectedValueOnce(new Error('Primary update failed'))
      .mockResolvedValueOnce({
        incident: { id: 'inc-fb', status: 'RESOLVED' },
      });

    const createdFb = await SafetyService.reportIncident({
      title: 'Spill FB',
      severity: 'LOW',
      description: 'Minor spill fallback',
    });
    expect(createdFb.id).toBe('inc-fb');

    const updatedFb = await SafetyService.updateIncidentStatus('inc-fb', 'RESOLVED');
    expect(updatedFb.status).toBe('RESOLVED');
  });

  it('fetches SOS alerts and resolves active SOS trigger with fallback', async () => {
    vi.mocked(apiClient)
      .mockResolvedValueOnce({
        alerts: [{ id: 'sos-1', employeeName: 'Worker 1', status: 'ACTIVE' }],
      })
      .mockResolvedValueOnce({
        alert: { id: 'sos-1', status: 'RESOLVED' },
      });

    const alerts = await SafetyService.getSOSAlerts();
    expect(alerts.length).toBe(1);

    const resolved = await SafetyService.resolveSOS('sos-1');
    expect(resolved.status).toBe('RESOLVED');

    // SOS fallback
    vi.mocked(apiClient)
      .mockRejectedValueOnce(new Error('Primary get alerts failed'))
      .mockResolvedValueOnce({
        alerts: [{ id: 'sos-fb', employeeName: 'Worker 2' }],
      })
      .mockRejectedValueOnce(new Error('Primary resolve failed'))
      .mockResolvedValueOnce({
        alert: { id: 'sos-fb', status: 'RESOLVED' },
      });

    const fbAlerts = await SafetyService.getSOSAlerts();
    expect(fbAlerts.length).toBe(1);

    const fbResolved = await SafetyService.resolveSOS('sos-fb');
    expect(fbResolved.status).toBe('RESOLVED');

    // SOS error empty fallback
    vi.mocked(apiClient)
      .mockRejectedValueOnce(new Error('404'))
      .mockRejectedValueOnce(new Error('500'));
    const emptySos = await SafetyService.getSOSAlerts();
    expect(emptySos).toEqual([]);
  });

  it('fetches worker locations with fallback', async () => {
    vi.mocked(apiClient).mockResolvedValueOnce({
      locations: [{ employeeId: 'emp-1', latitude: 28.6139, longitude: 77.209 }],
    });

    const locs = await SafetyService.getWorkerLocations();
    expect(locs.length).toBe(1);
    expect(locs[0]!.latitude).toBe(28.6139);

    // Fallback branch
    vi.mocked(apiClient)
      .mockRejectedValueOnce(new Error('Primary locs failed'))
      .mockResolvedValueOnce({
        locations: [{ employeeId: 'emp-fb', latitude: 12.97, longitude: 77.59 }],
      });
    const fbLocs = await SafetyService.getWorkerLocations();
    expect(fbLocs.length).toBe(1);

    vi.mocked(apiClient)
      .mockRejectedValueOnce(new Error('404'))
      .mockRejectedValueOnce(new Error('500'));
    const emptyLocs = await SafetyService.getWorkerLocations();
    expect(emptyLocs).toEqual([]);
  });
});
