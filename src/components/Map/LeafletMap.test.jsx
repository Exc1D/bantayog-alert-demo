import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mockFlyTo = vi.fn();
const mockInvalidateSize = vi.fn();
const mockGetContainer = vi.fn(() => document.createElement('div'));

vi.mock('leaflet', () => ({
  default: {
    Icon: {
      Default: {
        prototype: {},
        mergeOptions: vi.fn(),
      },
    },
  },
}));

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => null,
  ZoomControl: () => null,
  useMap: () => ({
    flyTo: mockFlyTo,
    invalidateSize: mockInvalidateSize,
    getContainer: mockGetContainer,
  }),
  useMapEvents: () => null,
}));

vi.mock('./MarkerClusterGroup', () => ({ default: ({ children }) => <>{children}</> }));
vi.mock('./DisasterMarker', () => ({ default: () => null }));
vi.mock('./MapControls', () => ({ default: () => null }));
vi.mock('./MapFlyToLocation', () => ({ default: () => null }));

import LeafletMap from './LeafletMap';

function renderLeafletMap(props = {}) {
  return render(
    <MemoryRouter>
      <LeafletMap {...props} />
    </MemoryRouter>
  );
}

describe('LeafletMap', () => {
  beforeEach(() => {
    mockFlyTo.mockClear();
  });

  it('renders without flyToReportId', () => {
    renderLeafletMap();
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('does not fly when flyToReportId is null', () => {
    renderLeafletMap({ flyToReportId: null });
    expect(mockFlyTo).not.toHaveBeenCalled();
  });

  it('calls flyTo when flyToReportId matches a report in reportLocations', () => {
    const reportLocations = [{ id: 'r1', lat: 14.5, lng: 121.0, severity: 'high' }];
    renderLeafletMap({ flyToReportId: 'r1', reportLocations });
    expect(mockFlyTo).toHaveBeenCalledWith([14.5, 121.0], 15);
  });

  it('does not fly when flyToReportId does not match any report', () => {
    const reportLocations = [{ id: 'r1', lat: 14.5, lng: 121.0, severity: 'high' }];
    renderLeafletMap({ flyToReportId: 'nonexistent', reportLocations });
    expect(mockFlyTo).not.toHaveBeenCalled();
  });
});
