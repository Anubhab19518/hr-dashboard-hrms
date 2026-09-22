'use client';

import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { clientEnv } from '@/lib/env/client';

export interface LocationMapPickerProps {
  readonly latitude?: number;
  readonly longitude?: number;
  readonly radiusMeters?: number;
  readonly addressLabel?: string;
  readonly onChange: (lat: number, lng: number) => void;
  readonly height?: string;
  readonly zoom?: number;
  readonly disabled?: boolean;
}

// Custom SVG Pin DivIcon with high contrast, sharp anchor, and premium SaaS styling
const createPinIcon = () =>
  L.divIcon({
    className: 'custom-draggable-pin',
    html: `<div style="
      position: relative;
      width: 38px;
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: grab;
      filter: drop-shadow(0 4px 10px rgba(15, 23, 42, 0.45));
      transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    ">
      <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Pin Body -->
        <path d="M19 2C11.82 2 6 7.82 6 15C6 24.5 19 36 19 36C19 36 32 24.5 32 15C32 7.82 26.18 2 19 2Z" fill="hsl(var(--primary-color, 221 83% 53%))" stroke="#ffffff" stroke-width="2.5" stroke-linejoin="round"/>
        <!-- Inner Contrast Dot -->
        <circle cx="19" cy="15" r="5" fill="#ffffff"/>
        <circle cx="19" cy="15" r="2.5" fill="hsl(var(--primary-color, 221 83% 53%))"/>
      </svg>
    </div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 36],
  });

// Component to handle map clicks and smooth pan synchronization
function MapController({
  latitude,
  longitude,
  onChange,
  disabled,
}: {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number) => void;
  disabled?: boolean;
}) {
  const map = useMap();
  const prevCoords = useRef<{ lat: number; lng: number }>({ lat: latitude, lng: longitude });

  useEffect(() => {
    if (
      Math.abs(prevCoords.current.lat - latitude) > 0.00001 ||
      Math.abs(prevCoords.current.lng - longitude) > 0.00001
    ) {
      prevCoords.current = { lat: latitude, lng: longitude };
      map.flyTo([latitude, longitude], map.getZoom() || 16, { duration: 1 });
    }
  }, [latitude, longitude, map]);

  useMapEvents({
    click(e) {
      if (disabled) return;
      const newLat = Number(e.latlng.lat.toFixed(6));
      const newLng = Number(e.latlng.lng.toFixed(6));
      onChange(newLat, newLng);
    },
  });

  return null;
}

export default function LocationMapPickerInner({
  latitude = 22.5726,
  longitude = 88.3639,
  radiusMeters = 300,
  addressLabel,
  onChange,
  height = '260px',
  zoom = 16,
  disabled = false,
}: LocationMapPickerProps) {
  const markerIcon = useMemo(() => createPinIcon(), []);
  const cartoApiKey = clientEnv.NEXT_PUBLIC_CARTO_BASEMAP_KEY?.trim();

  // Official authenticated CARTO Voyager Tile URL
  const tileUrl = cartoApiKey
    ? `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${cartoApiKey}`
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';

  const eventHandlers = useMemo(
    () => ({
      dragend(e: L.DragEndEvent) {
        if (disabled) return;
        const marker = e.target as L.Marker;
        const pos = marker.getLatLng();
        const newLat = Number(pos.lat.toFixed(6));
        const newLng = Number(pos.lng.toFixed(6));
        onChange(newLat, newLng);
      },
    }),
    [onChange, disabled],
  );

  return (
    <div
      style={{
        position: 'relative',
        height,
        width: '100%',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: '1px solid hsl(var(--border-subtle))',
        backgroundColor: 'hsl(var(--bg-secondary))',
      }}
    >
      <MapContainer
        center={[latitude, longitude]}
        zoom={zoom}
        maxZoom={20}
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

        <MapController
          latitude={latitude}
          longitude={longitude}
          onChange={onChange}
          disabled={disabled}
        />

        {/* Geofence radius circle */}
        {radiusMeters > 0 && (
          <Circle
            center={[latitude, longitude]}
            radius={radiusMeters}
            pathOptions={{
              color: 'hsl(var(--primary-color, 221 83% 53%))',
              fillColor: 'hsl(var(--primary-color, 221 83% 53%))',
              fillOpacity: 0.12,
              weight: 2,
              dashArray: '5, 5',
            }}
          />
        )}

        {/* Draggable GPS Pin Marker */}
        <Marker
          position={[latitude, longitude]}
          icon={markerIcon}
          draggable={!disabled}
          eventHandlers={eventHandlers}
        />
      </MapContainer>

      {/* Dev Configuration Check: Displays notice if API key is missing during development */}
      {!cartoApiKey && process.env.NODE_ENV === 'development' && (
        <div
          style={{
            position: 'absolute',
            top: 'var(--space-2)',
            left: 'var(--space-2)',
            right: 'var(--space-2)',
            zIndex: 1000,
            backgroundColor: 'hsl(var(--color-warning) / 0.15)',
            backdropFilter: 'blur(4px)',
            border: '1px solid hsl(var(--color-warning))',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--space-1) var(--space-2)',
            fontSize: '11px',
            color: 'hsl(var(--color-warning))',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <span>⚠️ Dev Notice: NEXT_PUBLIC_CARTO_BASEMAP_KEY is missing in .env.local</span>
        </div>
      )}

      {/* Floating Helper Banner */}
      <div
        style={{
          position: 'absolute',
          bottom: 'var(--space-2)',
          left: 'var(--space-2)',
          right: 'var(--space-2)',
          zIndex: 1000,
          backgroundColor: 'hsl(var(--bg-surface) / 0.94)',
          backdropFilter: 'blur(6px)',
          border: '1px solid hsl(var(--border-subtle))',
          borderRadius: 'var(--radius-sm)',
          padding: 'var(--space-1) var(--space-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: 'hsl(var(--text-secondary))',
          pointerEvents: 'none',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
            overflow: 'hidden',
          }}
        >
          <span style={{ color: 'hsl(var(--primary-color))', fontWeight: 700 }}>📍 Pin:</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </span>
          {radiusMeters > 0 && (
            <span
              style={{
                marginLeft: 'var(--space-1)',
                padding: '0 var(--space-1)',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'hsl(var(--primary-color) / 0.1)',
                color: 'hsl(var(--primary-color))',
                fontSize: '10px',
                fontWeight: 600,
              }}
            >
              {radiusMeters}m geofence
            </span>
          )}
          {addressLabel && (
            <span
              style={{
                marginLeft: 'var(--space-1)',
                color: 'hsl(var(--text-muted))',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                maxWidth: '180px',
              }}
            >
              • {addressLabel}
            </span>
          )}
        </div>
        <span
          style={{
            fontSize: '10px',
            color: 'hsl(var(--color-brand-accent, var(--primary-color)))',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          Click map or drag pin to adjust
        </span>
      </div>
    </div>
  );
}
