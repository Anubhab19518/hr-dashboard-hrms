'use client';

import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { clientEnv } from '@/lib/env/client';
import type { MapSite, WorkerLocation, SOSAlert, SafetyIncident } from '../types/safety.types';

interface SafetyMapInnerProps {
  sites: readonly MapSite[];
  workers: readonly WorkerLocation[];
  sosAlerts: readonly SOSAlert[];
  incidents: readonly SafetyIncident[];
}

// Custom DivIcons with Design System CSS tokens & clean SVG markers
const createSiteIcon = (name: string) =>
  L.divIcon({
    className: 'custom-map-icon',
    html: `<div style="
      background-color: hsl(var(--color-info, 199 89% 48%));
      color: hsl(var(--text-inverse, 0 0% 100%));
      padding: var(--space-1, 4px) var(--space-2, 8px);
      border-radius: var(--radius-md, 6px);
      font-size: var(--font-size-xs, 12px);
      font-weight: 700;
      border: 2px solid #ffffff;
      box-shadow: var(--shadow-md);
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 4px;
    ">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
      <span>${name}</span>
    </div>`,
    iconSize: [80, 30],
    iconAnchor: [40, 15],
  });

const createWorkerIcon = (worker: WorkerLocation) =>
  L.divIcon({
    className: 'custom-map-icon',
    html: `<div style="
      background-color: ${
        worker.isSafe
          ? 'hsl(var(--color-success, 142 71% 45%))'
          : 'hsl(var(--color-warning, 38 92% 50%))'
      };
      color: hsl(var(--text-inverse, 0 0% 100%));
      width: 28px;
      height: 28px;
      border-radius: var(--radius-full, 9999px);
      border: 2px solid #ffffff;
      box-shadow: var(--shadow-sm);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

const createSOSIcon = () =>
  L.divIcon({
    className: 'custom-map-icon',
    html: `<div style="
      background-color: hsl(var(--color-danger, 0 84% 60%));
      color: hsl(var(--text-inverse, 0 0% 100%));
      width: 36px;
      height: 36px;
      border-radius: var(--radius-full, 9999px);
      border: 3px solid #ffffff;
      box-shadow: 0 0 15px hsl(var(--color-danger, 0 84% 60%));
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulse 1.5s infinite;
    ">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

const createIncidentIcon = () =>
  L.divIcon({
    className: 'custom-map-icon',
    html: `<div style="
      background-color: hsl(var(--color-warning, 38 92% 50%));
      color: hsl(var(--text-inverse, 0 0% 100%));
      width: 30px;
      height: 30px;
      border-radius: var(--radius-full, 9999px);
      border: 2px solid #ffffff;
      box-shadow: var(--shadow-sm);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

export default function SafetyMapInner({
  sites,
  workers,
  sosAlerts,
  incidents,
}: SafetyMapInnerProps) {
  // Determine center from first site or first worker or fallback
  const firstSite = sites.find((s) => s.latitude !== undefined && s.longitude !== undefined);
  const centerLat = firstSite?.latitude ?? 37.7749;
  const centerLng = firstSite?.longitude ?? -122.4194;

  const cartoApiKey = clientEnv.NEXT_PUBLIC_CARTO_BASEMAP_KEY?.trim();
  const tileUrl = cartoApiKey
    ? `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${cartoApiKey}`
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';

  return (
    <div
      style={{
        height: '520px',
        width: '100%',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        {/* CARTO Voyager: Clean, modern cartography with official authenticated key */}
        <TileLayer
          key={tileUrl}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>'
          url={tileUrl}
          subdomains={['a', 'b', 'c', 'd']}
          maxZoom={20}
        />

        {/* Render Site Geofence Circles and Markers */}
        {sites
          .filter((s) => s.latitude !== undefined && s.longitude !== undefined)
          .map((site) => (
            <div key={site.id}>
              <Circle
                center={[site.latitude!, site.longitude!]}
                radius={site.geofenceRadiusMeters ?? 150}
                pathOptions={{
                  color: 'hsl(var(--color-info, 199 89% 48%))',
                  fillColor: 'hsl(var(--color-info, 199 89% 48%))',
                  fillOpacity: 0.15,
                  weight: 2,
                  dashArray: '4, 6',
                }}
              />
              <Marker position={[site.latitude!, site.longitude!]} icon={createSiteIcon(site.name)}>
                <Popup>
                  <div style={{ fontSize: 'var(--font-size-xs, 12px)' }}>
                    <strong>{site.name}</strong> ({site.code})<br />
                    Radius: {site.geofenceRadiusMeters ?? 150}m<br />
                    {site.address}
                  </div>
                </Popup>
              </Marker>
            </div>
          ))}

        {/* Render Live Worker Markers */}
        {workers.map((worker) => (
          <Marker
            key={worker.employeeId}
            position={[worker.latitude, worker.longitude]}
            icon={createWorkerIcon(worker)}
          >
            <Popup>
              <div style={{ fontSize: 'var(--font-size-xs, 12px)' }}>
                <strong>{worker.employeeName}</strong> ({worker.employeeCode || worker.employeeId})
                <br />
                Site: {worker.siteName || 'Field'}
                <br />
                Battery: {worker.batteryLevel ? `${worker.batteryLevel}%` : 'N/A'}
                <br />
                Status: {worker.isSafe ? 'Normal / Safe' : 'Warning'}
                <br />
                Heartbeat: {new Date(worker.lastHeartbeat).toLocaleTimeString()}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Render Active SOS Panic Markers */}
        {sosAlerts
          .filter((a) => a.status === 'ACTIVE' || a.status === 'ACKNOWLEDGED')
          .map((sos) => (
            <Marker key={sos.id} position={[sos.latitude, sos.longitude]} icon={createSOSIcon()}>
              <Popup>
                <div
                  style={{
                    fontSize: 'var(--font-size-xs, 12px)',
                    color: 'hsl(var(--color-danger))',
                  }}
                >
                  <strong>[SOS] PANIC TRIGGERED</strong>
                  <br />
                  Worker: {sos.employeeName || sos.employeeId}
                  <br />
                  Time: {new Date(sos.triggeredAt).toLocaleTimeString()}
                  <br />
                  Coords: {sos.latitude.toFixed(5)}, {sos.longitude.toFixed(5)}
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Render Safety Incidents */}
        {incidents
          .filter((i) => i.latitude !== undefined && i.longitude !== undefined)
          .map((incident) => (
            <Marker
              key={incident.id}
              position={[incident.latitude!, incident.longitude!]}
              icon={createIncidentIcon()}
            >
              <Popup>
                <div style={{ fontSize: 'var(--font-size-xs, 12px)' }}>
                  <strong>{incident.title}</strong>
                  <br />
                  Severity: {incident.severity}
                  <br />
                  Status: {incident.status}
                  <br />
                  {incident.description}
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
