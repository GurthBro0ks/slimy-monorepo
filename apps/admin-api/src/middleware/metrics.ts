/**
 * Metrics middleware for request tracking
 * Increments counters per route and integrates with Sentry for error logging
 */

import { Request, Response, NextFunction } from 'express';
import { incrementRequests, incrementErrors, Sentry } from '../../lib/monitoring';

const logger = require('../../lib/logger');

// Per-route metrics tracking
interface RouteMetrics {
  [route: string]: {
    count: number;
    errors: number;
    totalResponseTime: number;
    lastAccessed: Date;
  };
}

const routeMetrics: RouteMetrics = {};

/**
 * Get metrics for a specific route or all routes
 */
export function getRouteMetrics(route?: string): RouteMetrics | typeof routeMetrics[string] {
  if (route) {
    return routeMetrics[route] || { count: 0, errors: 0, totalResponseTime: 0, lastAccessed: new Date() };
  }
  return routeMetrics;
}

/**
 * Normalize route path for consistent metrics tracking
 * Converts /api/guilds/123456/settings to /api/guilds/:guildId/settings
 */
function normalizeRoute(path: string, baseUrl: string): string {
  const fullPath = baseUrl + path;

  // Replace numeric IDs with parameter placeholders
  return fullPath
    .replace(/\/\d+/g, '/:id')
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:uuid');
}

/**
 * Metrics middleware
 * Tracks requests, response times, and errors per route
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const route = normalizeRoute(req.path, req.baseUrl);

  // Initialize route metrics if not exists
  if (!routeMetrics[route]) {
    routeMetrics[route] = {
      count: 0,
      errors: 0,
      totalResponseTime: 0,
      lastAccessed: new Date(),
    };
  }

  // Increment request counters
  incrementRequests();
  routeMetrics[route].count++;
  routeMetrics[route].lastAccessed = new Date();

  // Track response completion
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    routeMetrics[route].totalResponseTime += duration;

    // Log slow requests (>1s)
    if (duration > 1000) {
      logger.warn(`[Metrics] Slow request: ${req.method} ${route} - ${duration}ms`);
    }

    // Track errors
    if (res.statusCode >= 500) {
      incrementErrors();
      routeMetrics[route].errors++;

      logger.error(`[Metrics] Server error on ${req.method} ${route}: ${res.statusCode}`);
    }
  });

  next();
}

/**
 * Error logging middleware with Sentry integration
 * Should be registered after routes but before final error handler
 */
export function errorLoggingMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const route = normalizeRoute(req.path, req.baseUrl);

  // Log error via logger
  logger.error('[Error] Unhandled error:', {
    error: error.message,
    stack: error.stack,
    route,
    method: req.method,
    ip: req.ip,
  });

  // Track error metrics
  incrementErrors();
  if (routeMetrics[route]) {
    routeMetrics[route].errors++;
  }

  // Send to Sentry if available
  try {
    Sentry.captureException(error, {
      tags: {
        route,
        method: req.method,
      },
      extra: {
        body: req.body,
        query: req.query,
        params: req.params,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      },
      user: {
        // Add user context if available from auth middleware
        id: (req as any).userId,
        ip_address: req.ip,
      },
    });
  } catch (sentryError) {
    logger.error('[Sentry] Failed to capture exception:', sentryError);
  }

  // Pass to next error handler
  next(error);
}

/**
 * Get average response time for a route
 */
export function getAverageResponseTime(route: string): number {
  const metrics = routeMetrics[route];
  if (!metrics || metrics.count === 0) return 0;
  return Math.round(metrics.totalResponseTime / metrics.count);
}

/**
 * Reset route metrics
 */
export function resetRouteMetrics(): void {
  Object.keys(routeMetrics).forEach(key => delete routeMetrics[key]);
}
