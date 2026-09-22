'use client';

import dynamic from 'next/dynamic';
import type { MapSite, WorkerLocation, SOSAlert, SafetyIncident } from '../types/safety.types';

export interface SafetyMapViewProps {
  sites: readonly MapSite[];
  workers: readonly WorkerLocation[];
  sosAlerts: readonly SOSAlert[];
  incidents: readonly SafetyIncident[];
}

const DynamicSafetyMap = dynamic(() => import('./safety-map-inner'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: '520px',
        width: '100%',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'hsl(var(--bg-secondary))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'hsl(var(--text-muted))',
        fontSize: 'var(--font-size-sm)',
      }}
    >
      Initializing real-time GIS map telemetry...
    </div>
  ),
});

export function SafetyMapView(props: SafetyMapViewProps) {
  return <DynamicSafetyMap {...props} />;
}
