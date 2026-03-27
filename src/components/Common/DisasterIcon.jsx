import { memo } from 'react';
import { getDisasterType } from '../../data/disasterTypes';

/**
 * Reusable component for rendering disaster type icons as inline SVG.
 *
 * SECURITY NOTE: This component uses dangerouslySetInnerHTML to render SVG icons.
 * The icon content is sourced exclusively from hardcoded strings in disasterTypes.js —
 * NOT from user input or external data. This approach is necessary because React SVG
 * components cannot dynamically render SVG markup passed via props. If icons are ever
 * sourced from user input, external APIs, or any dynamic data source, this pattern
 * MUST be refactored to use a sanitization library (e.g., DOMPurify) to prevent XSS.
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
