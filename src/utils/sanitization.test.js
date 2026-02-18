import { describe, it, expect } from 'vitest';
import {
  sanitizeText,
  sanitizeHTML,
  sanitizeUrl,
  validateEmail,
  validatePhoneNumber,
  truncateText,
  escapeHtml,
  sanitizeObject,
  containsXSS,
  createSafeInputValidator,
} from './sanitization';

describe('sanitizeText', () => {
  it('returns empty string for null/undefined input', () => {
    expect(sanitizeText(null)).toBe('');
    expect(sanitizeText(undefined)).toBe('');
  });

  it('trims whitespace from input', () => {
    expect(sanitizeText('  hello world  ')).toBe('hello world');
  });

  it('removes script tags', () => {
    expect(sanitizeText('<script>alert("xss")</script>hello')).toBe('hello');
  });

  it('removes javascript: protocol', () => {
    expect(sanitizeText('javascript:alert(1)')).toBe('alert(1)');
  });

  it('removes event handlers', () => {
    const result = sanitizeText('<img onclick="alert(1)">');
    expect(result).not.toContain('onclick');
    expect(result).not.toMatch(/on\w+\s*=/);
  });

  it('removes control characters', () => {
    expect(sanitizeText('hello\x00world')).toBe('helloworld');
  });

  it('preserves normal text', () => {
    expect(sanitizeText('Normal text with numbers 123')).toBe('Normal text with numbers 123');
  });
});

describe('sanitizeHTML', () => {
  it('returns empty string for null/undefined input', () => {
    expect(sanitizeHTML(null)).toBe('');
    expect(sanitizeHTML(undefined)).toBe('');
  });

  it('removes script tags', () => {
    const result = sanitizeHTML('<script>alert("xss")</script><p>Safe</p>');
    expect(result).not.toContain('script');
    expect(result).toContain('Safe');
  });

  it('allows safe tags', () => {
    const result = sanitizeHTML('<b>Bold</b> <i>Italic</i>');
    expect(result).toContain('<b>');
    expect(result).toContain('<i>');
  });

  it('removes dangerous attributes', () => {
    const result = sanitizeHTML('<p onclick="alert(1)">Text</p>');
    expect(result).not.toContain('onclick');
  });

  it('removes iframe tags', () => {
    const result = sanitizeHTML('<iframe src="evil.com"></iframe><p>Safe</p>');
    expect(result).not.toContain('iframe');
  });
});

describe('sanitizeUrl', () => {
  it('returns empty string for null/undefined input', () => {
    expect(sanitizeUrl(null)).toBe('');
    expect(sanitizeUrl(undefined)).toBe('');
  });

  it('allows http and https URLs', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
  });

  it('blocks javascript: protocol', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('');
  });

  it('blocks data: URLs', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
  });

  it('converts email to mailto:', () => {
    expect(sanitizeUrl('test@example.com')).toBe('mailto:test@example.com');
  });

  it('adds https:// to domain-like strings', () => {
    expect(sanitizeUrl('example.com')).toBe('https://example.com');
  });

  it('returns empty for invalid URLs', () => {
    expect(sanitizeUrl('not a url')).toBe('');
  });
});

describe('validateEmail', () => {
  it('rejects null/undefined', () => {
    expect(validateEmail(null).isValid).toBe(false);
    expect(validateEmail(undefined).isValid).toBe(false);
  });

  it('rejects invalid email formats', () => {
    expect(validateEmail('notanemail').isValid).toBe(false);
    expect(validateEmail('missing@domain').isValid).toBe(false);
    expect(validateEmail('@nodomain.com').isValid).toBe(false);
  });

  it('accepts valid emails', () => {
    const result = validateEmail('test@example.com');
    expect(result.isValid).toBe(true);
    expect(result.sanitized).toBe('test@example.com');
  });

  it('lowercases valid emails', () => {
    const result = validateEmail('TEST@EXAMPLE.COM');
    expect(result.sanitized).toBe('test@example.com');
  });

  it('rejects emails over 254 characters', () => {
    const longEmail = 'a'.repeat(250) + '@x.com';
    expect(validateEmail(longEmail).isValid).toBe(false);
  });
});

describe('validatePhoneNumber', () => {
  it('rejects null/undefined', () => {
    expect(validatePhoneNumber(null).isValid).toBe(false);
    expect(validatePhoneNumber(undefined).isValid).toBe(false);
  });

  it('accepts valid phone numbers', () => {
    expect(validatePhoneNumber('+1234567890').isValid).toBe(true);
    expect(validatePhoneNumber('123-456-7890').isValid).toBe(true);
    expect(validatePhoneNumber('(123) 456-7890').isValid).toBe(true);
  });

  it('rejects invalid phone formats', () => {
    expect(validatePhoneNumber('abc').isValid).toBe(false);
    expect(validatePhoneNumber('123').isValid).toBe(false);
  });

  it('rejects phone numbers that are too short', () => {
    expect(validatePhoneNumber('123456').isValid).toBe(false);
  });

  it('rejects phone numbers that are too long', () => {
    expect(validatePhoneNumber('1'.repeat(20)).isValid).toBe(false);
  });
});

describe('truncateText', () => {
  it('returns empty string for null/undefined', () => {
    expect(truncateText(null)).toBe('');
    expect(truncateText(undefined)).toBe('');
  });

  it('returns short text unchanged', () => {
    expect(truncateText('short', 10)).toBe('short');
  });

  it('truncates long text', () => {
    const result = truncateText('This is a long text that needs truncation', 20);
    expect(result.length).toBeLessThanOrEqual(23);
    expect(result.endsWith('...')).toBe(true);
  });

  it('truncates at word boundary when possible', () => {
    const result = truncateText('Hello world test', 12);
    expect(result.length).toBeLessThanOrEqual(15);
    expect(result.endsWith('...')).toBe(true);
  });

  it('uses custom suffix', () => {
    const result = truncateText('Hello world', 5, '---');
    expect(result).toBe('Hello---');
  });
});

describe('escapeHtml', () => {
  it('returns empty string for null/undefined', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });

  it('escapes HTML special characters', () => {
    expect(escapeHtml('<div>')).toBe('&lt;div&gt;');
    expect(escapeHtml('a & b')).toBe('a &amp; b');
    expect(escapeHtml('"quoted"')).toBe('&quot;quoted&quot;');
    expect(escapeHtml("'single'")).toBe('&#x27;single&#x27;');
  });

  it('escapes forward slash', () => {
    expect(escapeHtml('</script>')).toBe('&lt;&#x2F;script&gt;');
  });
});

describe('sanitizeObject', () => {
  it('returns empty object for null/undefined', () => {
    expect(sanitizeObject(null)).toEqual({});
    expect(sanitizeObject(undefined)).toEqual({});
  });

  it('sanitizes string values', () => {
    const result = sanitizeObject({ name: '  test  ', title: '<script>bad</script>' });
    expect(result.name).toBe('test');
    expect(result.title).not.toContain('script');
  });

  it('preserves numbers and booleans', () => {
    const result = sanitizeObject({ count: 42, active: true });
    expect(result.count).toBe(42);
    expect(result.active).toBe(true);
  });

  it('respects allowedFields filter', () => {
    const result = sanitizeObject({ name: 'test', secret: 'hidden' }, { allowedFields: ['name'] });
    expect(result.name).toBe('test');
    expect(result.secret).toBeUndefined();
  });

  it('truncates long strings based on maxLength', () => {
    const result = sanitizeObject({ text: 'a'.repeat(100) }, { maxLength: 10 });
    expect(result.text.length).toBeLessThanOrEqual(13);
  });
});

describe('containsXSS', () => {
  it('returns false for null/undefined', () => {
    expect(containsXSS(null)).toBe(false);
    expect(containsXSS(undefined)).toBe(false);
  });

  it('detects script tags', () => {
    expect(containsXSS('<script>alert(1)</script>')).toBe(true);
  });

  it('detects javascript: protocol', () => {
    expect(containsXSS('javascript:alert(1)')).toBe(true);
  });

  it('detects event handlers', () => {
    expect(containsXSS('<img onerror="alert(1)">')).toBe(true);
    expect(containsXSS('<div onclick="evil()">')).toBe(true);
  });

  it('detects iframe tags', () => {
    expect(containsXSS('<iframe src="evil.com">')).toBe(true);
  });

  it('returns false for safe content', () => {
    expect(containsXSS('Normal text')).toBe(false);
    expect(containsXSS('<b>Bold</b>')).toBe(false);
  });
});

describe('createSafeInputValidator', () => {
  it('returns validator function', () => {
    const validator = createSafeInputValidator(100);
    expect(typeof validator).toBe('function');
  });

  it('validates and sanitizes input', () => {
    const validator = createSafeInputValidator(100);
    const result = validator('  test  ');
    expect(result.isValid).toBe(true);
    expect(result.sanitized).toBe('test');
  });

  it('detects XSS and provides warning', () => {
    const validator = createSafeInputValidator(100);
    const result = validator('<script>alert(1)</script>');
    expect(result.warning).toBe('Potentially unsafe content was removed');
  });

  it('returns valid for null/undefined', () => {
    const validator = createSafeInputValidator(100);
    expect(validator(null).isValid).toBe(true);
    expect(validator(null).sanitized).toBe('');
  });
});
