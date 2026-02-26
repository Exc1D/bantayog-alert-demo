import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

function getNavigationEntry() {
  return (
    performance.getEntriesByType('navigation')[0] || performance.getEntriesByType('resource')[0]
  );
}

export function reportWebVitals(onPerfEntry) {
  if (onPerfEntry && typeof onPerfEntry === 'function') {
    onCLS(onPerfEntry);
    onFCP(onPerfEntry);
    onINP(onPerfEntry);
    onLCP(onPerfEntry);
    onTTFB(onPerfEntry);
  }
}

export function measureWebVitals() {
  return new Promise((resolve) => {
    const metrics = {};
    const report = (metric) => {
      metrics[metric.name] = metric.value;
      if (Object.keys(metrics).length === 5) {
        resolve(metrics);
      }
    };

    onCLS(report);
    onFCP(report);
    onINP(report);
    onLCP(report);
    onTTFB(report);
  });
}

export function getServerTiming() {
  const navigationEntry = getNavigationEntry();
  if (!navigationEntry) return null;

  return {
    dns: navigationEntry.domainLookupEnd - navigationEntry.domainLookupStart,
    tcp: navigationEntry.connectEnd - navigationEntry.connectStart,
    ssl:
      navigationEntry.secureConnectionStart > 0
        ? navigationEntry.connectEnd - navigationEntry.secureConnectionStart
        : 0,
    ttfb: navigationEntry.responseStart - navigationEntry.requestStart,
    download: navigationEntry.responseEnd - navigationEntry.responseStart,
    total: navigationEntry.loadEventEnd - navigationEntry.startTime,
  };
}

export function logWebVitals() {
  console.log('[Web Vitals] Recording metrics...');

  onCLS((metric) => {
    console.log('[CLS]', metric.name, metric.value);
  });

  onINP((metric) => {
    console.log('[INP]', metric.name, metric.value);
  });

  onFCP((metric) => {
    console.log('[FCP]', metric.name, metric.value);
  });

  onLCP((metric) => {
    console.log('[LCP]', metric.name, metric.value);
  });

  onTTFB((metric) => {
    console.log('[TTFB]', metric.name, metric.value);
  });
}
