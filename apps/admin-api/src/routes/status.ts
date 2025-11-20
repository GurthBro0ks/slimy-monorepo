/**
 * Status and health check endpoint
 * GET /api/status - returns comprehensive system status
 */

import { Router, Request, Response } from 'express';
import { collectMetrics, getStartTime } from '../../lib/monitoring';

const router = Router();

// Load package.json for version info
const packageJson = require('../../package.json');

// Import database pool
const { pool } = require('../../lib/database');

/**
 * Check database connectivity and status
 */
async function checkDatabaseStatus(): Promise<{
  connected: boolean;
  responseTime?: number;
  error?: string;
  poolStatus?: {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
  };
}> {
  const startTime = Date.now();

  try {
    // Simple query to check DB connectivity
    await pool.query('SELECT 1');
    const responseTime = Date.now() - startTime;

    // Get pool statistics
    const poolStatus = {
      totalConnections: pool.pool.config.connectionLimit,
      activeConnections: pool.pool._allConnections.length - pool.pool._freeConnections.length,
      idleConnections: pool.pool._freeConnections.length,
    };

    return {
      connected: true,
      responseTime,
      poolStatus,
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
}

/**
 * GET /api/status
 * Returns comprehensive system status including:
 * - version
 * - uptime
 * - timestamp
 * - database status
 * - basic metrics
 */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const dbStatus = await checkDatabaseStatus();
    const metrics = collectMetrics();
    const startTime = getStartTime();
    const uptime = Math.floor((Date.now() - startTime.getTime()) / 1000);

    res.json({
      ok: true,
      service: 'admin-api',
      version: packageJson.version,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: uptime,
        human: formatUptime(uptime),
      },
      startedAt: startTime.toISOString(),
      database: dbStatus,
      metrics: {
        totalRequests: metrics.requests,
        totalErrors: metrics.errors,
        errorRate: `${metrics.errorRate}%`,
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: 'MB',
        },
      },
    });
  } catch (error) {
    console.error('[Status] Error generating status:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to generate status',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Format uptime in human-readable format
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

module.exports = router;
