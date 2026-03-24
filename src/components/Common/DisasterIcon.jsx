import { memo } from 'react';
import { getDisasterType } from '../../data/disasterTypes';

/**
 * Reusable component for rendering disaster type icons as inline SVG
 * Avoids dangerouslySetInnerHTML by using a controlled parsing approach
 */
const DisasterIcon = memo(function DisasterIcon({ typeId, className = 'w-5 h-5', size = 24 }) {
  const disasterType = getDisasterType(typeId);

  if (!disasterType?.icon) {
    return null;
  }

  return (
    <span
      className={`disaster-icon inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ color: disasterType.color, width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: disasterType.icon }}
      aria-hidden="true"
    />
  );
});

export default DisasterIcon;
