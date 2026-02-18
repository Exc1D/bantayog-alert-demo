import { useCallback, useEffect, useRef } from 'react';
import { addBreadcrumb, sentryConfig } from '../utils/sentry';
import * as Sentry from '@sentry/react';

export function usePerformanceMonitoring() {
  const activeSpans = useRef(new Map());

  const startSpan = useCallback((name, op = 'custom', attributes = {}) => {
    if (!sentryConfig.enabled) {
      return {
        finish: () => {},
        setStatus: () => {},
        setData: () => {},
      };
    }

    const activeSpan = Sentry.getActiveSpan();
    let span;

    if (activeSpan) {
      span = activeSpan.startChild({ op, description: name, data: attributes });
    } else {
      const transaction = Sentry.startInactiveTransaction({ name, op });
      span = transaction.startChild({ op, description: name, data: attributes });
    }

    activeSpans.current.set(name, span);

    addBreadcrumb('performance', `Started: ${name}`, 'info', { operation: op });

    return {
      finish: () => {
        span.finish();
        activeSpans.current.delete(name);
      },
      setStatus: (status) => span.setStatus(status),
      setData: (key, value) => span.setData(key, value),
    };
  }, []);

  const endSpan = useCallback((name, status = 'ok') => {
    const span = activeSpans.current.get(name);
    if (span) {
      span.setStatus(status);
      span.finish();
      activeSpans.current.delete(name);
      addBreadcrumb('performance', `Completed: ${name}`, 'info', { status });
    }
  }, []);

  const measureAsync = useCallback(
    async (name, fn, op = 'custom') => {
      const span = startSpan(name, op);
      const startTime = performance.now();

      try {
        const result = await fn();
        const duration = performance.now() - startTime;
        span.setData('duration', duration);
        span.setStatus('ok');
        span.finish();
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        span.setData('duration', duration);
        span.setData('error', error.message);
        span.setStatus('internal_error');
        span.finish();
        throw error;
      }
    },
    [startSpan]
  );

  const measureSync = useCallback(
    (name, fn, op = 'custom') => {
      const span = startSpan(name, op);
      const startTime = performance.now();

      try {
        const result = fn();
        const duration = performance.now() - startTime;
        span.setData('duration', duration);
        span.setStatus('ok');
        span.finish();
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        span.setData('duration', duration);
        span.setData('error', error.message);
        span.setStatus('internal_error');
        span.finish();
        throw error;
      }
    },
    [startSpan]
  );

  const trackWebVitals = useCallback(() => {
    if (!sentryConfig.enabled || typeof window === 'undefined') return;

    const sendToSentry = (metric) => {
      const { name, value } = metric;

      Sentry.setMeasurement(name.toLowerCase(), value, 'millisecond');

      addBreadcrumb('web-vitals', `${name}: ${value.toFixed(2)}ms`, 'info', {
        metric: name,
        value,
      });
    };

    if (window.webVitals) {
      window.webVitals.getCLS(sendToSentry);
      window.webVitals.getFID(sendToSentry);
      window.webVitals.getLCP(sendToSentry);
      window.webVitals.getFCP(sendToSentry);
      window.webVitals.getTTFB(sendToSentry);
    }
  }, []);

  const trackComponentRender = useCallback((componentName) => {
    if (!sentryConfig.enabled) return;

    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      addBreadcrumb('render', `${componentName} rendered`, 'info', {
        duration: `${duration.toFixed(2)}ms`,
      });
    };
  }, []);

  return {
    startSpan,
    endSpan,
    measureAsync,
    measureSync,
    trackWebVitals,
    trackComponentRender,
  };
}

export function useTrackRender(componentName) {
  const { trackComponentRender } = usePerformanceMonitoring();
  const endTracking = useRef(null);

  useEffect(() => {
    endTracking.current = trackComponentRender(componentName);

    return () => {
      endTracking.current?.();
    };
  }, [componentName, trackComponentRender]);
}

export function useTrackAsyncOperation(operationName) {
  const { measureAsync } = usePerformanceMonitoring();
  const operationRef = useRef(measureAsync);

  useEffect(() => {
    operationRef.current = measureAsync;
  }, [measureAsync]);

  return useCallback(
    async (fn) => {
      return operationRef.current(operationName, fn);
    },
    [operationName]
  );
}

export default usePerformanceMonitoring;
