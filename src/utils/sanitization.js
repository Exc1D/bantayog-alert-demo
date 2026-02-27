import DOMPurify from 'dompurify';
import validator from 'validator';

const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<\/?script\b[^>]*>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /data:\s*text\/html/gi,
];

const ALLOWED_URL_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

export function sanitizeText(text) {
  if (text === null || text === undefined) {
    return '';
  }

  let sanitized = String(text).trim();

  // Strip control characters and zero-width spaces FIRST so they can't break
  // pattern matching (e.g. null bytes inside <scri\x00pt> preventing regex match)
  sanitized = sanitized
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\u200B/g, '');

  // Cap input length to prevent regex backtracking on extremely large payloads
  const MAX_SANITIZE_LENGTH = 100_000;
  if (sanitized.length > MAX_SANITIZE_LENGTH) {
    sanitized = sanitized.slice(0, MAX_SANITIZE_LENGTH);
  }

  // Run dangerous pattern removal in a loop to catch fragments that recombine
  // after an inner match is stripped (e.g. <scr<script>ipt> → <script>)
  const MAX_SANITIZE_ITERATIONS = 10;
  let iterations = 0;
  let previous;
  do {
    previous = sanitized;
    for (const pattern of DANGEROUS_PATTERNS) {
      sanitized = sanitized.replace(pattern, '');
    }
    iterations++;
  } while (sanitized !== previous && iterations < MAX_SANITIZE_ITERATIONS);

  return sanitized;
}

export function sanitizeHTML(html, options = {}) {
  if (html === null || html === undefined) {
    return '';
  }

  const defaultOptions = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'span', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    FORBID_SCRIPTS: true,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  };

  return DOMPurify.sanitize(String(html), { ...defaultOptions, ...options });
}

export function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') {
    return '';
  }

  const trimmed = url.trim();

  if (!trimmed) {
    return '';
  }

  try {
    const parsed = new URL(trimmed);

    if (!ALLOWED_URL_PROTOCOLS.includes(parsed.protocol)) {
      return '';
    }

    if (parsed.protocol === 'javascript:') {
      return '';
    }

    return validator.trim(trimmed);
  } catch {
    if (/^[\w.-]+@[\w.-]+\.\w+$/.test(trimmed)) {
      return `mailto:${trimmed}`;
    }

    if (/^[\d\s+()-]+$/.test(trimmed)) {
      return `tel:${trimmed.replace(/\s/g, '')}`;
    }

    if (!trimmed.match(/^https?:\/\//i)) {
      const potentialUrl = `https://${trimmed}`;
      try {
        new URL(potentialUrl);
        return potentialUrl;
      } catch {
        return '';
      }
    }

    return '';
  }
}

export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required' };
  }

  const trimmed = email.trim();

  if (!trimmed) {
    return { isValid: false, error: 'Email is required' };
  }

  if (!validator.isEmail(trimmed)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  if (trimmed.length > 254) {
    return { isValid: false, error: 'Email is too long' };
  }

  return { isValid: true, sanitized: trimmed.toLowerCase() };
}

export function validatePhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, error: 'Phone number is required' };
  }

  const cleaned = phone.replace(/[\s-]/g, '');

  if (!cleaned) {
    return { isValid: false, error: 'Phone number is required' };
  }

  const phoneRegex = /^(\+?\d{1,3}[-.]?)?\(?\d{2,4}\)?[-.]?\d{3,4}([-.]?\d{1,4})*$/;

  if (!phoneRegex.test(cleaned)) {
    return { isValid: false, error: 'Invalid phone number format' };
  }

  if (cleaned.replace(/\D/g, '').length < 7) {
    return { isValid: false, error: 'Phone number is too short' };
  }

  if (cleaned.replace(/\D/g, '').length > 15) {
    return { isValid: false, error: 'Phone number is too long' };
  }

  return { isValid: true, sanitized: cleaned };
}

export function truncateText(text, maxLength = 255, suffix = '...') {
  if (!text || typeof text !== 'string') {
    return '';
  }

  if (text.length <= maxLength) {
    return text;
  }

  const truncated = text.slice(0, maxLength);

  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.8) {
    return truncated.slice(0, lastSpace) + suffix;
  }

  return truncated + suffix;
}

export function escapeHtml(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const htmlEntities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };

  return text.replace(/[&<>"'`=/]/g, (char) => htmlEntities[char]);
}

export function sanitizeObject(obj, options = {}) {
  const { maxLength = 5000, allowedFields = null } = options;

  if (!obj || typeof obj !== 'object') {
    return {};
  }

  const sanitized = {};

  for (const [key, value] of Object.entries(obj)) {
    if (allowedFields && !allowedFields.includes(key)) {
      continue;
    }

    const sanitizedKey = sanitizeText(key);

    if (typeof value === 'string') {
      sanitized[sanitizedKey] = truncateText(sanitizeText(value), maxLength);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[sanitizedKey] = value;
    } else if (value === null) {
      sanitized[sanitizedKey] = null;
    } else if (Array.isArray(value)) {
      sanitized[sanitizedKey] = value
        .filter((v) => typeof v === 'string')
        .map((v) => truncateText(sanitizeText(v), maxLength))
        .slice(0, 20);
    }
  }

  return sanitized;
}

export function containsXSS(input) {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /<form/gi,
    /data:\s*text\/html/gi,
    /vbscript:/gi,
    /expression\s*\(/gi,
  ];

  return xssPatterns.some((pattern) => pattern.test(input));
}

export function createSafeInputValidator(maxLength = 255) {
  return (value) => {
    if (!value || typeof value !== 'string') {
      return { isValid: true, sanitized: '' };
    }

    const sanitized = sanitizeText(value);
    const truncated = truncateText(sanitized, maxLength);

    if (containsXSS(value)) {
      return {
        isValid: false,
        sanitized: truncated,
        warning: 'Potentially unsafe content was removed',
      };
    }

    return { isValid: true, sanitized: truncated };
  };
}
