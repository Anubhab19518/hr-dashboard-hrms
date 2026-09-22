'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/atoms/button';
import { Card, CardContent } from '@/components/atoms/card';
import { ShieldAlert, RefreshCw, Layers } from '@/components/atoms/icons';
import { OrganizationService, type Site } from '@/features/organization';
import {
  SafetyService,
  SafetyMapView,
  IncidentList,
  SOSAlertsBanner,
  type SafetyIncident,
  type SOSAlert,
  type WorkerLocation,
} from '@/features/safety';

export default function SafetyPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [workers, setWorkers] = useState<WorkerLocation[]>([]);
  const [sosAlerts, setSosAlerts] = useState<SOSAlert[]>([]);
  const [incidents, setIncidents] = useState<SafetyIncident[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sitesData, workersData, sosData, incidentsData] = await Promise.all([
        OrganizationService.getSites(),
        SafetyService.getWorkerLocations(),
        SafetyService.getSOSAlerts(),
        SafetyService.getIncidents(),
      ]);

      setSites(Array.isArray(sitesData) ? sitesData : []);
      setWorkers(Array.isArray(workersData) ? workersData : []);
      setSosAlerts(Array.isArray(sosData) ? sosData : []);
      setIncidents(Array.isArray(incidentsData) ? incidentsData : []);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleResolveSOS = async (id: string) => {
    try {
      await SafetyService.resolveSOS(id);
      void fetchData();
    } catch {
      void fetchData();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* ClickUp-style Page Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          {/* Header Icon Badge */}
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'hsl(var(--color-danger) / 0.12)',
              color: 'hsl(var(--color-danger))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShieldAlert size={20} strokeWidth={1.75} />
          </div>
          <div>
            <h1
              style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 700,
                color: 'hsl(var(--text-primary))',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              Worker Safety & Telemetry
            </h1>
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'hsl(var(--text-muted))',
                margin: '2px 0 0 0',
              }}
            >
              Real-time GPS geofence monitoring, worker status, and SOS alerts
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Button variant="outline" size="sm" onClick={() => void fetchData()} disabled={isLoading}>
            <RefreshCw
              size={14}
              strokeWidth={1.75}
              className={isLoading ? 'animate-spin' : ''}
              style={{ marginRight: 'var(--space-2)' }}
            />
            {isLoading ? 'Syncing...' : 'Live Sync'}
          </Button>
        </div>
      </div>

      {/* SOS Alerts Banner */}
      <SOSAlertsBanner alerts={sosAlerts} onResolve={handleResolveSOS} />

      {/* Real-time Map Card */}
      <Card variant="default" style={{ overflow: 'hidden' }}>
        <CardContent style={{ padding: 'var(--space-4)' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--space-3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Layers
                size={16}
                strokeWidth={1.75}
                style={{ color: 'hsl(var(--color-brand-accent))' }}
              />
              <div>
                <h2
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 600,
                    color: 'hsl(var(--text-primary))',
                    margin: 0,
                  }}
                >
                  Live Geofenced Operations Map
                </h2>
                <p
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'hsl(var(--text-muted))',
                    margin: '2px 0 0 0',
                  }}
                >
                  Site Geofences (Blue) • Active Personnel (Green/Yellow) • SOS Beacons (Red)
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'hsl(var(--text-secondary))',
                  backgroundColor: 'hsl(var(--bg-secondary))',
                  padding: 'var(--space-1) var(--space-3)',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid hsl(var(--border-subtle))',
                }}
              >
                {workers.length} Workers Connected
              </span>
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'hsl(var(--text-secondary))',
                  backgroundColor: 'hsl(var(--bg-secondary))',
                  padding: 'var(--space-1) var(--space-3)',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid hsl(var(--border-subtle))',
                }}
              >
                {sites.length} Active Sites
              </span>
            </div>
          </div>

          <SafetyMapView
            sites={sites}
            workers={workers}
            sosAlerts={sosAlerts}
            incidents={incidents}
          />
        </CardContent>
      </Card>

      {/* Incident Log and Hazard Management */}
      <IncidentList incidents={incidents} onRefresh={() => void fetchData()} />
    </div>
  );
}
