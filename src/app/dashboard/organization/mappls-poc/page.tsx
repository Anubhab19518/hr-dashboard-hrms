'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/atoms/card';
import { Badge } from '@/components/atoms/badge';
import { LocationSearchInput } from '@/components/organisms/location-search-input';
import { LocationMapPicker } from '@/components/organisms/location-map-picker';
import { MapplsPocPicker } from '@/features/organization/components/mappls-poc-picker';
import { MapPin, Sparkles, CheckCircle2 } from 'lucide-react';
import type { SelectedLocation } from '@/types/location.types';

export default function MapplsPocEvaluationPage() {
  const [selectedLat, setSelectedLat] = useState<number>(22.5804);
  const [selectedLng, setSelectedLng] = useState<number>(88.4378);
  const [selectedLabel, setSelectedLabel] = useState<string>('Salt Lake Sector V, Kolkata');
  const [geofenceRadius] = useState<number>(300);

  const handlePlaceSelect = (place: SelectedLocation) => {
    setSelectedLat(place.latitude);
    setSelectedLng(place.longitude);
    setSelectedLabel(place.label);
  };

  const handleCartoCoordChange = (lat: number, lng: number) => {
    setSelectedLat(lat);
    setSelectedLng(lng);
  };

  const handleMapplsCoordChange = (lat: number, lng: number) => {
    setSelectedLat(lat);
    setSelectedLng(lng);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
        padding: 'var(--space-6)',
        maxWidth: '1400px',
        margin: '0 auto',
      }}
    >
      {/* Evaluation Banner Header */}
      <div
        style={{
          padding: 'var(--space-5)',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'hsl(var(--bg-surface))',
          border: '1px solid hsl(var(--border-subtle))',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'hsl(var(--primary-color) / 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'hsl(var(--primary-color))',
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h1
                style={{
                  fontSize: 'var(--font-size-xl)',
                  fontWeight: 800,
                  color: 'hsl(var(--text-primary))',
                  margin: 0,
                }}
              >
                Mappls (MapmyIndia) vs CARTO Voyager Evaluation Harness
              </h1>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}>
                Technical spike & Proof of Concept for India-First HRMS location and geofence
                picking
              </span>
            </div>
          </div>

          <Badge variant="info">POC / SPIKE EVALUATION</Badge>
        </div>
      </div>

      {/* Shared Location Search Bar (Amazon Location Service) */}
      <Card>
        <CardHeader style={{ padding: 'var(--space-4) var(--space-5)' }}>
          <CardTitle
            style={{
              fontSize: 'var(--font-size-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <MapPin size={16} style={{ color: 'hsl(var(--primary-color))' }} />
            Step 1: Universal Address Search & Centroid Resolution (AWS Places)
          </CardTitle>
        </CardHeader>
        <CardContent style={{ padding: '0 var(--space-5) var(--space-5) var(--space-5)' }}>
          <LocationSearchInput
            placeholder="Search office address or landmark in India (e.g. Salt Lake Sector V, Birati, Rajarhat)..."
            value={selectedLabel}
            onLocationSelect={handlePlaceSelect}
            showDetectGps={true}
          />

          <div
            style={{
              marginTop: 'var(--space-3)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontSize: '11px',
              color: 'hsl(var(--text-secondary))',
            }}
          >
            <CheckCircle2 size={14} style={{ color: 'hsl(var(--color-success))' }} />
            <span>
              Active Coordinates:{' '}
              <strong style={{ fontFamily: 'monospace' }}>
                {selectedLat.toFixed(6)}, {selectedLng.toFixed(6)}
              </strong>
            </span>
            <span style={{ color: 'hsl(var(--text-muted))' }}>
              • Geofence Radius: {geofenceRadius}m
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Side-by-Side Comparison Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
        {/* Left Column: Current CARTO Voyager (Production) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, margin: 0 }}>
                A. CARTO Voyager (Current Implementation)
              </h3>
              <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
                React-Leaflet • OpenStreetMap + CARTO raster tiles • Zero API key friction
              </span>
            </div>
            <Badge variant="success">PRODUCTION ACTIVE</Badge>
          </div>

          <div
            style={{
              borderRadius: 'var(--radius-lg)',
              border: '1px solid hsl(var(--border-subtle))',
              backgroundColor: 'hsl(var(--bg-surface))',
              padding: 'var(--space-4)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <LocationMapPicker
              latitude={selectedLat}
              longitude={selectedLng}
              radiusMeters={geofenceRadius}
              addressLabel={selectedLabel}
              onChange={handleCartoCoordChange}
              height="300px"
            />
          </div>

          <div style={{ fontSize: '11px', color: 'hsl(var(--text-secondary))', lineHeight: 1.5 }}>
            <strong>Pros:</strong> Zero server token maintenance, 100% Leaflet architecture
            compatibility, generous commercial free tier, high reliability.
            <br />
            <strong>Cons:</strong> No proprietary Mappls Pin/eLoc resolution or house-level
            numbering.
          </div>
        </div>

        {/* Right Column: Mappls Web Maps SDK (POC) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, margin: 0 }}>
                B. Mappls / MapmyIndia (POC Evaluation)
              </h3>
              <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
                Native Web Maps SDK v3.0 • Vector Tiles • Mappls Pin / eLoc ecosystem
              </span>
            </div>
            <Badge variant="warning">POC / EXPERIMENTAL</Badge>
          </div>

          <MapplsPocPicker
            initialLat={selectedLat}
            initialLng={selectedLng}
            initialRadius={geofenceRadius}
            addressLabel={selectedLabel}
            onCoordinateChange={handleMapplsCoordChange}
          />

          <div style={{ fontSize: '11px', color: 'hsl(var(--text-secondary))', lineHeight: 1.5 }}>
            <strong>Pros:</strong> Outstanding granular Indian address data, eLoc pin support, local
            municipal boundaries.
            <br />
            <strong>Cons:</strong> Requires replacing Leaflet MapContainer with Mappls proprietary
            SDK, server-side OAuth token proxying for REST, and commercial SaaS subscription
            (~₹10,000–₹30,000+/month).
          </div>
        </div>
      </div>

      {/* Comparison Findings Matrix */}
      <Card>
        <CardHeader>
          <CardTitle style={{ fontSize: 'var(--font-size-base)' }}>
            Architectural & Commercial Evaluation Matrix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-xs)' }}
            >
              <thead>
                <tr
                  style={{ borderBottom: '1px solid hsl(var(--border-base))', textAlign: 'left' }}
                >
                  <th style={{ padding: 'var(--space-3)', color: 'hsl(var(--text-muted))' }}>
                    Dimension
                  </th>
                  <th style={{ padding: 'var(--space-3)', color: 'hsl(var(--primary-color))' }}>
                    CARTO Voyager (Current)
                  </th>
                  <th
                    style={{ padding: 'var(--space-3)', color: 'hsl(var(--color-brand-accent))' }}
                  >
                    Mappls / MapmyIndia
                  </th>
                  <th style={{ padding: 'var(--space-3)', color: 'hsl(var(--text-muted))' }}>
                    Impact on HRMS
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid hsl(var(--border-subtle))' }}>
                  <td style={{ padding: 'var(--space-3)', fontWeight: 600 }}>Map Engine</td>
                  <td style={{ padding: 'var(--space-3)' }}>
                    Leaflet / React-Leaflet (`react-leaflet@5`)
                  </td>
                  <td style={{ padding: 'var(--space-3)' }}>
                    Mappls Web Maps JS SDK v3.0 (MapLibre fork)
                  </td>
                  <td style={{ padding: 'var(--space-3)' }}>
                    Mappls requires discarding Leaflet components
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid hsl(var(--border-subtle))' }}>
                  <td style={{ padding: 'var(--space-3)', fontWeight: 600 }}>
                    India Address Detail
                  </td>
                  <td style={{ padding: 'var(--space-3)' }}>High (AWS Places + OSM)</td>
                  <td style={{ padding: 'var(--space-3)' }}>
                    Very High (House numbers, gali, eLoc)
                  </td>
                  <td style={{ padding: 'var(--space-3)' }}>
                    Mappls is superior for hyper-local addresses
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid hsl(var(--border-subtle))' }}>
                  <td style={{ padding: 'var(--space-3)', fontWeight: 600 }}>
                    Authentication Model
                  </td>
                  <td style={{ padding: 'var(--space-3)' }}>
                    Zero-auth public raster CDN with attribution
                  </td>
                  <td style={{ padding: 'var(--space-3)' }}>
                    OAuth 2.0 Client Credentials (24h token) + Web Key
                  </td>
                  <td style={{ padding: 'var(--space-3)' }}>
                    Mappls requires server token refresher cron/endpoint
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid hsl(var(--border-subtle))' }}>
                  <td style={{ padding: 'var(--space-3)', fontWeight: 600 }}>
                    Commercial SaaS Cost
                  </td>
                  <td style={{ padding: 'var(--space-3)' }}>
                    Free / Pay-per-use on AWS (~$0.50/1k)
                  </td>
                  <td style={{ padding: 'var(--space-3)' }}>
                    Paid fixed monthly retainer (~₹10k–₹30k+/mo)
                  </td>
                  <td style={{ padding: 'var(--space-3)' }}>
                    Mappls imposes high baseline overhead for early SaaS
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid hsl(var(--border-subtle))' }}>
                  <td style={{ padding: 'var(--space-3)', fontWeight: 600 }}>Geofence Support</td>
                  <td style={{ padding: 'var(--space-3)' }}>
                    Native Leaflet Circles & H3 Hexagons
                  </td>
                  <td style={{ padding: 'var(--space-3)' }}>`mappls.Circle` / `mappls.Polygon`</td>
                  <td style={{ padding: 'var(--space-3)' }}>
                    Both support circular and polygon geofences
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
