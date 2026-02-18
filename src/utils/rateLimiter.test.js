import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const STORAGE_KEY = 'rate_limit_history';

const RATE_LIMIT_CONFIG = {
  report_submission: { maxAttempts: 10, windowMs: 60 * 60 * 1000 },
  report_update: { maxAttempts: 20, windowMs: 60 * 60 * 1000 },
  image_upload: { maxAttempts: 30, windowMs: 60 * 60 * 1000 },
  comment: { maxAttempts: 50, windowMs: 60 * 60 * 1000 },
  api_call: { maxAttempts: 100, windowMs: 60 * 1000 },
};

function getHistory() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function setHistory(history) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    console.warn('Rate limiter: Failed to persist to localStorage', e);
  }
}

function cleanExpiredEntries(actionType) {
  const history = getHistory();
  const config = RATE_LIMIT_CONFIG[actionType];

  if (!config || !history[actionType]) return;

  const now = Date.now();
  const windowStart = now - config.windowMs;

  history[actionType] = history[actionType].filter((timestamp) => timestamp > windowStart);

  setHistory(history);
}

function checkLimit(actionType) {
  const config = RATE_LIMIT_CONFIG[actionType];

  if (!config) {
    console.warn(`Rate limiter: Unknown action type "${actionType}"`);
    return { allowed: true, remaining: Infinity, resetTime: 0 };
  }

  cleanExpiredEntries(actionType);

  const history = getHistory();
  const attempts = history[actionType] || [];
  const remaining = Math.max(0, config.maxAttempts - attempts.length);

  let resetTime = 0;
  if (attempts.length > 0) {
    const oldestAttempt = Math.min(...attempts);
    resetTime = Math.max(0, oldestAttempt + config.windowMs - Date.now());
  }

  return {
    allowed: attempts.length < config.maxAttempts,
    remaining,
    resetTime,
    maxAttempts: config.maxAttempts,
    currentAttempts: attempts.length,
  };
}

function recordAction(actionType) {
  const config = RATE_LIMIT_CONFIG[actionType];

  if (!config) {
    console.warn(`Rate limiter: Unknown action type "${actionType}"`);
    return false;
  }

  const status = checkLimit(actionType);

  if (!status.allowed) {
    return false;
  }

  const history = getHistory();

  if (!history[actionType]) {
    history[actionType] = [];
  }

  history[actionType].push(Date.now());
  setHistory(history);

  return true;
}

function getRemainingAttempts(actionType) {
  return checkLimit(actionType).remaining;
}

function getResetTime(actionType) {
  return checkLimit(actionType).resetTime;
}

function clearHistory(actionType = null) {
  if (actionType) {
    const history = getHistory();
    delete history[actionType];
    setHistory(history);
  } else {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Rate limiter: Failed to clear localStorage', e);
    }
  }
}

function formatResetTime(ms) {
  if (ms <= 0) return 'now';

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }

  return `${seconds}s`;
}

const mockLocalStorage = (() => {
  let store = {};
  return {
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
    getStore: () => store,
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('rateLimiter', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockLocalStorage.clear();
  });

  describe('checkLimit', () => {
    it('returns allowed status for new action type', () => {
      const result = checkLimit('report_submission');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(10);
      expect(result.currentAttempts).toBe(0);
      expect(result.maxAttempts).toBe(10);
    });

    it('returns correct remaining attempts after actions recorded', () => {
      recordAction('report_submission');
      recordAction('report_submission');
      recordAction('report_submission');

      const result = checkLimit('report_submission');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(7);
      expect(result.currentAttempts).toBe(3);
    });

    it('returns not allowed when limit reached', () => {
      for (let i = 0; i < 10; i++) {
        recordAction('report_submission');
      }

      const result = checkLimit('report_submission');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('returns allowed for unknown action types', () => {
      const result = checkLimit('unknown_action');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(Infinity);
    });

    it('calculates reset time correctly', () => {
      recordAction('api_call');

      const result = checkLimit('api_call');

      expect(result.resetTime).toBeGreaterThan(0);
      expect(result.resetTime).toBeLessThanOrEqual(60000);
    });
  });

  describe('recordAction', () => {
    it('returns true and records action when allowed', () => {
      const result = recordAction('report_submission');

      expect(result).toBe(true);

      const status = checkLimit('report_submission');
      expect(status.currentAttempts).toBe(1);
    });

    it('returns false when rate limited', () => {
      for (let i = 0; i < 10; i++) {
        recordAction('report_submission');
      }

      const result = recordAction('report_submission');

      expect(result).toBe(false);
    });

    it('returns false for unknown action types', () => {
      const result = recordAction('unknown_action');

      expect(result).toBe(false);
    });
  });

  describe('getRemainingAttempts', () => {
    it('returns max attempts for new action', () => {
      const remaining = getRemainingAttempts('report_submission');

      expect(remaining).toBe(10);
    });

    it('decrements after actions recorded', () => {
      recordAction('report_submission');
      recordAction('report_submission');

      const remaining = getRemainingAttempts('report_submission');

      expect(remaining).toBe(8);
    });
  });

  describe('getResetTime', () => {
    it('returns 0 for actions with no history', () => {
      const resetTime = getResetTime('report_submission');

      expect(resetTime).toBe(0);
    });

    it('returns positive value for actions with history', () => {
      recordAction('report_submission');

      const resetTime = getResetTime('report_submission');

      expect(resetTime).toBeGreaterThan(0);
    });
  });

  describe('clearHistory', () => {
    it('clears specific action type history', () => {
      recordAction('report_submission');
      recordAction('comment');

      clearHistory('report_submission');

      expect(getRemainingAttempts('report_submission')).toBe(10);
      expect(getRemainingAttempts('comment')).toBe(49);
    });

    it('clears all history when no action type provided', () => {
      recordAction('report_submission');
      recordAction('comment');
      recordAction('image_upload');

      clearHistory();

      expect(getRemainingAttempts('report_submission')).toBe(10);
      expect(getRemainingAttempts('comment')).toBe(50);
      expect(getRemainingAttempts('image_upload')).toBe(30);
    });
  });

  describe('formatResetTime', () => {
    it('returns "now" for zero or negative values', () => {
      expect(formatResetTime(0)).toBe('now');
      expect(formatResetTime(-100)).toBe('now');
    });

    it('formats seconds correctly', () => {
      expect(formatResetTime(5000)).toBe('5s');
      expect(formatResetTime(30000)).toBe('30s');
    });

    it('formats minutes correctly', () => {
      expect(formatResetTime(60000)).toBe('1m');
      expect(formatResetTime(90000)).toBe('1m 30s');
      expect(formatResetTime(180000)).toBe('3m');
    });

    it('formats hours correctly', () => {
      expect(formatResetTime(3600000)).toBe('1h');
      expect(formatResetTime(5400000)).toBe('1h 30m');
      expect(formatResetTime(7200000)).toBe('2h');
    });
  });

  describe('cleanExpiredEntries', () => {
    it('removes expired entries from history', () => {
      const now = Date.now();
      const oldTimestamp = now - 70000;

      mockLocalStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          api_call: [oldTimestamp, now - 30000],
        })
      );

      cleanExpiredEntries('api_call');

      const history = getHistory();
      expect(history.api_call.length).toBe(1);
    });
  });

  describe('different action types have independent limits', () => {
    it('tracks report_submission independently', () => {
      for (let i = 0; i < 10; i++) {
        recordAction('report_submission');
      }

      expect(checkLimit('report_submission').allowed).toBe(false);
      expect(checkLimit('comment').allowed).toBe(true);
    });

    it('uses correct limits for each action type', () => {
      expect(checkLimit('report_submission').maxAttempts).toBe(10);
      expect(checkLimit('report_update').maxAttempts).toBe(20);
      expect(checkLimit('image_upload').maxAttempts).toBe(30);
      expect(checkLimit('comment').maxAttempts).toBe(50);
      expect(checkLimit('api_call').maxAttempts).toBe(100);
    });
  });
});
