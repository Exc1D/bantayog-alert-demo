const ALLOWED_MEDIA_PROTOCOLS = new Set(['https:', 'http:', 'blob:']);

/**
 * Prevents unsafe URL schemes from being used in image sources.
 * Allows HTTPS/HTTP, blob URLs, and base64 data-image URLs.
 */
export function sanitizeMediaUrl(url) {
  if (typeof url !== 'string') return null;

  const trimmedUrl = url.trim();
  if (!trimmedUrl) return null;

  // Restrict data URLs to images only
  if (/^data:image\//i.test(trimmedUrl)) {
    return trimmedUrl;
  }

  try {
    const parsed = new URL(trimmedUrl);
    return ALLOWED_MEDIA_PROTOCOLS.has(parsed.protocol) ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export function getSafeMediaUrls(urls = []) {
  if (!Array.isArray(urls)) return [];
  return urls.map(sanitizeMediaUrl).filter(Boolean);
}

