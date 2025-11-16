/**
 * Core Web Vitals Tracking
 *
 * Provides client-side monitoring of Core Web Vitals metrics:
 * - LCP (Largest Contentful Paint)
 * - FID (First Input Delay)
 * - CLS (Cumulative Layout Shift)
 * - FCP (First Contentful Paint)
 * - TTFB (Time to First Byte)
 * - INP (Interaction to Next Paint)
 */

export interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: 'navigate' | 'reload' | 'back-forward' | 'prerender';
}

/**
 * Thresholds for Core Web Vitals ratings
 */
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

/**
 * Calculate rating based on thresholds
 */
function getRating(metric: WebVitalsMetric['name'], value: number): WebVitalsMetric['rating'] {
  const threshold = THRESHOLDS[metric];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Send metric to analytics endpoint
 */
async function sendToAnalytics(metric: WebVitalsMetric): Promise<void> {
  try {
    const body = JSON.stringify({
      metric: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
      url: window.location.href,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      connection: (navigator as any).connection?.effectiveType,
      deviceMemory: (navigator as any).deviceMemory,
    });

    // Use sendBeacon for better reliability
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/web-vitals', body);
    } else {
      // Fallback to fetch
      fetch('/api/web-vitals', {
        method: 'POST',
        body,
        headers: {
          'Content-Type': 'application/json',
        },
        keepalive: true,
      }).catch((error) => {
        console.error('Failed to send web vitals:', error);
      });
    }
  } catch (error) {
    console.error('Failed to send web vitals:', error);
  }
}

/**
 * Report Core Web Vitals metric
 */
function reportWebVitals(metric: WebVitalsMetric): void {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Web Vitals]', metric.name, {
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
    });
  }

  // Send to analytics
  sendToAnalytics(metric);
}

/**
 * Initialize Core Web Vitals tracking
 */
export function initWebVitals(): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Dynamically import web-vitals library
  import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
    // Track Core Web Vitals
    onCLS((metric) => {
      reportWebVitals({
        ...metric,
        rating: getRating('CLS', metric.value),
        navigationType: (performance.getEntriesByType('navigation')[0] as any)?.type || 'navigate',
      } as WebVitalsMetric);
    });

    onFCP((metric) => {
      reportWebVitals({
        ...metric,
        rating: getRating('FCP', metric.value),
        navigationType: (performance.getEntriesByType('navigation')[0] as any)?.type || 'navigate',
      } as WebVitalsMetric);
    });

    onLCP((metric) => {
      reportWebVitals({
        ...metric,
        rating: getRating('LCP', metric.value),
        navigationType: (performance.getEntriesByType('navigation')[0] as any)?.type || 'navigate',
      } as WebVitalsMetric);
    });

    onTTFB((metric) => {
      reportWebVitals({
        ...metric,
        rating: getRating('TTFB', metric.value),
        navigationType: (performance.getEntriesByType('navigation')[0] as any)?.type || 'navigate',
      } as WebVitalsMetric);
    });

    onINP((metric) => {
      reportWebVitals({
        ...metric,
        rating: getRating('INP', metric.value),
        navigationType: (performance.getEntriesByType('navigation')[0] as any)?.type || 'navigate',
      } as WebVitalsMetric);
    });
  }).catch((error) => {
    console.error('Failed to load web-vitals:', error);
  });
}

/**
 * Get current Web Vitals snapshot
 */
export async function getWebVitalsSnapshot(): Promise<Partial<Record<WebVitalsMetric['name'], number>>> {
  if (typeof window === 'undefined') {
    return {};
  }

  const { onCLS, onFCP, onLCP, onTTFB, onINP } = await import('web-vitals');

  return new Promise((resolve) => {
    const vitals: Partial<Record<WebVitalsMetric['name'], number>> = {};
    let completed = 0;
    const total = 5;

    const checkComplete = () => {
      completed++;
      if (completed === total) {
        resolve(vitals);
      }
    };

    onCLS((metric) => {
      vitals.CLS = metric.value;
      checkComplete();
    }, { reportAllChanges: true });

    onFCP((metric) => {
      vitals.FCP = metric.value;
      checkComplete();
    });

    onLCP((metric) => {
      vitals.LCP = metric.value;
      checkComplete();
    }, { reportAllChanges: true });

    onTTFB((metric) => {
      vitals.TTFB = metric.value;
      checkComplete();
    });

    onINP((metric) => {
      vitals.INP = metric.value;
      checkComplete();
    }, { reportAllChanges: true });

    // Timeout after 5 seconds
    setTimeout(() => resolve(vitals), 5000);
  });
}
