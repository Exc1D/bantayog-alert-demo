import { createContext, useContext, useState, useMemo, useCallback } from 'react';

const MapPanelContext = createContext(null);

export function MapPanelProvider({ children }) {
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
  }, []);

  const value = useMemo(
    () => ({
      selectedReportId,
      incidentDetailReport,
      selectReport,
      openIncidentDetail,
      closeIncidentDetail,
    }),
    [selectedReportId, incidentDetailReport, selectReport, openIncidentDetail, closeIncidentDetail]
  );

  return <MapPanelContext.Provider value={value}>{children}</MapPanelContext.Provider>;
}

export function useMapPanel() {
  const context = useContext(MapPanelContext);
  if (!context) {
    throw new Error('useMapPanel must be used within a MapPanelProvider');
  }
  return context;
}

export default MapPanelContext;
