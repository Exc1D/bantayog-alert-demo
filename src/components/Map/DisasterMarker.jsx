import { memo, useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getDisasterType } from '../../data/disasterTypes';
import { MARKER_COLORS, DISASTER_ICONS } from '../../utils/constants';
import { formatTimeAgo } from '../../utils/timeUtils';
import { sanitizeMediaUrl } from '../../utils/mediaSafety';

// Cache marker icons to avoid recreating DOM elements
const iconCache = new Map();

function getMarkerIcon(type, severity, status, reportType) {
  const cacheKey = `${type}-${severity}-${status}-${reportType}`;
  if (iconCache.has(cacheKey)) return iconCache.get(cacheKey);

  // Use report type icons for pending reports that have a reportType
  let icon;
  if (type === 'pending' && reportType) {
    if (reportType === 'emergency') {
      icon = '\u26A0\uFE0F'; // Warning emoji
    } else if (reportType === 'situation') {
      icon = '\u2139\uFE0F'; // Information emoji
    } else {
      icon = DISASTER_ICONS.other;
    }
  } else {
    icon = DISASTER_ICONS[type] || DISASTER_ICONS.other;
  }

  const color = MARKER_COLORS[type] || MARKER_COLORS.other;
  const opacity = status === 'verified' || status === 'resolved' ? 1 : 0.7;
  const borderColor =
    status === 'resolved' ? '#16a34a' : severity === 'critical' ? '#dc2626' : '#ffffff';
  const size = severity === 'critical' ? 44 : 38;

  const divIcon = L.divIcon({
    html: `
      <div style="
        background: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 3px solid ${borderColor};
        box-shadow: 0 2px 10px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${severity === 'critical' ? 22 : 18}px;
        opacity: ${opacity};
        transition: transform 0.2s;
      ">
        ${icon}
      </div>
    `,
    className: 'custom-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2)],
  });

  iconCache.set(cacheKey, divIcon);
  return divIcon;
}

const sevStyles = {
  critical: 'bg-red-600 text-white',
  moderate: 'bg-amber-500 text-white',
  minor: 'bg-emerald-600 text-white',
};

const statusStyles = {
  pending: 'bg-stone-200 text-stone-700',
  verified: 'bg-blue-100 text-blue-700',
  rejected: 'bg-red-100 text-red-700',
  resolved: 'bg-emerald-100 text-emerald-700',
};

export default memo(function DisasterMarker({ report, onClick }) {
  const disasterType = getDisasterType(report.disaster?.type);
  const icon = useMemo(
    () =>
      getMarkerIcon(
        report.disaster?.type,
        report.disaster?.severity,
        report.verification?.status,
        report.reportType
      ),
    [
      report.disaster?.type,
      report.disaster?.severity,
      report.verification?.status,
      report.reportType,
    ]
  );

  const eventHandlers = useMemo(
    () => ({
      click: () => onClick && onClick(report),
    }),
    [onClick, report]
  );

  // Prefer thumbnail over full photo for popup preview
  const popupImage =
    sanitizeMediaUrl(report.media?.thumbnails?.[0]) || sanitizeMediaUrl(report.media?.photos?.[0]);

  return (
    <Marker
      position={[report.location.lat, report.location.lng]}
      icon={icon}
      eventHandlers={eventHandlers}
    >
      <Popup>
        <div className="font-sans min-w-[200px] max-w-[260px]">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-base">{disasterType.icon}</span>
            <span className="font-bold text-sm uppercase tracking-wide">{disasterType.label}</span>
          </div>

          <p className="font-medium text-xs text-text">{report.location.municipality}</p>
          {report.location.street && (
            <p className="text-[11px] text-textLight">{report.location.street}</p>
          )}

          <p className="text-xs my-2 line-clamp-3 leading-relaxed">
            {report.disaster?.description}
          </p>

          {report.disaster?.waterLevel && (
            <p className="text-[11px] bg-blue-50 border border-blue-100 rounded px-2 py-1 mb-2 font-medium text-blue-700">
              Water Level: {report.disaster.waterLevel}cm
            </p>
          )}

          <div className="flex items-center gap-1.5 mb-1.5">
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${sevStyles[report.disaster?.severity] || sevStyles.minor}`}
            >
              {report.disaster?.severity}
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${statusStyles[report.verification?.status] || statusStyles.pending}`}
            >
              {report.verification?.status}
            </span>
          </div>

          <p className="text-[10px] text-textMuted">{formatTimeAgo(report.timestamp)}</p>

          {popupImage && (
            <img
              src={popupImage}
              alt="Report"
              className="w-full h-20 object-cover rounded-lg mt-2 border border-stone-200"
              loading="lazy"
            />
          )}
        </div>
      </Popup>
    </Marker>
  );
});
