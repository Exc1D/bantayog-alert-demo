import { render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { MapPanelProvider, useMapPanel } from '../../contexts/MapPanelContext';

const mockLeafletMap = vi.fn(() => <div data-testid="leaflet-map" />);

vi.mock('./LeafletMap', () => ({ default: (props) => mockLeafletMap(props) }));

import PersistentMapPanel from './PersistentMapPanel';

function renderWithMapMode(
  mapMode,
  { highlightedReportId = null, reportLocations = [], reports = [] } = {}
) {
  function Setup() {
    const { setMapMode, setHighlightedReportId, setReportLocations, setReports } = useMapPanel();
    useEffect(() => {
      setMapMode(mapMode);
      setHighlightedReportId(highlightedReportId);
      setReportLocations(reportLocations);
      setReports(reports);
    }, []);
    return <PersistentMapPanel />;
  }
  return render(
    <MapPanelProvider>
      <Setup />
    </MapPanelProvider>
  );
}

describe('PersistentMapPanel', () => {
  beforeEach(() => {
    mockLeafletMap.mockClear();
  });

  it("returns null when mapMode === 'hidden'", () => {
    renderWithMapMode('hidden');
    expect(screen.queryByTestId('leaflet-map')).not.toBeInTheDocument();
  });

  it("renders LeafletMap when mapMode === 'pins'", () => {
    renderWithMapMode('pins');
    expect(screen.getByTestId('leaflet-map')).toBeInTheDocument();
  });

  it("renders LeafletMap when mapMode === 'zones'", () => {
    renderWithMapMode('zones');
    expect(screen.getByTestId('leaflet-map')).toBeInTheDocument();
  });

  it("renders LeafletMap when mapMode === 'full'", () => {
    renderWithMapMode('full');
    expect(screen.getByTestId('leaflet-map')).toBeInTheDocument();
  });

  it('passes highlightedReportId as flyToReportId to LeafletMap', () => {
    const reportLocations = [{ id: 'r1', lat: 14.5, lng: 121.0, severity: 'high' }];
    renderWithMapMode('pins', { highlightedReportId: 'r1', reportLocations });
    expect(mockLeafletMap).toHaveBeenCalledWith(expect.objectContaining({ flyToReportId: 'r1' }));
  });

  it('passes reports to LeafletMap for rendering markers', () => {
    const reports = [
      { id: 'r1', lat: 14.5, lng: 121.0, severity: 'high', location: { municipality: 'Makati' } },
    ];
    const reportLocations = [{ id: 'r1', lat: 14.5, lng: 121.0, severity: 'high' }];
    renderWithMapMode('pins', { reports, reportLocations });
    expect(mockLeafletMap).toHaveBeenCalledWith(
      expect.objectContaining({ reports: expect.arrayContaining(reports) })
    );
  });
});
