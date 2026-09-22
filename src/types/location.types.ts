export interface LocationSuggestion {
  readonly text: string;
  readonly placeId?: string;
}

export interface PlaceDetails {
  readonly label: string;
  readonly addressNumber?: string | null;
  readonly street?: string | null;
  readonly neighborhood?: string | null;
  readonly municipality?: string | null;
  readonly subRegion?: string | null;
  readonly region?: string | null;
  readonly country?: string | null;
  readonly postalCode?: string | null;
  readonly latitude: number;
  readonly longitude: number;
  readonly timeZone?: string | null;
}

export interface SearchPlaceResult {
  readonly placeId?: string;
  readonly label: string;
  readonly addressNumber?: string | null;
  readonly street?: string | null;
  readonly neighborhood?: string | null;
  readonly municipality?: string | null;
  readonly region?: string | null;
  readonly postalCode?: string | null;
  readonly latitude: number;
  readonly longitude: number;
  readonly timeZone?: string | null;
}

export interface ReverseGeocodeResult {
  readonly placeId?: string;
  readonly label: string;
  readonly addressNumber?: string | null;
  readonly street?: string | null;
  readonly neighborhood?: string | null;
  readonly municipality?: string | null;
  readonly region?: string | null;
  readonly postalCode?: string | null;
  readonly latitude: number;
  readonly longitude: number;
  readonly distanceMeters?: number;
}

export interface SelectedLocation {
  readonly label: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly postalCode?: string;
  readonly street?: string;
  readonly city?: string;
  readonly state?: string;
  readonly country?: string;
  readonly placeId?: string;
}

export interface GeoConfigInput {
  readonly centerLatitude: number;
  readonly centerLongitude: number;
  readonly radiusMeters: number;
  readonly enabled?: boolean;
}
