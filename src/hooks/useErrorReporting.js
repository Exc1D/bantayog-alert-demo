import { useCallback } from 'react';
import { captureException, captureMessage, addBreadcrumb, setContext } from '../utils/sentry';

export function useErrorReporting() {
  const reportError = useCallback((error, context = {}) => {
    const { component, action, metadata, tags, user } = context;

    addBreadcrumb('error', `Error in ${component || 'unknown'}: ${action || 'unknown action'}`, 'error', {
      errorMessage: error?.message,
      ...metadata,
    });

    return captureException(error, {
      tags: {
        component,
        action,
        ...tags,
      },
      extra: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
      user,
    });
  }, []);

  const reportMessage = useCallback((message, level = 'info', context = {}) => {
    const { component, action, metadata, tags } = context;

    if (component || action) {
      addBreadcrumb('message', `${component || ''}: ${action || ''}`, level, metadata);
    }

    return captureMessage(message, level, {
      tags: {
        component,
        action,
        ...tags,
      },
      extra: metadata,
    });
  }, []);

  const logUserAction = useCallback((action, details = {}) => {
    addBreadcrumb('user-action', action, 'info', {
      ...details,
      timestamp: new Date().toISOString(),
    });
  }, []);

  const logNavigation = useCallback((from, to, details = {}) => {
    addBreadcrumb('navigation', `${from} -> ${to}`, 'info', {
      from,
      to,
      ...details,
    });
  }, []);

  const logApiCall = useCallback((endpoint, method, status, duration, details = {}) => {
    const level = status >= 400 ? 'error' : 'info';
    
    addBreadcrumb('api', `${method.toUpperCase()} ${endpoint}`, level, {
      method,
      endpoint,
      status,
      duration: `${duration}ms`,
      ...details,
    });

    if (status >= 500) {
      reportMessage(`API error: ${method.toUpperCase()} ${endpoint} returned ${status}`, 'error', {
        component: 'api',
        action: method,
        metadata: { endpoint, status, duration, ...details },
      });
    }
  }, [reportMessage]);

  const setComponentContext = useCallback((name, data) => {
    setContext(name, data);
  }, []);

  return {
    reportError,
    reportMessage,
    logUserAction,
    logNavigation,
    logApiCall,
    setComponentContext,
  };
}

export default useErrorReporting;
