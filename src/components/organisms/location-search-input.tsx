'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react';
import {
  Search,
  MapPin,
  X,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  RefreshCw,
} from '@/components/atoms/icons';
import { Button } from '@/components/atoms/button';
import { LocationService } from '@/lib/client/location-service';
import type { LocationSuggestion, SelectedLocation } from '@/types/location.types';

export type { SelectedLocation };

export interface LocationSearchInputProps {
  readonly value?: string;
  readonly onLocationSelect: (location: SelectedLocation) => void;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly id?: string;
  readonly showDetectGps?: boolean;
  readonly label?: string;
  readonly error?: string;
  readonly hint?: string;
}

export function LocationSearchInput({
  value = '',
  onLocationSelect,
  placeholder = 'Search office, building, or landmark (e.g. Sector V Salt Lake / Birati)...',
  disabled = false,
  id = 'location-search-input',
  showDetectGps = true,
  label,
  error,
  hint,
}: LocationSearchInputProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Debounced typeahead search via Amazon Location Service (AWS Places)
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        const results = await LocationService.getSuggestions(query, 6);
        setSuggestions(results);
        setIsOpen(results.length > 0);
        setActiveIndex(-1);
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle selection from dropdown
  const handleSelectSuggestion = useCallback(
    async (item: LocationSuggestion) => {
      setQuery(item.text);
      setIsOpen(false);
      setStatusMessage(null);
      setIsLoading(true);

      try {
        if (item.placeId) {
          const place = await LocationService.getPlaceDetails(item.placeId);
          if (place) {
            const loc: SelectedLocation = {
              label: place.label || item.text,
              latitude: place.latitude,
              longitude: place.longitude,
              postalCode: place.postalCode || undefined,
              street: place.street || undefined,
              city: place.municipality || place.subRegion || undefined,
              state: place.region || undefined,
              country: place.country || undefined,
              placeId: item.placeId,
            };
            onLocationSelect(loc);
            setStatusMessage({
              type: 'success',
              text: `AWS Places verified: ${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}`,
            });
            return;
          }
        }

        // Fallback: direct place search
        const searchResults = await LocationService.searchPlaces(item.text, { maxResults: 1 });
        const place = searchResults[0];
        if (place) {
          const loc: SelectedLocation = {
            label: place.label || item.text,
            latitude: place.latitude,
            longitude: place.longitude,
            postalCode: place.postalCode || undefined,
            city: place.municipality || undefined,
            state: place.region || undefined,
            placeId: place.placeId,
          };
          onLocationSelect(loc);
          setStatusMessage({
            type: 'success',
            text: `AWS Places verified: ${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}`,
          });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Could not resolve place details';
        setStatusMessage({ type: 'error', text: msg });
      } finally {
        setIsLoading(false);
      }
    },
    [onLocationSelect],
  );

  // Keyboard navigation within suggestions list
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        void handleSelectSuggestion(suggestions[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // High-accuracy GPS reverse geocoding via Amazon Location Service
  const handleDetectCurrentGPS = () => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setStatusMessage({ type: 'error', text: 'Geolocation is not supported by your browser.' });
      return;
    }

    setIsDetectingGps(true);
    setStatusMessage(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const results = await LocationService.reverseGeocode(latitude, longitude, 1);
          const verified = results[0];

          if (verified) {
            const loc: SelectedLocation = {
              label: verified.label,
              latitude: verified.latitude,
              longitude: verified.longitude,
              street: verified.street || undefined,
              city: verified.municipality || undefined,
              state: verified.region || undefined,
              postalCode: verified.postalCode || undefined,
              placeId: verified.placeId,
            };
            setQuery(verified.label);
            onLocationSelect(loc);
            setStatusMessage({
              type: 'success',
              text: `Snapped to AWS Places centroid: ${verified.label} (${verified.latitude.toFixed(6)}, ${verified.longitude.toFixed(6)})`,
            });
          } else {
            // Raw GPS fallback
            const rawLat = Number(latitude.toFixed(6));
            const rawLng = Number(longitude.toFixed(6));
            const loc: SelectedLocation = {
              label: `Device Location (${rawLat}, ${rawLng})`,
              latitude: rawLat,
              longitude: rawLng,
            };
            setQuery(loc.label);
            onLocationSelect(loc);
            setStatusMessage({
              type: 'success',
              text: `GPS coordinates acquired: ${rawLat}, ${rawLng}`,
            });
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Failed to reverse-geocode GPS';
          setStatusMessage({ type: 'error', text: msg });
        } finally {
          setIsDetectingGps(false);
        }
      },
      (err) => {
        setIsDetectingGps(false);
        setStatusMessage({
          type: 'error',
          text:
            err.code === 1
              ? 'Location access was denied in browser permissions.'
              : `Device GPS lookup failed (${err.message}).`,
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    setStatusMessage(null);
    inputRef.current?.focus();
  };

  const listboxId = `${id}-listbox`;

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            display: 'block',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 600,
            color: 'hsl(var(--text-primary))',
            marginBottom: 'var(--space-1)',
          }}
        >
          {label}
        </label>
      )}

      {/* Input Group Container */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <div
          style={{
            position: 'absolute',
            left: 'var(--space-3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'hsl(var(--color-brand-accent, var(--primary-color)))',
            pointerEvents: 'none',
          }}
        >
          {isLoading ? (
            <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Search size={15} />
          )}
        </div>

        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          value={query}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isDetectingGps}
          style={{
            width: '100%',
            height: '42px',
            paddingLeft: 'var(--space-8)',
            paddingRight: query ? 'var(--space-8)' : 'var(--space-3)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'hsl(var(--bg-secondary))',
            border: `1px solid ${error ? 'hsl(var(--color-danger))' : 'hsl(var(--border-base))'}`,
            color: 'hsl(var(--text-primary))',
            fontSize: 'var(--font-size-sm)',
            outline: 'none',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          }}
        />

        {query && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear location input"
            style={{
              position: 'absolute',
              right: 'var(--space-3)',
              background: 'none',
              border: 'none',
              color: 'hsl(var(--text-muted))',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: 0,
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown Suggestions List */}
      {isOpen && suggestions.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + var(--space-1))',
            left: 0,
            right: 0,
            zIndex: 100,
            backgroundColor: 'hsl(var(--bg-surface))',
            border: '1px solid hsl(var(--border-subtle))',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            maxHeight: '260px',
            overflowY: 'auto',
            margin: 0,
            padding: 'var(--space-1) 0',
            listStyle: 'none',
          }}
        >
          <li
            style={{
              padding: 'var(--space-1) var(--space-3)',
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'hsl(var(--text-muted))',
              letterSpacing: '0.05em',
              borderBottom: '1px solid hsl(var(--border-subtle))',
            }}
          >
            Amazon Location Service (AWS Places)
          </li>
          {suggestions.map((item, idx) => {
            const isHighlighted = idx === activeIndex;
            return (
              <li
                key={item.placeId || idx}
                role="option"
                aria-selected={isHighlighted}
                onClick={() => handleSelectSuggestion(item)}
                onMouseEnter={() => setActiveIndex(idx)}
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  cursor: 'pointer',
                  backgroundColor: isHighlighted
                    ? 'hsl(var(--primary-color) / 0.12)'
                    : 'transparent',
                  color: isHighlighted ? 'hsl(var(--primary-color))' : 'hsl(var(--text-primary))',
                  fontSize: 'var(--font-size-xs)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  borderBottom:
                    idx < suggestions.length - 1
                      ? '1px solid hsl(var(--border-subtle) / 0.5)'
                      : 'none',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <MapPin size={14} style={{ flexShrink: 0, color: 'hsl(var(--primary-color))' }} />
                <span
                  style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {item.text}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {/* Optional GPS Auto-Snap Trigger */}
      {showDetectGps && (
        <div
          style={{
            marginTop: 'var(--space-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-2)',
          }}
        >
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleDetectCurrentGPS}
            disabled={disabled || isDetectingGps || isLoading}
            style={{ fontSize: 'var(--font-size-xs)' }}
          >
            <Sparkles
              size={13}
              style={{ marginRight: 'var(--space-1)', color: 'hsl(var(--primary-color))' }}
            />
            {isDetectingGps ? 'Snapping to AWS Places...' : '🎯 Detect & Snap Current GPS'}
          </Button>
          <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>
            Sub-meter AWS building & parcel geocoding
          </span>
        </div>
      )}

      {/* Status or Error Notifications */}
      {statusMessage && (
        <div
          style={{
            marginTop: 'var(--space-2)',
            padding: 'var(--space-2) var(--space-3)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--font-size-xs)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            backgroundColor:
              statusMessage.type === 'success'
                ? 'hsl(var(--color-success) / 0.12)'
                : 'hsl(var(--color-danger) / 0.12)',
            color:
              statusMessage.type === 'success'
                ? 'hsl(var(--color-success))'
                : 'hsl(var(--color-danger))',
            border: `1px solid ${
              statusMessage.type === 'success'
                ? 'hsl(var(--color-success) / 0.3)'
                : 'hsl(var(--color-danger) / 0.3)'
            }`,
          }}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 size={14} />
          ) : (
            <AlertCircle size={14} />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {hint && !statusMessage && (
        <p
          style={{
            fontSize: '11px',
            color: 'hsl(var(--text-muted))',
            marginTop: 'var(--space-1)',
            margin: 0,
          }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
