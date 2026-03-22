import { createContext, useContext, useState, useCallback } from 'react';

const MapPanelContext = createContext(null);

export function MapPanelProvider({ children, initialMapMode = 'hidden' }) {
  const [mapMode, setMapModeRaw] = useState(initialMapMode);
  const [highlightedReportId, setHighlightedReportIdRaw] = useState(null);
  const [reportLocations, setReportLocationsRaw] = useState([]);
  const [reports, setReportsRaw] = useState([]);
  const [selectedReportId, setSelectedReportIdRaw] = useState(null);
  const [incidentDetailReport, setIncidentDetailReportRaw] = useState(null);

  const setMapMode = useCallback((mode) => setMapModeRaw(mode), []);
  const setHighlightedReportId = useCallback((id) => setHighlightedReportIdRaw(id), []);
  const setReportLocations = useCallback((locs) => setReportLocationsRaw(locs), []);
  const setReports = useCallback((reps) => setReportsRaw(reps), []);
  const setSelectedReportId = useCallback((id) => setSelectedReportIdRaw(id), []);
  const setIncidentDetailReport = useCallback((r) => setIncidentDetailReportRaw(r), []);

  return (
    <MapPanelContext.Provider
      value={{
        mapMode,
        setMapMode,
        highlightedReportId,
        setHighlightedReportId,
        reportLocations,
        setReportLocations,
        reports,
        setReports,
        selectedReportId,
        setSelectedReportId,
        incidentDetailReport,
        setIncidentDetailReport,
      }}
    >
      {children}
    </MapPanelContext.Provider>
  );
}

export function useMapPanel() {
  const ctx = useContext(MapPanelContext);
  if (!ctx) throw new Error('useMapPanel must be used within a MapPanelProvider');
  return ctx;
}

export default MapPanelContext;
