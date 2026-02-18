import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  checkLimit,
  recordAction,
  clearHistory,
  formatResetTime,
  RATE_LIMIT_CONFIG,
} from '../utils/rateLimiter';

/**
 * React hook for rate limiting actions
 *
 * IMPORTANT: This is client-side rate limiting only and can be bypassed.
 * Server-side rate limiting should be implemented via Firebase Functions
 * or Cloud Firestore security rules with timestamp validation.
 *
 * @param {string} actionType - The type of action to rate limit
 * @param {Object} options - Configuration options
 * @returns {Object} Rate limit state and methods
 */
export function useRateLimit(actionType, options = {}) {
  const { autoCleanup = true, cleanupInterval = 60000 } = options;

  const [status, setStatus] = useState(() => checkLimit(actionType));
  const mountedRef = useRef(false);

  const updateStatus = useCallback(() => {
    setStatus(checkLimit(actionType));
  }, [actionType]);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

    const config = RATE_LIMIT_CONFIG[actionType];
    if (config && status.resetTime > 0) {
      const timer = setTimeout(updateStatus, Math.min(status.resetTime, 1000));
      return () => clearTimeout(timer);
    }
  }, [actionType, status.resetTime, updateStatus]);

  useEffect(() => {
    if (!autoCleanup) return;

    const interval = setInterval(updateStatus, cleanupInterval);
    return () => clearInterval(interval);
  }, [autoCleanup, cleanupInterval, updateStatus]);

  const performAction = useCallback(
    (actionFn) => {
      const currentStatus = checkLimit(actionType);

      if (!currentStatus.allowed) {
        return {
          success: false,
          error: 'rate_limited',
          message: `Rate limit exceeded. Please wait ${formatResetTime(currentStatus.resetTime)}.`,
          resetTime: currentStatus.resetTime,
        };
      }

      const recorded = recordAction(actionType);

      if (!recorded) {
        return {
          success: false,
          error: 'rate_limited',
          message: 'Rate limit exceeded.',
          resetTime: 0,
        };
      }

      updateStatus();

      try {
        const result = actionFn();
        return { success: true, result };
      } catch (error) {
        return { success: false, error: 'action_failed', message: error.message };
      }
    },
    [actionType, updateStatus]
  );

  const reset = useCallback(() => {
    clearHistory(actionType);
    updateStatus();
  }, [actionType, updateStatus]);

  const message = useMemo(() => {
    if (status.remaining === 0) {
      return `Rate limit reached. Please wait ${formatResetTime(status.resetTime)} before trying again.`;
    }

    if (status.remaining <= 3 && status.remaining > 0) {
      return `Warning: Only ${status.remaining} attempt${status.remaining === 1 ? '' : 's'} remaining.`;
    }

    return null;
  }, [status.remaining, status.resetTime]);

  return {
    isAllowed: status.allowed,
    remainingAttempts: status.remaining,
    resetTime: status.resetTime,
    currentAttempts: status.currentAttempts,
    maxAttempts: status.maxAttempts,
    formattedResetTime: formatResetTime(status.resetTime),
    message,
    performAction,
    recordAction: () => {
      const recorded = recordAction(actionType);
      updateStatus();
      return recorded;
    },
    reset,
    refresh: updateStatus,
  };
}

export function useRateLimitMultiple(actionTypes) {
  const [statuses, setStatuses] = useState(() => {
    const initial = {};
    actionTypes.forEach((type) => {
      initial[type] = checkLimit(type);
    });
    return initial;
  });

  const updateStatuses = useCallback(() => {
    const newStatuses = {};
    actionTypes.forEach((type) => {
      newStatuses[type] = checkLimit(type);
    });
    setStatuses(newStatuses);
  }, [actionTypes]);

  useEffect(() => {
    const interval = setInterval(updateStatuses, 60000);
    return () => clearInterval(interval);
  }, [updateStatuses]);

  const recordActionForType = useCallback(
    (actionType) => {
      const result = recordAction(actionType);
      updateStatuses();
      return result;
    },
    [updateStatuses]
  );

  return {
    statuses,
    recordAction: recordActionForType,
    refresh: updateStatuses,
  };
}
