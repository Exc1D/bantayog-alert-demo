import { useEffect, useCallback } from 'react';
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

const vitals = {
  CLS: [],
  FCP: [],
  INP: [],
  LCP: [],
  TTFB: [],
};

function initVitals() {
  vitals.CLS = [];
  vitals.FCP = [];
  vitals.INP = [];
  vitals.LCP = [];
  vitals.TTFB = [];
}

function getRating(value, thresholds) {
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.needsImprovement) return 'needs-improvement';
  return 'poor';
}

const RATINGS = {
  cls: { good: 0.1, needsImprovement: 0.25 },
  inp: { good: 200, needsImprovement: 500 },
  fcp: { good: 1800, needsImprovement: 3000 },
  lcp: { good: 2500, needsImprovement: 4000 },
  ttfb: { good: 800, needsImprovement: 1800 },
};

function sendToAnalytics({ name, value, id }) {
  const rating = getRating(value, RATINGS[name.toLowerCase()] || RATINGS.fcp);

  if (vitals[name]) {
    vitals[name].push({ value, rating, id, timestamp: Date.now() });
  }

  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', name, {
      event_category: 'Web Vitals',
      event_label: id,
      value: Math.round(name === 'CLS' ? value * 1000 : value),
      non_interaction: true,
    });
  }

  if (import.meta.env.DEV) {
    console.log(`[Web Vitals] ${name}: ${value.toFixed(2)} (${rating})`);
  }
}

function getWebVitals() {
  return new Promise((resolve) => {
    const metrics = {};
    let completed = 0;
    const total = 5;

    const checkComplete = () => {
      completed++;
      if (completed === total) {
        resolve(metrics);
      }
    };

    onCLS((metric) => {
      metrics.CLS = { value: metric.value, rating: getRating(metric.value, RATINGS.cls) };
      sendToAnalytics({ name: 'CLS', value: metric.value, id: metric.id });
      checkComplete();
    });

    onINP((metric) => {
      metrics.INP = { value: metric.value, rating: getRating(metric.value, RATINGS.inp) };
      sendToAnalytics({ name: 'INP', value: metric.value, id: metric.id });
      checkComplete();
    });

    onFCP((metric) => {
      metrics.FCP = { value: metric.value, rating: getRating(metric.value, RATINGS.fcp) };
      sendToAnalytics({ name: 'FCP', value: metric.value, id: metric.id });
      checkComplete();
    });

    onLCP((metric) => {
      metrics.LCP = { value: metric.value, rating: getRating(metric.value, RATINGS.lcp) };
      sendToAnalytics({ name: 'LCP', value: metric.value, id: metric.id });
      checkComplete();
    });

    onTTFB((metric) => {
      metrics.TTFB = { value: metric.value, rating: getRating(metric.value, RATINGS.ttfb) };
      sendToAnalytics({ name: 'TTFB', value: metric.value, id: metric.id });
      checkComplete();
    });
  });
}

export function useWebVitals(options = {}) {
  const { onReport, reportOnHidden = true } = options;

  const reportVitals = useCallback(async () => {
    const metrics = await getWebVitals();

    if (onReport) {
      onReport(metrics);
    }

    return metrics;
  }, [onReport]);

  useEffect(() => {
    if (!('PerformanceObserver' in window)) {
      return;
    }

    reportVitals();

    if (reportOnHidden && document) {
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          reportVitals();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  }, [reportVitals, reportOnHidden]);

  return {
    reportVitals,
    vitals,
    initVitals,
  };
}

export function getCLSValue() {
  return vitals.CLS.length > 0 ? vitals.CLS[vitals.CLS.length - 1].value : null;
}

export function getFCPValue() {
  return vitals.FCP.length > 0 ? vitals.FCP[vitals.FCP.length - 1].value : null;
}

export function getLCPValue() {
  return vitals.LCP.length > 0 ? vitals.LCP[vitals.LCP.length - 1].value : null;
}

export function getINPValue() {
  return vitals.INP.length > 0 ? vitals.INP[vitals.INP.length - 1].value : null;
}

export function getTTFBValue() {
  return vitals.TTFB.length > 0 ? vitals.TTFB[vitals.TTFB.length - 1].value : null;
}

export function getAllVitals() {
  return {
    cls: getCLSValue(),
    fcp: getFCPValue(),
    lcp: getLCPValue(),
    inp: getINPValue(),
    ttfb: getTTFBValue(),
  };
}

export { getWebVitals, sendToAnalytics, RATINGS };
