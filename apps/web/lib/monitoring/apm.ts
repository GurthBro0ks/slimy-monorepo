/**
 * Application Performance Monitoring (APM)
 *
 * Provides performance tracking for API routes, database queries,
 * and external service calls
 */

import { getLogger } from './logger';
import type { JSONObject } from '../types/common';

/**
 * Performance trace
 */
interface PerformanceTrace {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: JSONObject;
  spans: PerformanceSpan[];
}

/**
 * Performance span (sub-operation within a trace)
 */
interface PerformanceSpan {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  type: 'database' | 'http' | 'cache' | 'compute' | 'other';
  metadata?: JSONObject;
}

/**
 * APM metrics
 */
interface APMMetrics {
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
  p50: number;
  p95: number;
  p99: number;
  slowestRequests: Array<{
    url: string;
    duration: number;
    timestamp: number;
  }>;
}

/**
 * APM Manager
 */
export class APM {
  private activeTraces: Map<string, PerformanceTrace>;
  private completedTraces: PerformanceTrace[];
  private maxStoredTraces: number = 1000;
  private logger = getLogger({ component: 'APM' });

  constructor() {
    this.activeTraces = new Map();
    this.completedTraces = [];
  }

  /**
   * Start a new trace
   */
  startTrace(name: string, metadata?: JSONObject): string {
    const id = crypto.randomUUID();
    const trace: PerformanceTrace = {
      id,
      name,
      startTime: performance.now(),
      metadata,
      spans: [],
    };

    this.activeTraces.set(id, trace);
    return id;
  }

  /**
   * End a trace
   */
  endTrace(traceId: string, metadata?: JSONObject): PerformanceTrace | null {
    const trace = this.activeTraces.get(traceId);

    if (!trace) {
      this.logger.warn('Attempted to end non-existent trace', { traceId });
      return null;
    }

    trace.endTime = performance.now();
    trace.duration = trace.endTime - trace.startTime;

    if (metadata) {
      trace.metadata = { ...trace.metadata, ...metadata };
    }

    this.activeTraces.delete(traceId);
    this.completedTraces.push(trace);

    // Keep only recent traces
    if (this.completedTraces.length > this.maxStoredTraces) {
      this.completedTraces.shift();
    }

    // Log slow traces (>1000ms)
    if (trace.duration > 1000) {
      this.logger.warn('Slow trace detected', {
        traceId,
        name: trace.name,
        duration: trace.duration,
        metadata: trace.metadata ?? null,
      });
    }

    return trace;
  }

  /**
   * Start a span within a trace
   */
  startSpan(
    traceId: string,
    name: string,
    type: PerformanceSpan['type'],
    metadata?: JSONObject
  ): number {
    const trace = this.activeTraces.get(traceId);

    if (!trace) {
      this.logger.warn('Attempted to add span to non-existent trace', { traceId });
      return -1;
    }

    const span: PerformanceSpan = {
      name,
      startTime: performance.now(),
      type,
      metadata,
    };

    trace.spans.push(span);
    return trace.spans.length - 1;
  }

  /**
   * End a span
   */
  endSpan(traceId: string, spanIndex: number, metadata?: JSONObject): void {
    const trace = this.activeTraces.get(traceId);

    if (!trace || spanIndex < 0 || spanIndex >= trace.spans.length) {
      return;
    }

    const span = trace.spans[spanIndex];
    span.endTime = performance.now();
    span.duration = span.endTime - span.startTime;

    if (metadata) {
      span.metadata = { ...span.metadata, ...metadata };
    }

    // Log slow spans (>500ms)
    if (span.duration > 500) {
      this.logger.warn('Slow span detected', {
        traceId,
        spanName: span.name,
        spanType: span.type,
        duration: span.duration,
        metadata: span.metadata ?? null,
      });
    }
  }

  /**
   * Helper: Trace a function
   */
  async trace<T>(
    name: string,
    fn: (traceId: string) => Promise<T>,
    metadata?: JSONObject
  ): Promise<T> {
    const traceId = this.startTrace(name, metadata);

    try {
      const result = await fn(traceId);
      this.endTrace(traceId, { success: true });
      return result;
    } catch (error) {
      this.endTrace(traceId, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Helper: Trace a database query
   */
  async traceDatabase<T>(
    traceId: string,
    operation: string,
    fn: () => Promise<T>,
    metadata?: JSONObject
  ): Promise<T> {
    const spanIndex = this.startSpan(traceId, operation, 'database', metadata);

    try {
      const result = await fn();
      this.endSpan(traceId, spanIndex, { success: true });
      return result;
    } catch (error) {
      this.endSpan(traceId, spanIndex, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Helper: Trace an HTTP request
   */
  async traceHTTP<T>(
    traceId: string,
    method: string,
    url: string,
    fn: () => Promise<T>,
    metadata?: JSONObject
  ): Promise<T> {
    const spanIndex = this.startSpan(traceId, `${method} ${url}`, 'http', {
      method,
      url,
      ...metadata,
    });

    try {
      const result = await fn();
      this.endSpan(traceId, spanIndex, { success: true });
      return result;
    } catch (error) {
      this.endSpan(traceId, spanIndex, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Helper: Trace a cache operation
   */
  async traceCache<T>(
    traceId: string,
    operation: string,
    key: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const spanIndex = this.startSpan(traceId, operation, 'cache', { key });

    try {
      const result = await fn();
      this.endSpan(traceId, spanIndex, { success: true, hit: result !== null });
      return result;
    } catch (error) {
      this.endSpan(traceId, spanIndex, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get metrics for a time period
   */
  getMetrics(periodMinutes: number = 60): APMMetrics {
    const cutoffTime = Date.now() - periodMinutes * 60 * 1000;
    const relevantTraces = this.completedTraces.filter(
      (trace) => trace.startTime >= cutoffTime && trace.duration !== undefined
    );

    if (relevantTraces.length === 0) {
      return {
        requestCount: 0,
        errorCount: 0,
        averageResponseTime: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        slowestRequests: [],
      };
    }

    const durations = relevantTraces
      .map((t) => t.duration!)
      .sort((a, b) => a - b);

    const errorCount = relevantTraces.filter(
      (t) => t.metadata?.success === false
    ).length;

    const averageResponseTime =
      durations.reduce((sum, d) => sum + d, 0) / durations.length;

    const p50 = durations[Math.floor(durations.length * 0.5)];
    const p95 = durations[Math.floor(durations.length * 0.95)];
    const p99 = durations[Math.floor(durations.length * 0.99)];

    const slowestRequests = relevantTraces
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 10)
      .map((t) => ({
        url: t.metadata?.url as string || t.name,
        duration: t.duration!,
        timestamp: t.startTime,
      }));

    return {
      requestCount: relevantTraces.length,
      errorCount,
      averageResponseTime,
      p50,
      p95,
      p99,
      slowestRequests,
    };
  }

  /**
   * Get all traces
   */
  getTraces(limit: number = 100): PerformanceTrace[] {
    return this.completedTraces.slice(-limit);
  }

  /**
   * Clear stored traces
   */
  clearTraces(): void {
    this.completedTraces = [];
  }
}

// Singleton instance
let apmInstance: APM | null = null;

/**
 * Get APM instance
 */
export function getAPM(): APM {
  if (!apmInstance) {
    apmInstance = new APM();
  }
  return apmInstance;
}

/**
 * Middleware for automatic request tracing
 */
export function withAPM<T extends (request: Request, ...args: unknown[]) => Promise<Response>>(
  handler: T
): T {
  return (async (request: Request, ...args: unknown[]) => {
    const apm = getAPM();
    const url = new URL(request.url);

    return await apm.trace(
      `${request.method} ${url.pathname}`,
      async (traceId) => {
        // Add traceId to request headers for downstream use
        const headers = new Headers(request.headers);
        headers.set('x-trace-id', traceId);

        const tracedRequest = new Request(request, { headers });
        return await handler(tracedRequest, ...args);
      },
      {
        method: request.method,
        url: url.pathname,
        userAgent: request.headers.get('user-agent'),
      }
    );
  }) as T;
}
