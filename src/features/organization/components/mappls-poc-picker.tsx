'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Badge } from '@/components/atoms/badge';
import { Sparkles, MapPin, AlertCircle, RefreshCw, Key, ShieldCheck } from 'lucide-react';
import { clientEnv } from '@/lib/env/client';

export interface MapplsPocPickerProps {
  readonly initialLat?: number;
  readonly initialLng?: number;
  readonly initialRadius?: number;
  readonly addressLabel?: string;
  readonly onCoordinateChange?: (lat: number, lng: number) => void;
}

// Global declaration for Mappls window SDK
declare global {
  interface Window {
    mappls?: {
      Map: new (
        container: HTMLElement | string,
        options: {
          center: [number, number];
          zoom: number;
          zoomControl?: boolean;
          hybrid?: boolean;
          search?: boolean;
        },
      ) => MapplsMapInstance;
      Marker: new (options: {
        map: MapplsMapInstance;
        position: { lat: number; lng: number };
        draggable?: boolean;
        title?: string;
      }) => MapplsMarkerInstance;
      Circle: new (options: {
        map: MapplsMapInstance;
        center: { lat: number; lng: number };
        radius: number;
        fillColor?: string;
        fillOpacity?: number;
        strokeColor?: string;
        strokeWeight?: number;
        strokeOpacity?: number;
      }) => MapplsCircleInstance;
    };
  }
}

interface MapplsMapInstance {
  setCenter: (coords: [number, number]) => void;
  setZoom: (zoom: number) => void;
  addListener: (
    event: string,
    callback: (e: { lngLat?: { lat: number; lng: number } }) => void,
  ) => void;
  remove: () => void;
}

interface MapplsMarkerInstance {
  setPosition: (coords: { lat: number; lng: number }) => void;
  addListener: (
    event: string,
    callback: (e: { target?: { getPosition?: () => { lat: number; lng: number } } }) => void,
  ) => void;
  remove: () => void;
}

interface MapplsCircleInstance {
  setCenter: (coords: { lat: number; lng: number }) => void;
  setRadius: (radius: number) => void;
  remove: () => void;
}

export function MapplsPocPicker({
  initialLat = 22.5726,
  initialLng = 88.3639,
  initialRadius = 300,
  addressLabel = 'Kolkata Tech Hub',
  onCoordinateChange,
}: MapplsPocPickerProps) {
  const [apiKey, setApiKey] = useState<string>(clientEnv.NEXT_PUBLIC_MAPPLS_MAP_KEY ?? '');
  const [lat, setLat] = useState<number>(initialLat);
  const [lng, setLng] = useState<number>(initialLng);
  const [radius] = useState<number>(initialRadius);
  const [sdkStatus, setSdkStatus] = useState<'uninitialized' | 'loading' | 'ready' | 'error'>(
    'uninitialized',
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<MapplsMapInstance | null>(null);
  const markerRef = useRef<MapplsMarkerInstance | null>(null);
  const circleRef = useRef<MapplsCircleInstance | null>(null);

  const updateCoordinates = useCallback(
    (newLat: number, newLng: number) => {
      const precisionLat = Number(newLat.toFixed(6));
      const precisionLng = Number(newLng.toFixed(6));
      setLat(precisionLat);
      setLng(precisionLng);
      onCoordinateChange?.(precisionLat, precisionLng);
    },
    [onCoordinateChange],
  );

  // Initialize Mappls Web Maps JS SDK v3.0 dynamically
  useEffect(() => {
    if (!apiKey.trim()) {
      setSdkStatus('uninitialized');
      return;
    }

    let isMounted = true;
    setSdkStatus('loading');
    setErrorMessage(null);

    const scriptId = 'mappls-sdk-v3-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    const initMap = () => {
      if (!isMounted || !mapContainerRef.current || !window.mappls?.Map) return;

      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        const map = new window.mappls.Map(mapContainerRef.current, {
          center: [lat, lng],
          zoom: 16,
          zoomControl: true,
          search: false,
        });

        mapInstanceRef.current = map;

        // Add Draggable Pin Marker
        const marker = new window.mappls.Marker({
          map,
          position: { lat, lng },
          draggable: true,
          title: 'Office Geofence Pin',
        });
        markerRef.current = marker;

        marker.addListener('dragend', (e) => {
          const pos = e.target?.getPosition?.();
          if (pos) {
            updateCoordinates(pos.lat, pos.lng);
          }
        });

        // Add Click to Place Listener
        map.addListener('click', (e) => {
          if (e.lngLat) {
            updateCoordinates(e.lngLat.lat, e.lngLat.lng);
            marker.setPosition({ lat: e.lngLat.lat, lng: e.lngLat.lng });
          }
        });

        // Add Geofence Circle Overlay
        if (radius > 0 && window.mappls.Circle) {
          const circle = new window.mappls.Circle({
            map,
            center: { lat, lng },
            radius,
            fillColor: '#4f46e5',
            fillOpacity: 0.15,
            strokeColor: '#4f46e5',
            strokeWeight: 2,
            strokeOpacity: 0.8,
          });
          circleRef.current = circle;
        }

        setSdkStatus('ready');
      } catch (err) {
        if (isMounted) {
          setSdkStatus('error');
          setErrorMessage(
            err instanceof Error ? err.message : 'Failed to initialize Mappls Map instance',
          );
        }
      }
    };

    if (window.mappls?.Map) {
      initMap();
    } else {
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://apis.mappls.com/advancedmaps/api/${apiKey.trim()}/map_sdk?v=3.0&layer=vector`;
        script.async = true;
        script.onload = () => {
          if (isMounted) initMap();
        };
        script.onerror = () => {
          if (isMounted) {
            setSdkStatus('error');
            setErrorMessage(
              'Failed to load Mappls Vector Maps JS SDK script. Check API key and domain whitelist.',
            );
          }
        };
        document.head.appendChild(script);
      } else {
        script.onload = () => {
          if (isMounted) initMap();
        };
      }
    }

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [apiKey, updateCoordinates, lat, lng, radius]);

  // Sync marker position when coords change programmatically
  const handleSimulatedPan = (newLat: number, newLng: number) => {
    updateCoordinates(newLat, newLng);
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setCenter([newLat, newLng]);
      markerRef.current.setPosition({ lat: newLat, lng: newLng });
      if (circleRef.current) {
        circleRef.current.setCenter({ lat: newLat, lng: newLng });
      }
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid hsl(var(--border-subtle))',
        backgroundColor: 'hsl(var(--bg-surface))',
        padding: 'var(--space-4)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Header & Status */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'hsl(var(--color-brand-accent) / 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'hsl(var(--color-brand-accent))',
            }}
          >
            <MapPin size={16} />
          </div>
          <div>
            <h4
              style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 700,
                color: 'hsl(var(--text-primary))',
                margin: 0,
              }}
            >
              Mappls (MapmyIndia) Vector Maps SDK POC
            </h4>
            <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
              Isolated evaluation harness for India-first spatial rendering
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Badge
            variant={
              sdkStatus === 'ready'
                ? 'success'
                : sdkStatus === 'loading'
                  ? 'info'
                  : sdkStatus === 'error'
                    ? 'danger'
                    : 'secondary'
            }
          >
            {sdkStatus === 'ready'
              ? 'SDK ACTIVE'
              : sdkStatus === 'loading'
                ? 'LOADING SDK...'
                : sdkStatus === 'error'
                  ? 'AUTH ERROR'
                  : 'KEY REQUIRED'}
          </Badge>
        </div>
      </div>

      {/* API Key Input / Harness Bar */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-2)',
          alignItems: 'center',
          backgroundColor: 'hsl(var(--bg-secondary))',
          padding: 'var(--space-2) var(--space-3)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid hsl(var(--border-subtle))',
        }}
      >
        <Key size={14} style={{ color: 'hsl(var(--text-muted))', flexShrink: 0 }} />
        <Input
          placeholder="Enter Mappls Web Map API Key to load live vector canvas..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          style={{ height: '32px', fontSize: 'var(--font-size-xs)' }}
        />
        {apiKey && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setApiKey('')}
            style={{ fontSize: '11px', height: '32px' }}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Quick Test Preset Buttons */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'hsl(var(--text-muted))',
            alignSelf: 'center',
          }}
        >
          Test Locations:
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => handleSimulatedPan(22.5804, 88.4378)}
          style={{ fontSize: '11px', height: '28px' }}
        >
          Salt Lake Sector V (22.5804, 88.4378)
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => handleSimulatedPan(22.5726, 88.3639)}
          style={{ fontSize: '11px', height: '28px' }}
        >
          Kolkata Central (22.5726, 88.3639)
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => handleSimulatedPan(22.6738, 88.4309)}
          style={{ fontSize: '11px', height: '28px' }}
        >
          Birati / M.B. Road (22.6738, 88.4309)
        </Button>
      </div>

      {/* Map Display Canvas or Fallback Harness */}
      <div
        style={{
          position: 'relative',
          height: '280px',
          width: '100%',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          border: '1px solid hsl(var(--border-subtle))',
          backgroundColor: 'hsl(var(--bg-secondary))',
        }}
      >
        {/* Real Mappls Canvas Target */}
        <div
          ref={mapContainerRef}
          style={{
            height: '100%',
            width: '100%',
            display: sdkStatus === 'ready' ? 'block' : 'none',
          }}
        />

        {/* Fallback & Architectural Evaluation View when no key is set */}
        {sdkStatus !== 'ready' && (
          <div
            style={{
              height: '100%',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--space-4)',
              textAlign: 'center',
              background:
                'radial-gradient(circle at center, hsl(var(--bg-surface)), hsl(var(--bg-secondary)))',
            }}
          >
            {sdkStatus === 'loading' ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                }}
              >
                <RefreshCw
                  size={24}
                  className="animate-spin"
                  style={{ color: 'hsl(var(--color-brand-accent))' }}
                />
                <span
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    color: 'hsl(var(--text-secondary))',
                  }}
                >
                  Initializing Mappls Vector Maps JS SDK v3.0...
                </span>
              </div>
            ) : sdkStatus === 'error' ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  maxWidth: '400px',
                }}
              >
                <AlertCircle size={28} style={{ color: 'hsl(var(--color-danger))' }} />
                <span
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 700,
                    color: 'hsl(var(--color-danger))',
                  }}
                >
                  Mappls SDK Authentication Failed
                </span>
                <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
                  {errorMessage ||
                    'The key provided is unauthorized or domain whitelist rejected http://localhost.'}
                </span>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  maxWidth: '480px',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'hsl(var(--primary-color) / 0.1)',
                    color: 'hsl(var(--primary-color))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Sparkles size={20} />
                </div>
                <span
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 700,
                    color: 'hsl(var(--text-primary))',
                  }}
                >
                  Mappls Interactive Evaluation Canvas
                </span>
                <p
                  style={{
                    fontSize: '11px',
                    color: 'hsl(var(--text-secondary))',
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  Mappls requires a registered Web Map Key from the Mappls Console with your
                  application origin whitelisted. Enter your key above to render live vector tiles,
                  or test coordinate synchronization using the controls below.
                </p>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-1)',
                    marginTop: 'var(--space-1)',
                  }}
                >
                  <ShieldCheck size={13} style={{ color: 'hsl(var(--color-success))' }} />
                  <span
                    style={{
                      fontSize: '10px',
                      color: 'hsl(var(--color-success))',
                      fontWeight: 600,
                    }}
                  >
                    Commercial SaaS Tier Requires Paid Monthly Subscription (~₹10k–₹30k+/mo)
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Floating Status & Coordinate Pill */}
        <div
          style={{
            position: 'absolute',
            bottom: 'var(--space-2)',
            left: 'var(--space-2)',
            right: 'var(--space-2)',
            zIndex: 10,
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
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
            <span style={{ color: 'hsl(var(--primary-color))', fontWeight: 700 }}>
              📍 Selected:
            </span>
            <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
              {lat.toFixed(6)}, {lng.toFixed(6)}
            </span>
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
              {radius}m geofence
            </span>
            <span style={{ marginLeft: 'var(--space-1)', color: 'hsl(var(--text-muted))' }}>
              • {addressLabel}
            </span>
          </div>

          <span
            style={{ fontSize: '10px', color: 'hsl(var(--color-brand-accent))', fontWeight: 600 }}
          >
            {sdkStatus === 'ready' ? 'Drag Pin / Click Map' : 'POC Active'}
          </span>
        </div>
      </div>
    </div>
  );
}
