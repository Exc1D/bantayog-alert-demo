/**
 * Stress tests for the rate limiter — boundary conditions, time manipulation,
 * storage corruption, and concurrency simulation.
 *
 * Uses the same mock localStorage pattern as the existing test to ensure
 * the module's localStorage calls work correctly.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Set up mock localStorage BEFORE importing the module
let store = {};

const mockLocalStorage = {
  getItem: vi.fn((key) => store[key] || null),
  setItem: vi.fn((key, value) => {
    store[key] = value;
  }),
  removeItem: vi.fn((key) => {
    delete store[key];
  }),
  clear: vi.fn(() => {
    store = {};
  }),
};

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

import {
  checkLimit,
  recordAction,
  getRemainingAttempts,
  getResetTime,
  clearHistory,
  formatResetTime,
  getRateLimitMessage,
  RATE_LIMIT_CONFIG,
} from './rateLimiter';

beforeEach(() => {
  // Reset store and restore default mock implementations
  store = {};
  mockLocalStorage.getItem.mockImplementation((key) => store[key] || null);
  mockLocalStorage.setItem.mockImplementation((key, value) => {
    store[key] = value;
  });
  mockLocalStorage.removeItem.mockImplementation((key) => {
    delete store[key];
  });
  mockLocalStorage.clear.mockImplementation(() => {
    store = {};
  });
});

describe('rate limiter — exhaustion boundary', () => {
  it('allows exactly maxAttempts for report_submission', () => {
    const max = RATE_LIMIT_CONFIG.report_submission.maxAttempts; // 10
    for (let i = 0; i < max; i++) {
      expect(recordAction('report_submission')).toBe(true);
    }
    // The 11th should fail
    expect(recordAction('report_submission')).toBe(false);
  });

  it('tracks remaining attempts accurately as they deplete', () => {
    const max = RATE_LIMIT_CONFIG.report_submission.maxAttempts;
    for (let i = 0; i < max; i++) {
      const remaining = getRemainingAttempts('report_submission');
      expect(remaining).toBe(max - i);
      recordAction('report_submission');
    }
    expect(getRemainingAttempts('report_submission')).toBe(0);
  });

  it('blocks all action types when exhausted', () => {
    for (const actionType of Object.keys(RATE_LIMIT_CONFIG)) {
      clearHistory(actionType);
      const max = RATE_LIMIT_CONFIG[actionType].maxAttempts;
      for (let i = 0; i < max; i++) {
        recordAction(actionType);
      }
      expect(checkLimit(actionType).allowed).toBe(false);
      expect(checkLimit(actionType).remaining).toBe(0);
    }
  });

  it('api_call limit is much higher than report_submission', () => {
    // Exhaust report_submission (10)
    for (let i = 0; i < 10; i++) {
      recordAction('report_submission');
    }
    expect(checkLimit('report_submission').allowed).toBe(false);

    // api_call (100) should still have plenty of room
    for (let i = 0; i < 50; i++) {
      expect(recordAction('api_call')).toBe(true);
    }
    expect(checkLimit('api_call').remaining).toBe(50);
  });
});

describe('rate limiter — time window behavior', () => {
  it('resets after window expires', () => {
    const max = RATE_LIMIT_CONFIG.report_submission.maxAttempts;
    const windowMs = RATE_LIMIT_CONFIG.report_submission.windowMs;

    // Exhaust the limit
    for (let i = 0; i < max; i++) {
      recordAction('report_submission');
    }
    expect(checkLimit('report_submission').allowed).toBe(false);

    // Advance time past the window
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + windowMs + 1);
    expect(checkLimit('report_submission').allowed).toBe(true);
  });

  it('partially resets as individual attempts expire', () => {
    const originalNow = Date.now();
    const windowMs = RATE_LIMIT_CONFIG.report_submission.windowMs;

    // Record 5 attempts at time T
    vi.spyOn(Date, 'now').mockReturnValue(originalNow);
    for (let i = 0; i < 5; i++) {
      recordAction('report_submission');
    }

    // Record 5 more at time T + window/2
    vi.spyOn(Date, 'now').mockReturnValue(originalNow + windowMs / 2);
    for (let i = 0; i < 5; i++) {
      recordAction('report_submission');
    }

    // At T + window + 1, first 5 should have expired
    vi.spyOn(Date, 'now').mockReturnValue(originalNow + windowMs + 1);
    const status = checkLimit('report_submission');
    expect(status.allowed).toBe(true);
    expect(status.remaining).toBe(5);
  });

  it('provides accurate reset time', () => {
    recordAction('report_submission');
    const resetTime = getResetTime('report_submission');
    const windowMs = RATE_LIMIT_CONFIG.report_submission.windowMs;
    expect(resetTime).toBeGreaterThan(0);
    expect(resetTime).toBeLessThanOrEqual(windowMs);
  });

  it('api_call has 1-minute window vs report_submission 1-hour window', () => {
    const apiWindow = RATE_LIMIT_CONFIG.api_call.windowMs;
    const reportWindow = RATE_LIMIT_CONFIG.report_submission.windowMs;
    expect(apiWindow).toBe(60 * 1000); // 1 minute
    expect(reportWindow).toBe(60 * 60 * 1000); // 1 hour
    expect(reportWindow / apiWindow).toBe(60);
  });
});

describe('rate limiter — localStorage corruption', () => {
  it('handles corrupted JSON in localStorage', () => {
    mockLocalStorage.setItem('rate_limit_history', 'NOT VALID JSON {{{');
    expect(() => checkLimit('report_submission')).not.toThrow();
    expect(checkLimit('report_submission').allowed).toBe(true);
  });

  it('handles localStorage.setItem throwing (QuotaExceeded)', () => {
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });

    // recordAction calls setItem internally — should not throw
    expect(() => recordAction('report_submission')).not.toThrow();
  });

  it('handles localStorage.getItem throwing (SecurityError)', () => {
    mockLocalStorage.getItem.mockImplementation(() => {
      throw new Error('SecurityError');
    });

    expect(() => checkLimit('report_submission')).not.toThrow();
    expect(checkLimit('report_submission').allowed).toBe(true);
  });

  it('handles history with unexpected data types gracefully', () => {
    mockLocalStorage.setItem(
      'rate_limit_history',
      JSON.stringify({ report_submission: 'not an array' })
    );
    expect(() => checkLimit('report_submission')).not.toThrow();
    expect(checkLimit('report_submission').allowed).toBe(true);
  });

  it('handles history with non-number timestamps', () => {
    mockLocalStorage.setItem(
      'rate_limit_history',
      JSON.stringify({ report_submission: ['not', 'numbers', null] })
    );
    expect(() => checkLimit('report_submission')).not.toThrow();
  });

  it('handles null stored value', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    expect(checkLimit('report_submission').allowed).toBe(true);
    expect(checkLimit('report_submission').remaining).toBe(10);
  });

  it('handles empty object in storage', () => {
    mockLocalStorage.setItem('rate_limit_history', JSON.stringify({}));
    expect(checkLimit('report_submission').allowed).toBe(true);
  });
});

describe('rate limiter — concurrent action types', () => {
  it('tracks different action types independently', () => {
    const reportMax = RATE_LIMIT_CONFIG.report_submission.maxAttempts;
    for (let i = 0; i < reportMax; i++) {
      recordAction('report_submission');
    }

    expect(checkLimit('image_upload').allowed).toBe(true);
    expect(checkLimit('comment').allowed).toBe(true);
    expect(checkLimit('api_call').allowed).toBe(true);
    expect(checkLimit('report_submission').allowed).toBe(false);
  });

  it('clearing one type does not affect others', () => {
    recordAction('report_submission');
    recordAction('image_upload');

    clearHistory('report_submission');

    expect(getRemainingAttempts('report_submission')).toBe(
      RATE_LIMIT_CONFIG.report_submission.maxAttempts
    );
    expect(getRemainingAttempts('image_upload')).toBe(
      RATE_LIMIT_CONFIG.image_upload.maxAttempts - 1
    );
  });

  it('clearHistory() with no args clears everything', () => {
    recordAction('report_submission');
    recordAction('image_upload');
    recordAction('comment');

    clearHistory();

    expect(getRemainingAttempts('report_submission')).toBe(
      RATE_LIMIT_CONFIG.report_submission.maxAttempts
    );
    expect(getRemainingAttempts('image_upload')).toBe(RATE_LIMIT_CONFIG.image_upload.maxAttempts);
    expect(getRemainingAttempts('comment')).toBe(RATE_LIMIT_CONFIG.comment.maxAttempts);
  });

  it('exhausting all types simultaneously', () => {
    for (const actionType of Object.keys(RATE_LIMIT_CONFIG)) {
      const max = RATE_LIMIT_CONFIG[actionType].maxAttempts;
      for (let i = 0; i < max; i++) {
        recordAction(actionType);
      }
    }

    // All should be blocked
    for (const actionType of Object.keys(RATE_LIMIT_CONFIG)) {
      expect(checkLimit(actionType).allowed).toBe(false);
    }

    // Clear all
    clearHistory();

    // All should be available again
    for (const actionType of Object.keys(RATE_LIMIT_CONFIG)) {
      expect(checkLimit(actionType).allowed).toBe(true);
    }
  });
});

describe('formatResetTime — edge cases', () => {
  it('handles zero ms', () => {
    expect(formatResetTime(0)).toBe('now');
  });

  it('handles negative ms', () => {
    expect(formatResetTime(-1000)).toBe('now');
  });

  it('formats seconds only', () => {
    expect(formatResetTime(30_000)).toBe('30s');
  });

  it('formats minutes and seconds', () => {
    expect(formatResetTime(90_000)).toBe('1m 30s');
  });

  it('formats exact minutes', () => {
    expect(formatResetTime(120_000)).toBe('2m');
  });

  it('formats hours and minutes', () => {
    expect(formatResetTime(3_660_000)).toBe('1h 1m');
  });

  it('formats exact hours', () => {
    expect(formatResetTime(3_600_000)).toBe('1h');
  });

  it('formats large durations', () => {
    expect(formatResetTime(86_400_000)).toBe('24h');
  });

  it('handles 1 millisecond', () => {
    expect(formatResetTime(1)).toBe('0s');
  });

  it('handles 999 milliseconds', () => {
    expect(formatResetTime(999)).toBe('0s');
  });

  it('handles exactly 1 second', () => {
    expect(formatResetTime(1000)).toBe('1s');
  });
});

describe('getRateLimitMessage — user-facing messages', () => {
  it('returns empty for unknown action type', () => {
    expect(getRateLimitMessage('nonexistent')).toBe('');
  });

  it('shows remaining count when plenty available', () => {
    const msg = getRateLimitMessage('report_submission');
    expect(msg).toContain('10/10');
  });

  it('shows warning when 3 or fewer remaining', () => {
    const max = RATE_LIMIT_CONFIG.report_submission.maxAttempts;
    for (let i = 0; i < max - 2; i++) {
      recordAction('report_submission');
    }
    const msg = getRateLimitMessage('report_submission');
    expect(msg).toContain('Warning');
    expect(msg).toContain('2');
  });

  it('shows rate limit reached when exhausted', () => {
    const max = RATE_LIMIT_CONFIG.report_submission.maxAttempts;
    for (let i = 0; i < max; i++) {
      recordAction('report_submission');
    }
    const msg = getRateLimitMessage('report_submission');
    expect(msg).toContain('Rate limit reached');
  });

  it('shows exactly 1 remaining warning', () => {
    const max = RATE_LIMIT_CONFIG.report_submission.maxAttempts;
    for (let i = 0; i < max - 1; i++) {
      recordAction('report_submission');
    }
    const msg = getRateLimitMessage('report_submission');
    expect(msg).toContain('Warning');
    expect(msg).toContain('1');
  });
});
