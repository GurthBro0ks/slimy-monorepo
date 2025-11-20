/**
 * opps-api HTTP server
 *
 * Exposes radar snapshots over HTTP using Express
 */

import express from 'express';
import { getConfig } from './config.js';
import { radarHandler } from './routes/radar.js';

/**
 * Create and configure the Express application
 */
function createApp(): express.Application {
  const app = express();

  // Parse JSON bodies
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'opps-api',
    });
  });

  // Radar snapshot endpoint
  app.get('/radar', radarHandler);

  return app;
}

/**
 * Start the HTTP server
 */
export async function startServer(): Promise<void> {
  const config = getConfig();
  const app = createApp();

  app.listen(config.port, () => {
    console.log(`opps-api listening on port ${config.port}`);
  });
}

// CLI entry point: start server if this module is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}
