import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocationService } from '../services/location.service';
import { apiClient } from '@/lib/client/api-client';

vi.mock('@/lib/client/api-client', () => ({
  apiClient: vi.fn(),
}));

describe('LocationService (Amazon Location Service / AWS Places)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSuggestions', () => {
    it('returns empty array if query text is short', async () => {
      const results = await LocationService.getSuggestions('a');
      expect(results).toEqual([]);
      expect(apiClient).not.toHaveBeenCalled();
    });

    it('fetches typeahead suggestions from backend API', async () => {
      const mockSuggestions = [
        { text: 'Birati, Kolkata, India', placeId: 'place_123' },
        { text: 'Birati Railway Station', placeId: 'place_456' },
      ];
      vi.mocked(apiClient).mockResolvedValueOnce({
        status: 'success',
        data: mockSuggestions,
      });

      const results = await LocationService.getSuggestions('Birati');
      expect(apiClient).toHaveBeenCalledWith('/hr/location/suggestions?text=Birati&maxResults=6');
      expect(results).toEqual(mockSuggestions);
    });

    it('handles api error gracefully returning empty array', async () => {
      vi.mocked(apiClient).mockRejectedValueOnce(new Error('Network error'));
      const results = await LocationService.getSuggestions('Birati');
      expect(results).toEqual([]);
    });
  });

  describe('getPlaceDetails', () => {
    it('fetches coordinates and details by place ID', async () => {
      const mockDetails = {
        label: 'Birati Station Road, Kolkata',
        latitude: 22.6734,
        longitude: 88.4412,
        municipality: 'Kolkata',
        region: 'West Bengal',
        postalCode: '700051',
      };
      vi.mocked(apiClient).mockResolvedValueOnce({
        status: 'success',
        data: mockDetails,
      });

      const details = await LocationService.getPlaceDetails('place_123');
      expect(apiClient).toHaveBeenCalledWith('/hr/location/places/place_123');
      expect(details).toEqual(mockDetails);
    });

    it('returns null on place details error', async () => {
      vi.mocked(apiClient).mockRejectedValueOnce(new Error('Place not found'));
      const details = await LocationService.getPlaceDetails('invalid_id');
      expect(details).toBeNull();
    });
  });

  describe('searchPlaces', () => {
    it('searches places with query text and options including bias coordinates', async () => {
      const mockResults = [
        {
          placeId: 'place_789',
          label: 'Sector V Salt Lake, Kolkata',
          latitude: 22.57385,
          longitude: 88.43592,
        },
      ];
      vi.mocked(apiClient).mockResolvedValueOnce({
        status: 'success',
        data: mockResults,
      });

      const results = await LocationService.searchPlaces('Sector V', {
        maxResults: 5,
        biasLat: 22.5,
        biasLng: 88.4,
      });
      expect(apiClient).toHaveBeenCalledWith(
        '/hr/location/search-places?text=Sector+V&maxResults=5&biasLat=22.5&biasLng=88.4',
      );
      expect(results).toEqual(mockResults);
    });

    it('returns empty array when search text is short or api fails', async () => {
      const emptyShort = await LocationService.searchPlaces('x');
      expect(emptyShort).toEqual([]);

      vi.mocked(apiClient).mockRejectedValueOnce(new Error('Search failed'));
      const errorRes = await LocationService.searchPlaces('Sector V');
      expect(errorRes).toEqual([]);
    });
  });

  describe('reverseGeocode', () => {
    it('snaps GPS coordinates to verified AWS Places address', async () => {
      const mockReverse = [
        {
          placeId: 'place_999',
          label: '7, Sector V-Ep Block, Bidhannagar, Kolkata 700091',
          latitude: 22.57357,
          longitude: 88.43606,
          distanceMeters: 34.33,
        },
      ];
      vi.mocked(apiClient).mockResolvedValueOnce({
        status: 'success',
        data: mockReverse,
      });

      const results = await LocationService.reverseGeocode(22.57385, 88.43592, 1);
      expect(apiClient).toHaveBeenCalledWith(
        '/hr/location/reverse-geocode?latitude=22.57385&longitude=88.43592&maxResults=1',
      );
      expect(results).toEqual(mockReverse);
    });

    it('handles reverse geocode api failure gracefully', async () => {
      vi.mocked(apiClient).mockRejectedValueOnce(new Error('500 Error'));
      const results = await LocationService.reverseGeocode(22.57385, 88.43592);
      expect(results).toEqual([]);
    });
  });

  describe('setCompanyGeoConfig and setSiteGeoConfig', () => {
    it('posts geo-config to company endpoint and handles failure', async () => {
      vi.mocked(apiClient)
        .mockResolvedValueOnce({ status: 'success' })
        .mockRejectedValueOnce(new Error('Company not found'));

      const res = await LocationService.setCompanyGeoConfig('comp_1', {
        centerLatitude: 22.57385,
        centerLongitude: 88.43592,
        radiusMeters: 300,
        enabled: true,
      });
      expect(res).toBeDefined();

      const failed = await LocationService.setCompanyGeoConfig('comp_err', {
        centerLatitude: 22.57385,
        centerLongitude: 88.43592,
        radiusMeters: 300,
        enabled: true,
      });
      expect(failed).toBeNull();
    });

    it('posts geo-config to site endpoint and handles failure', async () => {
      vi.mocked(apiClient)
        .mockResolvedValueOnce({ status: 'success' })
        .mockRejectedValueOnce(new Error('Site not found'));

      await LocationService.setSiteGeoConfig('site_1', {
        centerLatitude: 22.6734,
        centerLongitude: 88.4412,
        radiusMeters: 150,
        enabled: true,
      });

      const failed = await LocationService.setSiteGeoConfig('site_err', {
        centerLatitude: 22.6734,
        centerLongitude: 88.4412,
        radiusMeters: 150,
        enabled: true,
      });
      expect(failed).toBeNull();
    });
  });

  describe('resolveAddressCoordinates', () => {
    it('progressively resolves coordinates even with noisy room/office unit numbers', async () => {
      vi.mocked(apiClient)
        .mockResolvedValueOnce({ status: 'success', data: [] })
        .mockResolvedValueOnce({
          status: 'success',
          data: [
            {
              placeId: 'place_shrachi',
              label: 'Shrachi Ek Tower, Action Area IID, Newtown, Kolkata 700161',
              latitude: 22.5925,
              longitude: 88.4812,
            },
          ],
        });

      const result = await LocationService.resolveAddressCoordinates({
        street: 'Shrachi, EKT/5, Office-B, Ek Tower, AA II, Action Area IID, Newtown,',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700161',
      });

      expect(result).not.toBeNull();
      expect(result?.latitude).toBe(22.5925);
      expect(result?.longitude).toBe(88.4812);
    });

    it('falls back to Phase 2 fuzzy typeahead suggestions when direct searches return empty', async () => {
      // All direct forward geocoding searches return empty
      vi.mocked(apiClient).mockResolvedValue({ status: 'success', data: [] });

      // Override for suggestion and place details
      vi.mocked(apiClient)
        .mockResolvedValueOnce({ status: 'success', data: [] })
        .mockResolvedValueOnce({ status: 'success', data: [] })
        .mockResolvedValueOnce({ status: 'success', data: [] })
        .mockResolvedValueOnce({ status: 'success', data: [] })
        .mockResolvedValueOnce({ status: 'success', data: [] })
        .mockResolvedValueOnce({ status: 'success', data: [] })
        .mockResolvedValueOnce({ status: 'success', data: [] })
        // Phase 2 suggestions
        .mockResolvedValueOnce({
          data: [{ placeId: 'place_fuzzy_1', text: 'Newtown Kolkata' }],
        })
        // Phase 2 place details
        .mockResolvedValueOnce({
          data: {
            placeId: 'place_fuzzy_1',
            label: 'Newtown, Kolkata, West Bengal',
            latitude: 22.58,
            longitude: 88.47,
          },
        });

      const result = await LocationService.resolveAddressCoordinates({
        street: 'Unknown Building Area',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700156',
      });

      expect(result).not.toBeNull();
      expect(result?.placeId).toBe('place_fuzzy_1');
      expect(result?.latitude).toBe(22.58);
    });

    it('returns null when no candidates or suggestions match', async () => {
      vi.mocked(apiClient).mockResolvedValue({ status: 'success', data: [] });

      const result = await LocationService.resolveAddressCoordinates({
        street: '',
        city: '',
      });
      expect(result).toBeNull();
    });
  });
});
