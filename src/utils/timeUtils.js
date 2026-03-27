import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

/**
 * Normalizes various Firestore timestamp representations into a Date object.
 * Handles:
 * - Firestore Timestamp instances (has .toDate method)
 * - Plain {seconds, nanoseconds} objects from serialized Firestore documents
 * - Numeric timestamps (ms since epoch) or ISO date strings
 *
 * Returns null for invalid/unparseable inputs.
 */
function normalizeToDate(timestamp) {
  if (!timestamp) return null;

  // Handle Firestore Timestamp (has .toDate method)
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }

  // Handle plain {seconds, nanoseconds} object (from Firestore snapshot serialization)
  if (timestamp?.seconds != null) {
    return new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
  }

  // Handle numeric timestamp or ISO string
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return null;

  return date;
}

export function formatTimeAgo(timestamp) {
  const date = normalizeToDate(timestamp);
  if (!date) return '';

  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatDate(timestamp) {
  const date = normalizeToDate(timestamp);
  if (!date) return '';

  if (isToday(date)) {
    return `Today at ${format(date, 'h:mm a')}`;
  }

  if (isYesterday(date)) {
    return `Yesterday at ${format(date, 'h:mm a')}`;
  }

  return format(date, 'MMM d, yyyy h:mm a');
}

export function formatShortDate(timestamp) {
  const date = normalizeToDate(timestamp);
  if (!date) return '';

  return format(date, 'MMM d, h:mm a');
}

export function formatFullDate(timestamp) {
  const date = normalizeToDate(timestamp);
  if (!date) return '';

  return format(date, 'EEEE, MMMM d, yyyy h:mm a');
}
