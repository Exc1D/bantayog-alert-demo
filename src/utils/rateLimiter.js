/**
 * Client-side Rate Limiter using localStorage
 * 
 * IMPORTANT: This is client-side rate limiting only and can be bypassed.
 * Server-side rate limiting should be implemented via Firebase Functions
 * or Cloud Firestore security rules with timestamp validation.
 * 
 * @see https://firebase.google.com/docs/firestore/security/rules-conditions
 */

const STORAGE_KEY = 'rate_limit_history';

export const RATE_LIMIT_CONFIG = {
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

function cleanExpiredEntries(actionType) {
  const history = getHistory();
  const config = RATE_LIMIT_CONFIG[actionType];
  
  if (!config || !history[actionType]) return;
  
  const now = Date.now();
  const windowStart = now - config.windowMs;
  
  history[actionType] = history[actionType].filter(
    timestamp => timestamp > windowStart
  );
  
  setHistory(history);
}

export function checkLimit(actionType) {
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
    currentAttempts: attempts.length
  };
}

export function recordAction(actionType) {
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

export function getRemainingAttempts(actionType) {
  return checkLimit(actionType).remaining;
}

export function getResetTime(actionType) {
  return checkLimit(actionType).resetTime;
}

export function clearHistory(actionType = null) {
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

export function formatResetTime(ms) {
  if (ms <= 0) return 'now';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 
      ? `${hours}h ${remainingMinutes}m` 
      : `${hours}h`;
  }
  
  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 
      ? `${minutes}m ${remainingSeconds}s` 
      : `${minutes}m`;
  }
  
  return `${seconds}s`;
}

export function getRateLimitMessage(actionType) {
  const status = checkLimit(actionType);
  const config = RATE_LIMIT_CONFIG[actionType];
  
  if (!config) {
    return '';
  }
  
  if (status.remaining === 0) {
    return `Rate limit reached. Please wait ${formatResetTime(status.resetTime)} before submitting again.`;
  }
  
  if (status.remaining <= 3) {
    return `Warning: Only ${status.remaining} attempts remaining. Limit resets in ${formatResetTime(status.resetTime)}.`;
  }
  
  return `${status.remaining}/${config.maxAttempts} attempts remaining.`;
}
