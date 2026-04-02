/**
 * HTTP health check server for monitoring
 * Ported from /opt/slimy/app/lib/health-server.js
 */

import express, { Application, Request, Response } from 'express';
import { database } from './database.js';

interface HealthCheck {
  status: string;
  timestamp: string;
  uptime: number;
  memory: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
  };
  database?: string;
  error?: string;
}

export function createHealthServer(): Application {
  const app = express();

  app.get('/health', async (_req: Request, res: Response) => {
    const checks: HealthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
    };

    try {
      if (database.isConfigured()) {
        await database.testConnection();
        checks.database = 'connected';
      } else {
        checks.database = 'not configured';
      }
    } catch (err) {
      checks.database = 'disconnected';
      checks.status = 'unhealthy';
      checks.error = (err as Error).message;
    }

    const statusCode = checks.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(checks);
  });

  app.get('/metrics', async (_req: Request, res: Response) => {
    try {
      const stats = getBotStats();
      res.json(stats);
    } catch (err) {
      res.status(500).json({ error: 'Metrics not available', message: (err as Error).message });
    }
  });

  return app;
}

export interface BotStats {
  startTime: number;
  errors: {
    count: number;
    lastError: string | null;
    lastErrorTime: number | null;
  };
}

export function getBotStats(): BotStats {
  if (typeof globalThis.botStats !== 'undefined') {
    return globalThis.botStats as BotStats;
  }
  return {
    startTime: Date.now(),
    errors: { count: 0, lastError: null, lastErrorTime: null },
  };
}

export function recordBotError(err: unknown): void {
  const stats = getBotStats();
  stats.errors.count++;
  stats.errors.lastError = String(err);
  stats.errors.lastErrorTime = Date.now();
  globalThis.botStats = stats;
}

export function startHealthServer(): ReturnType<Application['listen']> | null {
  const app = createHealthServer();
  const PORT = Number(process.env.HEALTH_PORT || 3000);

  const server = app.listen(PORT, () => {
    console.log(`✅ Health check server running on port ${PORT}`);
    console.log(`   - Health: http://localhost:${PORT}/health`);
    console.log(`   - Metrics: http://localhost:${PORT}/metrics`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️  Port ${PORT} already in use. Health server not started.`);
    } else {
      console.error('[health-server] Error:', err.message);
    }
  });

  return server;
}
