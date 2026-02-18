const ALLOWED_MEDIA_PROTOCOLS = new Set(['https:', 'blob:']);
const ALLOWED_DATA_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
]);
const MAX_DATA_URI_LENGTH = 10 * 1024 * 1024;
const MAX_URL_LENGTH = 2048;

export function sanitizeMediaUrl(url) {
  if (typeof url !== 'string') return null;

  const trimmedUrl = url.trim();
  if (!trimmedUrl) return null;

  if (/^data:image\//i.test(trimmedUrl)) {
    if (trimmedUrl.length > MAX_DATA_URI_LENGTH) return null;
    const mimeMatch = trimmedUrl.match(/^data:(image\/[\w+.-]+)/i);
    if (!mimeMatch || !ALLOWED_DATA_IMAGE_TYPES.has(mimeMatch[1].toLowerCase())) return null;
    return trimmedUrl;
  }

  if (trimmedUrl.length > MAX_URL_LENGTH) return null;

  try {
    const parsed = new URL(trimmedUrl);
    if (!ALLOWED_MEDIA_PROTOCOLS.has(parsed.protocol)) return null;
    if (parsed.username || parsed.password) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function getSafeMediaUrls(urls = []) {
  if (!Array.isArray(urls)) return [];
  return urls.map(sanitizeMediaUrl).filter(Boolean);
}
