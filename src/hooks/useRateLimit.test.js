import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const STORAGE_KEY = 'rate_limit_history';

const RATE_LIMIT_CONFIG = {
  report_submission: { maxAttempts: 10, windowMs: 60 * 60 * 1000 },
  report_update: { maxAttempts: 20, windowMs: 60 * 60 * 1000 },
  image_upload: { maxAttempts: 30, windowMs: 60 * 60 * 1000 },
  comment: { maxAttempts: 50, windowMs: 60 * 60 * 1000 },
  api_call: { maxAttempts: 100, windowMs: 60 * 1000 }
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

function checkLimit(actionType) {
  const config = RATE_LIMIT_CONFIG[actionType];
  
  if (!config) {
    return { allowed: true, remaining: Infinity, resetTime: 0, maxAttempts: Infinity, currentAttempts: 0 };
  }
  
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
    currentAttempts: attempts.length
  };
}

function recordAction(actionType) {
  const config = RATE_LIMIT_CONFIG[actionType];
  if (!config) return false;
  
  const status = checkLimit(actionType);
  if (!status.allowed) return false;
  
  const history = getHistory();
  if (!history[actionType]) history[actionType] = [];
  history[actionType].push(Date.now());
  setHistory(history);
  return true;
}

function clearHistory(actionType = null) {
  if (actionType) {
    const history = getHistory();
    delete history[actionType];
    setHistory(history);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function formatResetTime(ms) {
  if (ms <= 0) return 'now';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

function useRateLimit(actionType, options = {}) {
  const { autoCleanup = true, cleanupInterval = 60000 } = options;
  
  const [status, setStatus] = React.useState(() => checkLimit(actionType));
  
  const updateStatus = React.useCallback(() => {
    setStatus(checkLimit(actionType));
  }, [actionType]);
  
  React.useEffect(() => {
    updateStatus();
  }, [actionType, updateStatus]);
  
  React.useEffect(() => {
    if (!autoCleanup) return;
    const interval = setInterval(updateStatus, cleanupInterval);
    return () => clearInterval(interval);
  }, [autoCleanup, cleanupInterval, updateStatus]);
  
  const message = React.useMemo(() => {
    if (status.remaining === 0) {
      return `Rate limit reached. Please wait before trying again.`;
    }
    if (status.remaining <= 3 && status.remaining > 0) {
      return `Warning: Only ${status.remaining} attempt${status.remaining === 1 ? '' : 's'} remaining.`;
    }
    return null;
  }, [status.remaining]);
  
  return {
    isAllowed: status.allowed,
    remainingAttempts: status.remaining,
    resetTime: status.resetTime,
    currentAttempts: status.currentAttempts,
    maxAttempts: status.maxAttempts,
    formattedResetTime: formatResetTime(status.resetTime),
    message,
    recordAction: () => {
      const recorded = recordAction(actionType);
      updateStatus();
      return recorded;
    },
    reset: () => {
      clearHistory(actionType);
      updateStatus();
    },
    refresh: updateStatus
  };
}

const React = await import('react');

const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value; }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    getStore: () => store
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('useRateLimit', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    mockLocalStorage.clear();
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('returns correct initial values for new action', () => {
      const { result } = renderHook(() => useRateLimit('report_submission'));
      
      expect(result.current.isAllowed).toBe(true);
      expect(result.current.remainingAttempts).toBe(10);
      expect(result.current.maxAttempts).toBe(10);
      expect(result.current.currentAttempts).toBe(0);
      expect(result.current.message).toBe(null);
    });

    it('returns Infinity for unknown action types', () => {
      const { result } = renderHook(() => useRateLimit('unknown_action'));
      
      expect(result.current.isAllowed).toBe(true);
      expect(result.current.remainingAttempts).toBe(Infinity);
    });
  });

  describe('recordAction', () => {
    it('records action and updates state', () => {
      const { result } = renderHook(() => useRateLimit('report_submission'));
      
      act(() => {
        result.current.recordAction();
      });
      
      expect(result.current.remainingAttempts).toBe(9);
      expect(result.current.currentAttempts).toBe(1);
    });

    it('returns false when rate limited', () => {
      const { result } = renderHook(() => useRateLimit('report_submission'));
      
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.recordAction();
        }
      });
      
      expect(result.current.isAllowed).toBe(false);
      
      let recorded;
      act(() => {
        recorded = result.current.recordAction();
      });
      
      expect(recorded).toBe(false);
    });
  });

  describe('reset', () => {
    it('clears history and resets state', () => {
      const { result } = renderHook(() => useRateLimit('report_submission'));
      
      act(() => {
        result.current.recordAction();
        result.current.recordAction();
        result.current.recordAction();
      });
      
      expect(result.current.currentAttempts).toBe(3);
      
      act(() => {
        result.current.reset();
      });
      
      expect(result.current.currentAttempts).toBe(0);
      expect(result.current.remainingAttempts).toBe(10);
    });
  });

  describe('refresh', () => {
    it('updates state from storage', () => {
      const { result } = renderHook(() => useRateLimit('report_submission'));
      
      mockLocalStorage.setItem(STORAGE_KEY, JSON.stringify({
        report_submission: [Date.now()]
      }));
      
      act(() => {
        result.current.refresh();
      });
      
      expect(result.current.currentAttempts).toBe(1);
    });
  });

  describe('message', () => {
    it('returns null when plenty of attempts remaining', () => {
      const { result } = renderHook(() => useRateLimit('report_submission'));
      
      expect(result.current.message).toBe(null);
    });

    it('returns warning when few attempts remaining', () => {
      mockLocalStorage.setItem(STORAGE_KEY, JSON.stringify({
        report_submission: Array(8).fill(Date.now())
      }));
      
      const { result } = renderHook(() => useRateLimit('report_submission'));
      
      expect(result.current.message).toContain('Warning');
      expect(result.current.message).toContain('2');
    });

    it('returns rate limited message when no attempts remaining', () => {
      mockLocalStorage.setItem(STORAGE_KEY, JSON.stringify({
        report_submission: Array(10).fill(Date.now())
      }));
      
      const { result } = renderHook(() => useRateLimit('report_submission'));
      
      expect(result.current.message).toContain('Rate limit reached');
    });
  });

  describe('formattedResetTime', () => {
    it('returns "now" when resetTime is 0', () => {
      const { result } = renderHook(() => useRateLimit('report_submission'));
      
      expect(result.current.formattedResetTime).toBe('now');
    });

    it('formats time correctly', () => {
      mockLocalStorage.setItem(STORAGE_KEY, JSON.stringify({
        api_call: [Date.now()]
      }));
      
      const { result } = renderHook(() => useRateLimit('api_call'));
      
      expect(result.current.formattedResetTime).toMatch(/\d+[ms]/);
    });
  });

  describe('options', () => {
    it('respects autoCleanup option', () => {
      const { result, unmount } = renderHook(() => 
        useRateLimit('report_submission', { autoCleanup: false })
      );
      
      act(() => {
        vi.advanceTimersByTime(120000);
      });
      
      expect(result.current.remainingAttempts).toBe(10);
      
      unmount();
    });

    it('respects cleanupInterval option', () => {
      const { result } = renderHook(() => 
        useRateLimit('report_submission', { cleanupInterval: 1000 })
      );
      
      mockLocalStorage.setItem(STORAGE_KEY, JSON.stringify({
        report_submission: [Date.now()]
      }));
      
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      
      expect(result.current.currentAttempts).toBe(1);
    });
  });

  describe('action type changes', () => {
    it('updates state when action type changes', () => {
      const { result, rerender } = renderHook(
        ({ actionType }) => useRateLimit(actionType),
        { initialProps: { actionType: 'report_submission' } }
      );
      
      expect(result.current.maxAttempts).toBe(10);
      
      rerender({ actionType: 'comment' });
      
      expect(result.current.maxAttempts).toBe(50);
    });
  });
});