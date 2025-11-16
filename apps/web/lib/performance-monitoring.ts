/**
 * Performance monitoring utilities
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

interface WebVitalsMetric {
  name: string;
  value: number;
  id: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private webVitals: WebVitalsMetric[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.init();
  }

  private init() {
    // Monitor Core Web Vitals
    this.observeWebVitals();

    // Monitor navigation timing
    this.observeNavigationTiming();

    // Monitor resource loading
    this.observeResourceTiming();

    // Monitor largest contentful paint
    this.observeLargestContentfulPaint();

    // Monitor first input delay
    this.observeFirstInputDelay();

    // Monitor cumulative layout shift
    this.observeCumulativeLayoutShift();
  }

  private observeWebVitals() {
    // CLS - Cumulative Layout Shift
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          this.recordWebVital('CLS', (entry as any).value);
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });

    // FID - First Input Delay
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordWebVital('FID', (entry as any).processingStart - entry.startTime);
      }
    }).observe({ type: 'first-input', buffered: true });

    // FCP - First Contentful Paint
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordWebVital('FCP', entry.startTime);
      }
    }).observe({ type: 'paint', buffered: true });

    // LCP - Largest Contentful Paint
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordWebVital('LCP', entry.startTime);
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  }

  private observeNavigationTiming() {
    if (typeof window !== 'undefined' && 'performance' in window) {
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

        if (navigation) {
          this.recordMetric('navigation_dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart);
          this.recordMetric('navigation_load_complete', navigation.loadEventEnd - navigation.loadEventStart);
          this.recordMetric('navigation_dns_lookup', navigation.domainLookupEnd - navigation.domainLookupStart);
          this.recordMetric('navigation_tcp_connect', navigation.connectEnd - navigation.connectStart);
          this.recordMetric('navigation_server_response', navigation.responseEnd - navigation.requestStart);
        }
      });
    }
  }

  private observeResourceTiming() {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const resourceEntry = entry as PerformanceResourceTiming;
        this.recordMetric('resource_load_time', resourceEntry.responseEnd - resourceEntry.requestStart, {
          resource: resourceEntry.name,
          type: this.getResourceType(resourceEntry.initiatorType),
        });
      }
    }).observe({ type: 'resource', buffered: true });
  }

  private observeLargestContentfulPaint() {
    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordWebVital('LCP', lastEntry.startTime);
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      // LCP might not be supported in all browsers
    }
  }

  private observeFirstInputDelay() {
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordWebVital('FID', (entry as any).processingStart - entry.startTime);
        }
      }).observe({ type: 'first-input', buffered: true });
    } catch (e) {
      // FID might not be supported in all browsers
    }
  }

  private observeCumulativeLayoutShift() {
    try {
      let clsValue = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        this.recordWebVital('CLS', clsValue);
      }).observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      // CLS might not be supported in all browsers
    }
  }

  private recordMetric(name: string, value: number, tags?: Record<string, string>) {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      tags,
    });
  }

  private recordWebVital(name: string, value: number) {
    this.webVitals.push({
      name,
      value,
      id: `${name}_${Date.now()}`,
    });
  }

  private getResourceType(initiatorType: string): string {
    switch (initiatorType) {
      case 'img': return 'image';
      case 'script': return 'script';
      case 'link': return 'stylesheet';
      case 'xmlhttprequest':
      case 'fetch': return 'xhr';
      default: return initiatorType || 'unknown';
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get current web vitals
   */
  getWebVitals(): WebVitalsMetric[] {
    return [...this.webVitals];
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const vitals = this.getWebVitals();
    const metrics = this.getMetrics();

    const summary = {
      timestamp: Date.now(),
      webVitals: {
        CLS: vitals.find(v => v.name === 'CLS')?.value || null,
        FID: vitals.find(v => v.name === 'FID')?.value || null,
        FCP: vitals.find(v => v.name === 'FCP')?.value || null,
        LCP: vitals.find(v => v.name === 'LCP')?.value || null,
      },
      navigation: {
        domContentLoaded: metrics.find(m => m.name === 'navigation_dom_content_loaded')?.value || null,
        loadComplete: metrics.find(m => m.name === 'navigation_load_complete')?.value || null,
        dnsLookup: metrics.find(m => m.name === 'navigation_dns_lookup')?.value || null,
        tcpConnect: metrics.find(m => m.name === 'navigation_tcp_connect')?.value || null,
        serverResponse: metrics.find(m => m.name === 'navigation_server_response')?.value || null,
      },
      resourceCount: metrics.filter(m => m.name === 'resource_load_time').length,
      averageResourceLoadTime: this.calculateAverage(metrics.filter(m => m.name === 'resource_load_time')),
    };

    return summary;
  }

  private calculateAverage(metrics: PerformanceMetric[]): number | null {
    if (metrics.length === 0) return null;
    const sum = metrics.reduce((acc, metric) => acc + metric.value, 0);
    return sum / metrics.length;
  }

  /**
   * Send metrics to monitoring service
   */
  async sendMetrics(endpoint?: string) {
    const summary = this.getPerformanceSummary();

    try {
      if (endpoint) {
        await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(summary),
        });
      } else {
        // Log to console in development
        console.log('Performance Metrics:', summary);
      }
    } catch (error) {
      console.warn('Failed to send performance metrics:', error);
    }
  }

  /**
   * Start periodic reporting
   */
  startPeriodicReporting(intervalMs: number = 30000, endpoint?: string) {
    return setInterval(() => {
      this.sendMetrics(endpoint);
    }, intervalMs);
  }

  /**
   * Clean up observers
   */
  cleanup() {
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers = [];
  }
}

// Singleton instance
let performanceMonitor: PerformanceMonitor | null = null;

/**
 * Get performance monitor instance
 */
export function getPerformanceMonitor(): PerformanceMonitor {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor;
}

/**
 * Performance monitoring hooks for React components
 */
export function usePerformanceMonitoring() {
  const monitor = getPerformanceMonitor();

  return {
    recordMetric: (name: string, value: number, tags?: Record<string, string>) => {
      monitor['recordMetric'](name, value, tags);
    },
    getMetrics: () => monitor.getMetrics(),
    getWebVitals: () => monitor.getWebVitals(),
    getSummary: () => monitor.getPerformanceSummary(),
  };
}

/**
 * Measure component render time
 */
export function measureRenderTime(componentName: string) {
  const startTime = performance.now();

  return () => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    getPerformanceMonitor()['recordMetric'](
      `component_render_time`,
      renderTime,
      { component: componentName }
    );

    return renderTime;
  };
}

/**
 * Measure function execution time
 */
export function measureExecutionTime<T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T {
  return ((...args: Parameters<T>) => {
    const startTime = performance.now();
    const result = fn(...args);
    const endTime = performance.now();

    getPerformanceMonitor()['recordMetric'](
      `function_execution_time`,
      endTime - startTime,
      { function: name }
    );

    return result;
  }) as T;
}
