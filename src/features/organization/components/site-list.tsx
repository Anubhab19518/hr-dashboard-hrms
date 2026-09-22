'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Card, CardContent } from '@/components/atoms/card';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import { Input } from '@/components/atoms/input';
import { MapPin } from '@/components/atoms/icons';
import { Modal } from '@/components/molecules/modal';
import { EmptyState } from '@/components/molecules/empty-state';
import {
  LocationSearchInput,
  type SelectedLocation,
} from '@/components/organisms/location-search-input';
import { LocationMapPicker } from '@/components/organisms/location-map-picker';
import { OrganizationService } from '../services/organization.service';
import { LocationService } from '../services/location.service';
import type { Site, Company } from '../types/organization.types';
import type { CreateSiteInput } from '../schemas/organization.schema';

export function SiteList() {
  const [sites, setSites] = useState<Site[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateSiteInput>({
    name: '',
    code: '',
    companyId: '',
    address: '',
    latitude: undefined,
    longitude: undefined,
    geofenceRadiusMeters: 100,
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sitesData, companiesData] = await Promise.all([
        OrganizationService.getSites(),
        OrganizationService.getCompanies(),
      ]);
      setSites(Array.isArray(sitesData) ? sitesData : []);
      setCompanies(Array.isArray(companiesData) ? companiesData : []);
      if (companiesData && companiesData.length > 0 && companiesData[0]) {
        setFormData((prev) => ({ ...prev, companyId: companiesData[0]!.id }));
      }
    } catch {
      setSites([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleLocationPicked = (loc: SelectedLocation) => {
    setFormData((prev) => ({
      ...prev,
      address: loc.label || loc.street || prev.address,
      latitude: loc.latitude,
      longitude: loc.longitude,
    }));
  };

  const handleMapPinChange = async (lat: number, lng: number) => {
    setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
    try {
      const results = await LocationService.reverseGeocode(lat, lng, 1);
      if (results[0]) {
        setFormData((prev) => ({
          ...prev,
          address: results[0]?.label || prev.address,
        }));
      }
    } catch {
      // Keep coordinates
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const created = await OrganizationService.createSite(formData);
      if (formData.latitude !== undefined && formData.longitude !== undefined) {
        await LocationService.setSiteGeoConfig(created.id, {
          centerLatitude: formData.latitude,
          centerLongitude: formData.longitude,
          radiusMeters: formData.geofenceRadiusMeters ?? 100,
          enabled: true,
        });
      }
      setSites((prev) => [...prev, created]);
      setIsModalOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create site';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-4)',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 700,
              color: 'hsl(var(--text-primary))',
            }}
          >
            Work Sites & Facilities
          </h2>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}>
            GPS-geofenced operating facilities, offices, factories, and kiosks
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          + Add Site
        </Button>
      </div>

      {isLoading ? (
        <div
          style={{
            padding: 'var(--space-8)',
            textAlign: 'center',
            color: 'hsl(var(--text-muted))',
          }}
        >
          Loading sites...
        </div>
      ) : sites.length === 0 ? (
        <Card variant="subtle">
          <CardContent style={{ padding: 'var(--space-8)' }}>
            <EmptyState
              title="No facilities or sites configured"
              description="Define your physical branch or factory locations with geofence bounds."
              actionLabel="Add Site"
              onAction={() => setIsModalOpen(true)}
            />
          </CardContent>
        </Card>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {sites.map((site) => (
            <Card key={site.id} variant="subtle">
              <CardContent style={{ padding: 'var(--space-5)' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontSize: 'var(--font-size-base)',
                        fontWeight: 700,
                        color: 'hsl(var(--text-primary))',
                      }}
                    >
                      {site.name}
                    </h3>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: 'var(--font-size-xs)',
                        color: 'hsl(var(--text-muted))',
                      }}
                    >
                      CODE: {site.code}
                    </span>
                  </div>
                  <Badge variant={site.status === 'ACTIVE' ? 'success' : 'secondary'}>
                    {site.status}
                  </Badge>
                </div>

                <div
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'hsl(var(--text-secondary))',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-2)',
                    marginTop: 'var(--space-3)',
                  }}
                >
                  {site.address && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                      <MapPin
                        size={13}
                        style={{ color: 'hsl(var(--color-brand-accent))', flexShrink: 0 }}
                      />
                      <span>{site.address}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        backgroundColor: 'hsl(var(--bg-secondary))',
                        padding: 'var(--space-1) var(--space-2)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      Radius: {site.geofenceRadiusMeters ?? 100}m
                    </span>
                    {site.latitude !== undefined && site.longitude !== undefined && (
                      <span
                        style={{
                          backgroundColor: 'hsl(var(--bg-secondary))',
                          padding: 'var(--space-1) var(--space-2)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        GPS: {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Work Site"
        description="Set up a physical location with AWS Places precision geofencing"
      >
        <form
          onSubmit={handleCreate}
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
        >
          {error && (
            <div
              style={{
                padding: 'var(--space-2)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'hsl(var(--color-danger) / 0.1)',
                color: 'hsl(var(--color-danger))',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              {error}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  marginBottom: 'var(--space-1)',
                }}
              >
                Site Name *
              </label>
              <Input
                placeholder="Main Plant / Head Office"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  marginBottom: 'var(--space-1)',
                }}
              >
                Site Code *
              </label>
              <Input
                placeholder="SITE-01"
                value={formData.code}
                onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value }))}
                required
              />
            </div>
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                marginBottom: 'var(--space-1)',
              }}
            >
              Company Entity *
            </label>
            <select
              value={formData.companyId}
              onChange={(e) => setFormData((p) => ({ ...p, companyId: e.target.value }))}
              style={{
                width: '100%',
                height: '40px',
                padding: '0 var(--space-3)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid hsl(var(--border-base))',
                backgroundColor: 'hsl(var(--bg-secondary))',
                color: 'hsl(var(--text-primary))',
                fontSize: 'var(--font-size-sm)',
              }}
              required
            >
              {companies.length === 0 && <option value="default">Default Company</option>}
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Amazon Location Service Search */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                marginBottom: 'var(--space-1)',
              }}
            >
              Site Address & AWS Places Centroid
            </label>
            <LocationSearchInput
              placeholder="Search site address or landmark (e.g. Plot 45 Industrial Area)..."
              value={formData.address ?? ''}
              onLocationSelect={handleLocationPicked}
              showDetectGps={true}
            />
          </div>

          {/* Interactive Map & Draggable Pin */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                marginBottom: 'var(--space-1)',
              }}
            >
              Interactive Geofence Map Pin
            </label>
            <LocationMapPicker
              latitude={formData.latitude ?? 22.5726}
              longitude={formData.longitude ?? 88.3639}
              radiusMeters={formData.geofenceRadiusMeters ?? 100}
              addressLabel={formData.address || formData.name || 'Site Location'}
              onChange={handleMapPinChange}
              height="220px"
            />
          </div>

          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  marginBottom: 'var(--space-1)',
                }}
              >
                Latitude
              </label>
              <Input
                type="number"
                step="any"
                placeholder="22.5726"
                value={formData.latitude ?? ''}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, latitude: parseFloat(e.target.value) || undefined }))
                }
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  marginBottom: 'var(--space-1)',
                }}
              >
                Longitude
              </label>
              <Input
                type="number"
                step="any"
                placeholder="88.3639"
                value={formData.longitude ?? ''}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, longitude: parseFloat(e.target.value) || undefined }))
                }
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  marginBottom: 'var(--space-1)',
                }}
              >
                Geofence Radius (m)
              </label>
              <Input
                type="number"
                placeholder="100"
                value={formData.geofenceRadiusMeters ?? 100}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    geofenceRadiusMeters: parseInt(e.target.value, 10) || 100,
                  }))
                }
              />
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 'var(--space-2)',
              marginTop: 'var(--space-3)',
            }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Create Site'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
