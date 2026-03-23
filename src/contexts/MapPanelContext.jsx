import { createContext, useContext, useState, useCallback } from 'react';

const MapPanelContext = createContext(null);

export function MapPanelProvider({ children }) {
  const [mapMode, setMapMode] = useState('hidden');
  const [highlightedReportId, setHighlightedReportId] = useState(null);
  const [reportLocations, setReportLocations] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [incidentDetailReport, setIncidentDetailReport] = useState(null);

  const selectReport = useCallback((reportId) => {
    setSelectedReportId((prev) => (prev === reportId ? null : reportId));
  }, []);

  const openIncidentDetail = useCallback((report) => {
    setIncidentDetailReport(report);
  }, []);

  const closeIncidentDetail = useCallback(() => {
    setIncidentDetailReport(null);
    setSelectedReportId(null);
  }, []);

  return (
    <MapPanelContext.Provider
      value={{
        mapMode, setMapMode,
        highlightedReportId, setHighlightedReportId,
        reportLocations, setReportLocations,
        reports, setReports,
        selectedReportId, setSelectedReportId,
        incidentDetailReport, setIncidentDetailReport,
        selectReport, openIncidentDetail, closeIncidentDetail,
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
