import { createContext, useContext, useState, useCallback } from 'react';

const MapPanelContext = createContext(null);

export function MapPanelProvider({ children }) {
  const [selectedReportId, setSelectedReportIdRaw] = useState(null);
  const [incidentDetailReport, setIncidentDetailReportRaw] = useState(null);

  const setSelectedReportId = useCallback((id) => setSelectedReportIdRaw(id), []);
  const setIncidentDetailReport = useCallback((r) => setIncidentDetailReportRaw(r), []);

  return (
    <MapPanelContext.Provider value={{
      selectedReportId,
      setSelectedReportId,
      incidentDetailReport,
      setIncidentDetailReport,
    }}>
      {children}
    </MapPanelContext.Provider>
  );
}

export function useMapPanel() {
  const ctx = useContext(MapPanelContext);
  if (!ctx) throw new Error('useMapPanel must be used within MapPanelProvider');
  return ctx;
}
