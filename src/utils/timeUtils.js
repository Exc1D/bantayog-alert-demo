import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

export function formatTimeAgo(timestamp) {
  if (!timestamp) return '';

  let date;
  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else if (typeof timestamp.seconds === 'number') {
    // Handle plain { seconds, nanoseconds } Firestore-like objects
    date = new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1_000_000);
  } else {
    date = new Date(timestamp);
  }

  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatDate(timestamp) {
  if (!timestamp) return '';

  let date;
  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else if (typeof timestamp.seconds === 'number') {
    date = new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1_000_000);
  } else {
    date = new Date(timestamp);
  }

  if (isToday(date)) {
    return `Today at ${format(date, 'h:mm a')}`;
  }

  if (isYesterday(date)) {
    return `Yesterday at ${format(date, 'h:mm a')}`;
  }

  return format(date, 'MMM d, yyyy h:mm a');
}

export function formatShortDate(timestamp) {
  if (!timestamp) return '';

  let date;
  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else if (typeof timestamp.seconds === 'number') {
    date = new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1_000_000);
  } else {
    date = new Date(timestamp);
  }

  return format(date, 'MMM d, h:mm a');
}

export function formatFullDate(timestamp) {
  if (!timestamp) return '';

  let date;
  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else if (typeof timestamp.seconds === 'number') {
    date = new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1_000_000);
  } else {
    date = new Date(timestamp);
  }

  return format(date, 'EEEE, MMMM d, yyyy h:mm a');
}
