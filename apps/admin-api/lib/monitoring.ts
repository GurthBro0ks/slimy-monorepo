/**
 * Monitoring and observability setup
 * Provides Sentry integration and basic in-memory metrics collection
 */

import * as Sentry from '@sentry/node';

// In-memory metrics counters
interface Metrics {
  requests: number;
  errors: number;
  startTime: Date;
}

const metrics: Metrics = {
  requests: 0,
  errors: 0,
  startTime: new Date(),
};

/**
 * Initialize Sentry for error tracking and monitoring
 * @param dsn - Sentry DSN from environment variable
 */
export function setupSentry(dsn: string): void {
  if (!dsn) {
    console.warn('[Monitoring] No Sentry DSN provided - Sentry disabled');
    return;
  }

  try {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
      beforeSend(event, hint) {
        // Filter out certain errors or add additional context
        const error = hint.originalException;

        // Don't send validation errors to Sentry
        if (error && typeof error === 'object' && 'name' in error) {
          if (error.name === 'ValidationError' || error.name === 'ZodError') {
            return null;
          }
        }

        return event;
      },
    });

    console.log('[Monitoring] Sentry initialized successfully');
  } catch (error) {
    console.error('[Monitoring] Failed to initialize Sentry:', error);
  }
}

/**
 * Collect and return current metrics
 * Returns basic counters for requests and errors
 */
export function collectMetrics(): {
  requests: number;
  errors: number;
  uptime: number;
  errorRate: number;
} {
  const uptime = Math.floor((Date.now() - metrics.startTime.getTime()) / 1000);
  const errorRate = metrics.requests > 0 ? (metrics.errors / metrics.requests) * 100 : 0;

  return {
    requests: metrics.requests,
    errors: metrics.errors,
    uptime,
    errorRate: parseFloat(errorRate.toFixed(2)),
  };
}

/**
 * Increment request counter
 */
export function incrementRequests(): void {
  metrics.requests++;
}

/**
 * Increment error counter
 */
export function incrementErrors(): void {
  metrics.errors++;
}

/**
 * Reset all metrics counters
 */
export function resetMetrics(): void {
  metrics.requests = 0;
  metrics.errors = 0;
  metrics.startTime = new Date();
}

/**
 * Get the metrics start time
 */
export function getStartTime(): Date {
  return metrics.startTime;
}

// Re-export Sentry for use in error handlers
export { Sentry };
