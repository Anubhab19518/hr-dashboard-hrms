import { apiClient } from '@/lib/client/api-client';
import type {
  LocationSuggestion,
  PlaceDetails,
  SearchPlaceResult,
  ReverseGeocodeResult,
  GeoConfigInput,
} from '@/types/location.types';

function unwrapData<T>(res: unknown): T {
  if (typeof res === 'object' && res !== null) {
    const obj = res as Record<string, unknown>;
    if (obj.data !== undefined) return obj.data as T;
  }
  return res as T;
}

export const LocationService = {
  /**
   * Live Typeahead Address Suggestions via Amazon Location Service (AWS Places)
   */
  async getSuggestions(text: string, maxResults: number = 6): Promise<LocationSuggestion[]> {
    if (!text || text.trim().length < 2) return [];
    try {
      const res = await apiClient<unknown>(
        `/hr/location/suggestions?text=${encodeURIComponent(text.trim())}&maxResults=${maxResults}`,
      );
      const data = unwrapData<LocationSuggestion[]>(res);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  /**
   * Get precision coordinates and structured address fields by Place ID
   */
  async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    try {
      const res = await apiClient<unknown>(`/hr/location/places/${encodeURIComponent(placeId)}`);
      return unwrapData<PlaceDetails>(res);
    } catch {
      return null;
    }
  },

  /**
   * Direct forward geocoding search for full address or landmark query
   */
  async searchPlaces(
    text: string,
    options?: { maxResults?: number; biasLat?: number; biasLng?: number },
  ): Promise<SearchPlaceResult[]> {
    if (!text || text.trim().length < 2) return [];
    try {
      const params = new URLSearchParams();
      params.set('text', text.trim());
      if (options?.maxResults) params.set('maxResults', String(options.maxResults));
      if (options?.biasLat !== undefined) params.set('biasLat', String(options.biasLat));
      if (options?.biasLng !== undefined) params.set('biasLng', String(options.biasLng));

      const res = await apiClient<unknown>(`/hr/location/search-places?${params.toString()}`);
      const data = unwrapData<SearchPlaceResult[]>(res);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  /**
   * Reverse Geocoding: Snaps raw GPS coordinates to a verified AWS Places address & building centroid
   */
  async reverseGeocode(
    latitude: number,
    longitude: number,
    maxResults: number = 1,
  ): Promise<ReverseGeocodeResult[]> {
    try {
      const res = await apiClient<unknown>(
        `/hr/location/reverse-geocode?latitude=${latitude}&longitude=${longitude}&maxResults=${maxResults}`,
      );
      const data = unwrapData<ReverseGeocodeResult[]>(res);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  /**
   * Smart Forward Geocoding with Fallback Cascade:
   * Resolves precision coordinates even from noisy Indian address formats (unit/room numbers, internal codes, etc.)
   */
  async resolveAddressCoordinates(input: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
  }): Promise<SearchPlaceResult | null> {
    const { street = '', city = '', state = '', pincode = '' } = input;

    // Clean internal flat/room/unit markers
    const cleanStreet = street
      .replace(
        /\b(office|flat|room|unit|floor|suite|apt|block|ekt|no\.?|plot)[\s\-#:/0-9a-z]+/gi,
        ' ',
      )
      .replace(/[,\s]+/g, ' ')
      .trim();

    // Extract significant building/locality tokens (e.g. "Shrachi Ek Tower Newtown")
    const segments = street
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 2 && !/^(office|flat|room|unit|floor|ekt)/i.test(s));
    const significantStreet = segments.join(', ');

    // Progressive search candidate queries from most specific to broader area
    const candidateQueries: string[] = [
      // 1. Full raw address
      [street, city, state, pincode, 'India'].filter(Boolean).join(', '),
      // 2. Significant parts + city + pincode
      significantStreet
        ? [significantStreet, city, state, pincode, 'India'].filter(Boolean).join(', ')
        : '',
      // 3. Cleaned street + city + pincode
      cleanStreet ? [cleanStreet, city, state, pincode, 'India'].filter(Boolean).join(', ') : '',
      // 4. Significant street + city
      significantStreet && city ? `${significantStreet}, ${city}, India` : '',
      // 5. Cleaned street + pincode
      cleanStreet && pincode ? `${cleanStreet}, ${pincode}, India` : '',
      // 6. Area / City + Pincode
      [city, state, pincode, 'India'].filter(Boolean).join(', '),
      // 7. Pincode + City + India
      pincode ? [pincode, city, 'India'].filter(Boolean).join(', ') : '',
    ].filter((q) => q.trim().length > 3);

    // Deduplicate queries
    const uniqueQueries = Array.from(new Set(candidateQueries));

    // Phase 1: Try direct forward geocoding search across progressive queries
    for (const q of uniqueQueries) {
      const searchResults = await this.searchPlaces(q, { maxResults: 1 });
      if (searchResults.length > 0 && searchResults[0]) {
        return searchResults[0];
      }
    }

    // Phase 2: If direct search misses, try fuzzy typeahead suggestions on significant queries
    for (const q of uniqueQueries.slice(0, 3)) {
      const suggestions = await this.getSuggestions(q, 1);
      if (suggestions.length > 0 && suggestions[0]?.placeId) {
        const details = await this.getPlaceDetails(suggestions[0].placeId);
        if (details) {
          return {
            placeId: suggestions[0].placeId,
            label: details.label || suggestions[0].text,
            latitude: details.latitude,
            longitude: details.longitude,
            municipality: details.municipality,
            region: details.region,
            postalCode: details.postalCode,
            street: details.street,
          };
        }
      }
    }

    return null;
  },

  /**
   * Set High-Precision Geofence Configuration for Company
   */
  async setCompanyGeoConfig(companyId: string, config: GeoConfigInput): Promise<unknown> {
    try {
      return await apiClient(`/hr/companies/${companyId}/geo-config`, {
        method: 'POST',
        body: JSON.stringify(config),
      });
    } catch {
      return null;
    }
  },

  /**
   * Set High-Precision Geofence Configuration for Site
   */
  async setSiteGeoConfig(siteId: string, config: GeoConfigInput): Promise<unknown> {
    try {
      return await apiClient(`/hr/sites/${siteId}/geo-config`, {
        method: 'POST',
        body: JSON.stringify(config),
      });
    } catch {
      return null;
    }
  },
};
