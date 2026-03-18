import { createContext, useContext, useState, useCallback } from 'react';

const MapPanelContext = createContext(null);

export function MapPanelProvider({ children }) {
  const [mapMode, setMapModeRaw] = useState('hidden');
  const [highlightedReportId, setHighlightedReportIdRaw] = useState(null);
  const [reportLocations, setReportLocationsRaw] = useState([]);

  const setMapMode = useCallback((mode) => setMapModeRaw(mode), []);
  const setHighlightedReportId = useCallback((id) => setHighlightedReportIdRaw(id), []);
  const setReportLocations = useCallback((locs) => setReportLocationsRaw(locs), []);

  return (
    <MapPanelContext.Provider
      value={{
        mapMode,
        setMapMode,
        highlightedReportId,
        setHighlightedReportId,
        reportLocations,
        setReportLocations,
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
