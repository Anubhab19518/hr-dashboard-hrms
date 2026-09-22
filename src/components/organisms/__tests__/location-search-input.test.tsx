import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LocationSearchInput } from '../location-search-input';
import { LocationService } from '@/lib/client/location-service';

vi.mock('@/lib/client/location-service', () => ({
  LocationService: {
    getSuggestions: vi.fn(),
    getPlaceDetails: vi.fn(),
    searchPlaces: vi.fn(),
    reverseGeocode: vi.fn(),
  },
}));

describe('LocationSearchInput Organism', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders input with placeholder and detect GPS button', () => {
    render(
      <LocationSearchInput onLocationSelect={vi.fn()} placeholder="Search office address..." />,
    );

    expect(screen.getByPlaceholderText('Search office address...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Detect & Snap Current GPS/i })).toBeInTheDocument();
  });

  it('queries suggestions as user types with debouncing', async () => {
    vi.mocked(LocationService.getSuggestions).mockResolvedValueOnce([
      { text: 'Birati, Kolkata, West Bengal, India', placeId: 'place_123' },
      { text: 'Birati Railway Station, Kolkata', placeId: 'place_456' },
    ]);

    render(<LocationSearchInput onLocationSelect={vi.fn()} />);

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Birati' } });

    await waitFor(() => {
      expect(LocationService.getSuggestions).toHaveBeenCalledWith('Birati', 6);
    });

    expect(await screen.findByText('Birati, Kolkata, West Bengal, India')).toBeInTheDocument();
    expect(screen.getByText('Birati Railway Station, Kolkata')).toBeInTheDocument();
  });

  it('fetches place details and calls onLocationSelect when suggestion is clicked', async () => {
    const handleLocationSelect = vi.fn();
    vi.mocked(LocationService.getSuggestions).mockResolvedValueOnce([
      { text: 'Sector V Salt Lake, Kolkata', placeId: 'place_sector_v' },
    ]);
    vi.mocked(LocationService.getPlaceDetails).mockResolvedValueOnce({
      label: 'Sector V Salt Lake City, Bidhannagar, Kolkata 700091',
      latitude: 22.57385,
      longitude: 88.43592,
      municipality: 'Kolkata',
      region: 'West Bengal',
      postalCode: '700091',
    });

    render(<LocationSearchInput onLocationSelect={handleLocationSelect} />);

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Sector V' } });

    const suggestion = await screen.findByText('Sector V Salt Lake, Kolkata');
    fireEvent.click(suggestion);

    await waitFor(() => {
      expect(LocationService.getPlaceDetails).toHaveBeenCalledWith('place_sector_v');
      expect(handleLocationSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: 22.57385,
          longitude: 88.43592,
          city: 'Kolkata',
          postalCode: '700091',
        }),
      );
    });
  });

  it('snaps GPS coordinates to AWS Places building centroid on Detect GPS click', async () => {
    const handleLocationSelect = vi.fn();
    const mockGeolocation = {
      getCurrentPosition: vi.fn((success) => {
        success({
          coords: { latitude: 22.57385, longitude: 88.43592 },
        });
      }),
    };
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      configurable: true,
    });

    vi.mocked(LocationService.reverseGeocode).mockResolvedValueOnce([
      {
        placeId: 'place_snap_1',
        label: '7, Sector V-Ep Block, Bidhannagar, Kolkata 700091',
        latitude: 22.57357,
        longitude: 88.43606,
        municipality: 'Kolkata',
        postalCode: '700091',
      },
    ]);

    render(<LocationSearchInput onLocationSelect={handleLocationSelect} />);

    const gpsBtn = screen.getByRole('button', { name: /Detect & Snap Current GPS/i });
    fireEvent.click(gpsBtn);

    await waitFor(() => {
      expect(LocationService.reverseGeocode).toHaveBeenCalledWith(22.57385, 88.43592, 1);
      expect(handleLocationSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          label: '7, Sector V-Ep Block, Bidhannagar, Kolkata 700091',
          latitude: 22.57357,
          longitude: 88.43606,
        }),
      );
    });
  });
});
