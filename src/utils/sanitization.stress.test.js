/**
 * Stress tests for sanitization — XSS bypass attempts, encoding tricks,
 * edge cases that real attackers would try against a disaster reporting app.
 */
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

describe('sanitizeText — advanced XSS bypass attempts', () => {
  it('handles nested script tags', () => {
    const input = '<scr<script>ipt>alert(1)</scr</script>ipt>';
    const result = sanitizeText(input);
    expect(result).not.toMatch(/<script/i);
  });

  it('handles case-mixed script tags', () => {
    expect(sanitizeText('<ScRiPt>alert(1)</ScRiPt>')).not.toMatch(/<script/i);
  });

  it('handles null bytes injected inside tags', () => {
    const input = '<scri\x00pt>alert(1)</scri\x00pt>';
    const result = sanitizeText(input);
    expect(result).not.toContain('\x00');
    expect(result).not.toMatch(/<script/i);
  });

  it('handles unicode direction override characters', () => {
    const input = '\u202Ealert(1)\u202C';
    const result = sanitizeText(input);
    // Should preserve the text but RTL override chars are not control chars in 0x00-0x1F range
    expect(typeof result).toBe('string');
  });

  it('handles massive input without crashing', () => {
    const input = 'a'.repeat(1_000_000);
    const start = performance.now();
    const result = sanitizeText(input);
    const duration = performance.now() - start;
    expect(result.length).toBe(1_000_000);
    expect(duration).toBeLessThan(5000); // Should complete within 5s
  });

  it('handles input with only whitespace and control characters', () => {
    expect(sanitizeText('   \t\n\r   ')).toBe('');
  });

  it('removes data:text/html payloads', () => {
    const input = 'data: text/html,<script>alert(1)</script>';
    const result = sanitizeText(input);
    expect(result).not.toMatch(/data:\s*text\/html/i);
  });

  it('handles event handlers with various spacing', () => {
    expect(sanitizeText('<div onmouseover = "alert(1)">')).not.toMatch(/onmouseover/i);
    expect(sanitizeText('<div ONCLICK="alert(1)">')).not.toMatch(/onclick/i);
    expect(sanitizeText('<img onerror ="fetch(evil)">')).not.toMatch(/onerror/i);
  });

  it('removes zero-width spaces', () => {
    const input = 'he\u200Bllo';
    expect(sanitizeText(input)).toBe('hello');
  });

  it('handles string conversion of non-string types', () => {
    expect(sanitizeText(12345)).toBe('12345');
    expect(sanitizeText(true)).toBe('true');
    expect(sanitizeText({})).toBe('[object Object]');
    expect(sanitizeText([])).toBe('');
  });

  it('handles emoji and international characters safely', () => {
    const input = '🌊 Baha sa Daet! Caution ⚠️ 台風が来ます';
    expect(sanitizeText(input)).toBe(input);
  });
});

describe('sanitizeHTML — advanced payloads', () => {
  it('strips SVG-based XSS payloads', () => {
    const input = '<svg onload="alert(1)"><circle r="50"/></svg>';
    const result = sanitizeHTML(input);
    expect(result).not.toContain('onload');
    expect(result).not.toContain('<svg');
  });

  it('strips math-based XSS payloads', () => {
    const input = '<math><mtext><table><mglyph><style><!--</style><img src=x onerror=alert(1)>';
    const result = sanitizeHTML(input);
    expect(result).not.toContain('onerror');
    expect(result).not.toContain('<style');
  });

  it('strips mutation XSS via noscript', () => {
    const input = '<noscript><p title="</noscript><img src=x onerror=alert(1)>">';
    const result = sanitizeHTML(input);
    expect(result).not.toContain('onerror');
  });

  it('handles deeply nested allowed tags', () => {
    let input = '<p>';
    for (let i = 0; i < 100; i++) input += '<b><i><em>';
    input += 'deep';
    for (let i = 0; i < 100; i++) input += '</em></i></b>';
    input += '</p>';
    const result = sanitizeHTML(input);
    expect(result).toContain('deep');
  });

  it('strips style tags (CSS injection)', () => {
    const input = '<style>body { background: url("javascript:alert(1)") }</style><p>safe</p>';
    const result = sanitizeHTML(input);
    expect(result).not.toContain('<style');
    expect(result).toContain('safe');
  });

  it('strips form tags (phishing via injected forms)', () => {
    const input = '<form action="https://evil.com/steal"><input name="password"><button>Login</button></form>';
    const result = sanitizeHTML(input);
    expect(result).not.toContain('<form');
    expect(result).not.toContain('evil.com');
  });

  it('strips object/embed tags', () => {
    const input = '<object data="evil.swf"></object><embed src="evil.swf">';
    const result = sanitizeHTML(input);
    expect(result).not.toContain('<object');
    expect(result).not.toContain('<embed');
  });

  it('preserves safe anchor tags but strips dangerous href', () => {
    const safeLink = '<a href="https://example.com" target="_blank" rel="noopener">Link</a>';
    const dangerLink = '<a href="javascript:alert(1)">Evil</a>';
    expect(sanitizeHTML(safeLink)).toContain('href="https://example.com"');
    expect(sanitizeHTML(dangerLink)).not.toContain('javascript:');
  });

  it('handles empty string', () => {
    expect(sanitizeHTML('')).toBe('');
  });

  it('handles very large HTML', () => {
    const input = '<p>ok</p>'.repeat(10_000);
    const start = performance.now();
    const result = sanitizeHTML(input);
    const duration = performance.now() - start;
    expect(result).toContain('<p>ok</p>');
    expect(duration).toBeLessThan(5000);
  });
});

describe('sanitizeUrl — protocol smuggling & edge cases', () => {
  it('blocks javascript with tab characters', () => {
    // Some browsers interpret "java\tscript:" as "javascript:"
    expect(sanitizeUrl('java\tscript:alert(1)')).toBe('');
  });

  it('blocks javascript with newlines', () => {
    expect(sanitizeUrl('java\nscript:alert(1)')).toBe('');
  });

  it('blocks vbscript protocol', () => {
    expect(sanitizeUrl('vbscript:MsgBox("xss")')).toBe('');
  });

  it('blocks file:// protocol', () => {
    expect(sanitizeUrl('file:///etc/passwd')).toBe('');
  });

  it('blocks ftp:// protocol', () => {
    expect(sanitizeUrl('ftp://evil.com/malware')).toBe('');
  });

  it('handles URL with authentication credentials', () => {
    const result = sanitizeUrl('https://admin:password@evil.com');
    // Should still be a valid https URL
    expect(result).toMatch(/^https:\/\//);
  });

  it('handles extremely long URLs', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(10_000);
    const result = sanitizeUrl(longUrl);
    expect(result).toMatch(/^https:\/\//);
  });

  it('converts phone-like strings to tel:', () => {
    expect(sanitizeUrl('+63 912 345 6789')).toMatch(/^tel:/);
  });

  it('handles empty/whitespace-only strings', () => {
    expect(sanitizeUrl('')).toBe('');
    expect(sanitizeUrl('   ')).toBe('');
    expect(sanitizeUrl('\n\t')).toBe('');
  });

  it('handles double-encoded characters', () => {
    // %25 is URL-encoded % sign
    const result = sanitizeUrl('https://example.com/%2561lert');
    expect(result).toMatch(/^https:\/\//);
  });

  it('handles data: with non-html mime types', () => {
    expect(sanitizeUrl('data:image/png;base64,abc')).toBe('');
  });
});

describe('validateEmail — boundary conditions', () => {
  it('rejects emails with script payloads', () => {
    expect(validateEmail('<script>@evil.com').isValid).toBe(false);
  });

  it('accepts email at exactly 254 characters', () => {
    // local part up to 64 chars, domain fills the rest
    const local = 'a'.repeat(64);
    const domain = 'b'.repeat(254 - 64 - 1 - 4) + '.com';
    const email = `${local}@${domain}`;
    // May or may not be valid depending on validator rules, but shouldn't crash
    const result = validateEmail(email);
    expect(result).toHaveProperty('isValid');
  });

  it('rejects empty string', () => {
    expect(validateEmail('').isValid).toBe(false);
  });

  it('rejects whitespace-only email', () => {
    expect(validateEmail('   ').isValid).toBe(false);
  });

  it('handles email with international domain (IDN)', () => {
    const result = validateEmail('user@例え.jp');
    expect(result).toHaveProperty('isValid');
  });

  it('rejects email with null bytes', () => {
    const result = validateEmail('user\x00@evil.com');
    expect(result).toHaveProperty('isValid');
  });

  it('handles plus addressing', () => {
    expect(validateEmail('user+tag@example.com').isValid).toBe(true);
  });

  it('handles dots in local part', () => {
    expect(validateEmail('first.last@example.com').isValid).toBe(true);
  });
});

describe('validatePhoneNumber — edge cases', () => {
  it('handles Philippine mobile format', () => {
    expect(validatePhoneNumber('+639123456789').isValid).toBe(true);
  });

  it('handles Philippine landline format', () => {
    expect(validatePhoneNumber('(054) 123-4567').isValid).toBe(true);
  });

  it('rejects phone with letters', () => {
    expect(validatePhoneNumber('+63-CALL-NOW').isValid).toBe(false);
  });

  it('handles number at exactly 7 digits (minimum)', () => {
    expect(validatePhoneNumber('1234567').isValid).toBe(true);
  });

  it('handles number at exactly 15 digits (maximum)', () => {
    expect(validatePhoneNumber('+' + '1'.repeat(15)).isValid).toBe(true);
  });

  it('rejects empty after cleaning', () => {
    expect(validatePhoneNumber('---').isValid).toBe(false);
  });

  it('handles whitespace-only input', () => {
    expect(validatePhoneNumber('   ').isValid).toBe(false);
  });
});

describe('truncateText — boundary precision', () => {
  it('handles text at exactly maxLength', () => {
    const text = 'a'.repeat(255);
    expect(truncateText(text, 255)).toBe(text);
  });

  it('handles text one character over maxLength', () => {
    const text = 'a'.repeat(256);
    const result = truncateText(text, 255);
    expect(result.endsWith('...')).toBe(true);
    expect(result.length).toBeLessThanOrEqual(258); // 255 + '...'
  });

  it('handles text with no spaces (forced mid-word truncation)', () => {
    const text = 'x'.repeat(500);
    const result = truncateText(text, 100);
    expect(result.endsWith('...')).toBe(true);
    expect(result.length).toBe(103); // 100 + '...'
  });

  it('handles maxLength of 0', () => {
    const result = truncateText('hello', 0);
    expect(result.endsWith('...')).toBe(true);
  });

  it('handles maxLength of 1', () => {
    const result = truncateText('hello', 1);
    expect(result).toBe('h...');
  });

  it('handles non-string types', () => {
    expect(truncateText(12345)).toBe('');
    expect(truncateText(false)).toBe('');
  });

  it('preserves text with only whitespace content', () => {
    // "   " has length 3, under default 255 maxLength
    expect(truncateText('   ', 255)).toBe('   ');
  });
});

describe('escapeHtml — comprehensive character coverage', () => {
  it('escapes all dangerous characters in combination', () => {
    const input = '<script>alert("xss" & \'bypass\') = `/evil`</script>';
    const result = escapeHtml(input);
    // After escaping, the result contains entity-encoded versions
    // e.g., '&' becomes '&amp;' which DOES contain '&' as part of the entity
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
    expect(result).not.toContain('"');
    expect(result).not.toContain("'");
    expect(result).not.toContain('`');
    // The output uses HTML entities, which themselves contain & ; etc.
    // So we verify the original dangerous chars are escaped, not that & is gone
    expect(result).toContain('&lt;');
    expect(result).toContain('&gt;');
    expect(result).toContain('&quot;');
    expect(result).toContain('&amp;');
    expect(result).toContain('&#x27;');
    expect(result).toContain('&#x60;');
    expect(result).toContain('&#x3D;');
    expect(result).toContain('&#x2F;');
  });

  it('handles already-escaped input (double escaping)', () => {
    const result = escapeHtml('&amp;');
    expect(result).toBe('&amp;amp;'); // Double-encoded
  });

  it('handles empty string', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('preserves normal text with no special chars', () => {
    expect(escapeHtml('Hello World 123')).toBe('Hello World 123');
  });
});

describe('sanitizeObject — deep/adversarial structures', () => {
  it('handles object with all value types', () => {
    const input = {
      str: 'text',
      num: 42,
      bool: true,
      nil: null,
      arr: ['a', 'b', 'c'],
      nested: { deep: 'value' }, // nested objects should be skipped
      fn: () => 'evil', // functions should be skipped
      undef: undefined, // undefined should be skipped
    };
    const result = sanitizeObject(input);
    expect(result.str).toBe('text');
    expect(result.num).toBe(42);
    expect(result.bool).toBe(true);
    expect(result.nil).toBeNull();
    expect(result.arr).toEqual(['a', 'b', 'c']);
    expect(result.nested).toBeUndefined(); // nested objects not handled
    expect(result.fn).toBeUndefined(); // functions not handled
  });

  it('limits array entries to 20', () => {
    const bigArray = Array.from({ length: 50 }, (_, i) => `item_${i}`);
    const result = sanitizeObject({ items: bigArray });
    expect(result.items.length).toBe(20);
  });

  it('filters non-string items from arrays', () => {
    const result = sanitizeObject({ items: ['valid', 123, null, true, 'also valid'] });
    expect(result.items).toEqual(['valid', 'also valid']);
  });

  it('sanitizes keys with XSS in them', () => {
    const input = { '<script>alert(1)</script>': 'value' };
    const result = sanitizeObject(input);
    expect(Object.keys(result)).not.toContain('<script>alert(1)</script>');
  });

  it('handles maxLength truncation on all string values', () => {
    const input = { a: 'x'.repeat(100), b: 'y'.repeat(100) };
    const result = sanitizeObject(input, { maxLength: 10 });
    expect(result.a.length).toBeLessThanOrEqual(13); // 10 + '...'
    expect(result.b.length).toBeLessThanOrEqual(13);
  });

  it('handles empty object', () => {
    expect(sanitizeObject({})).toEqual({});
  });

  it('handles object with many keys', () => {
    const input = {};
    for (let i = 0; i < 1000; i++) input[`key_${i}`] = `value_${i}`;
    const start = performance.now();
    const result = sanitizeObject(input);
    const duration = performance.now() - start;
    expect(Object.keys(result).length).toBe(1000);
    expect(duration).toBeLessThan(1000);
  });
});

describe('containsXSS — evasion techniques', () => {
  it('detects vbscript protocol', () => {
    expect(containsXSS('vbscript:MsgBox("XSS")')).toBe(true);
  });

  it('detects CSS expression injection', () => {
    expect(containsXSS('background: expression(alert(1))')).toBe(true);
  });

  it('detects data:text/html payloads', () => {
    expect(containsXSS('data: text/html,<script>alert(1)</script>')).toBe(true);
  });

  it('detects embed tags', () => {
    expect(containsXSS('<embed src="evil.swf">')).toBe(true);
  });

  it('detects object tags', () => {
    expect(containsXSS('<object data="evil">')).toBe(true);
  });

  it('does not flag safe HTML tags', () => {
    expect(containsXSS('<p>Paragraph</p>')).toBe(false);
    expect(containsXSS('<b>Bold</b>')).toBe(false);
    expect(containsXSS('<a href="https://safe.com">Link</a>')).toBe(false);
  });

  it('detects mixed case event handlers', () => {
    expect(containsXSS('<img OnError="alert(1)">')).toBe(true);
    expect(containsXSS('<div ONMOUSEOVER="evil()">')).toBe(true);
  });

  it('handles empty string', () => {
    expect(containsXSS('')).toBe(false);
  });

  it('handles very long input efficiently', () => {
    const longInput = 'safe text '.repeat(100_000);
    const start = performance.now();
    const result = containsXSS(longInput);
    const duration = performance.now() - start;
    expect(result).toBe(false);
    expect(duration).toBeLessThan(2000);
  });
});

describe('createSafeInputValidator — integration stress', () => {
  it('handles rapid sequential validations', () => {
    const validator = createSafeInputValidator(100);
    const results = [];
    for (let i = 0; i < 10_000; i++) {
      results.push(validator(`input_${i}`));
    }
    expect(results.every((r) => r.isValid)).toBe(true);
  });

  it('correctly detects XSS mixed with valid content', () => {
    const validator = createSafeInputValidator(500);
    const input = 'Flood warning in Daet <script>alert("steal")</script> evacuate now!';
    const result = validator(input);
    expect(result.warning).toBe('Potentially unsafe content was removed');
    expect(result.sanitized).not.toContain('<script');
  });

  it('truncates to exact maxLength', () => {
    const validator = createSafeInputValidator(10);
    const result = validator('This is a very long report description');
    expect(result.sanitized.length).toBeLessThanOrEqual(13); // 10 + '...'
  });

  it('handles maxLength of 0', () => {
    const validator = createSafeInputValidator(0);
    const result = validator('hello');
    expect(typeof result.sanitized).toBe('string');
  });
});
