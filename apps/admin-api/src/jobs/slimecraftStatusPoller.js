"use strict";

/**
 * Slimecraft Status Poller
 *
 * This script polls the Slimecraft bedrock server status and records it to the database.
 * It's designed to be run by a cron job or systemd timer.
 *
 * USAGE:
 *
 * 1. Direct execution:
 *    node src/jobs/slimecraftStatusPoller.js
 *
 * 2. Via cron (every 5 minutes):
 *    Add to crontab:
 *    *\/5 * * * * cd /path/to/admin-api && node src/jobs/slimecraftStatusPoller.js >> /var/log/slimecraft-poller.log 2>&1
 *
 * 3. Via systemd timer:
 *    Create service file: /etc/systemd/system/slimecraft-poller.service
 *    [Unit]
 *    Description=Slimecraft Status Poller
 *
 *    [Service]
 *    Type=oneshot
 *    WorkingDirectory=/path/to/admin-api
 *    ExecStart=/usr/bin/node src/jobs/slimecraftStatusPoller.js
 *    Environment="NODE_ENV=production"
 *    Environment="DATABASE_URL=your_database_url"
 *    Environment="SLIMECRAFT_STATUS_INTERNAL_URL=http://localhost:8080/api/bedrock-status"
 *
 *    Create timer file: /etc/systemd/system/slimecraft-poller.timer
 *    [Unit]
 *    Description=Run Slimecraft Status Poller every 5 minutes
 *
 *    [Timer]
 *    OnCalendar=*:0/5
 *    Persistent=true
 *
 *    [Install]
 *    WantedBy=timers.target
 *
 *    Enable and start:
 *    systemctl enable slimecraft-poller.timer
 *    systemctl start slimecraft-poller.timer
 *
 * ENVIRONMENT VARIABLES:
 *   - DATABASE_URL: PostgreSQL connection string (required)
 *   - SLIMECRAFT_STATUS_INTERNAL_URL: URL to the bedrock status endpoint (required)
 *   - NODE_ENV: Set to 'production' in production
 */

const database = require('../lib/database');

/**
 * Run a single status poll.
 * This function calls the internal status history poll endpoint.
 */
async function runSlimecraftStatusPollOnce() {
  console.log('[slimecraft-poller] Starting status poll...');

  try {
    // Initialize database connection
    if (!database.isInitialized) {
      const initialized = await database.initialize();
      if (!initialized) {
        console.error('[slimecraft-poller] Failed to initialize database connection');
        process.exit(1);
      }
    }

    const statusUrl = process.env.SLIMECRAFT_STATUS_INTERNAL_URL;

    if (!statusUrl) {
      console.error('[slimecraft-poller] SLIMECRAFT_STATUS_INTERNAL_URL not configured');
      process.exit(1);
    }

    let statusData = {
      online: false,
      latencyMs: null,
      playerCount: null,
      raw: null
    };

    try {
      console.log(`[slimecraft-poller] Fetching status from ${statusUrl}...`);

      // Fetch the bedrock status from the configured endpoint
      const response = await fetch(statusUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add a reasonable timeout
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (response.ok) {
        const data = await response.json();

        // Parse the response based on expected format
        // Adjust this based on actual bedrock status API response structure
        statusData = {
          online: data.online ?? data.status === 'online' ?? false,
          latencyMs: data.latency ?? data.latencyMs ?? data.ping ?? null,
          playerCount: data.players ?? data.playerCount ?? data.playersOnline ?? null,
          raw: data
        };

        console.log(`[slimecraft-poller] Status: ${statusData.online ? 'online' : 'offline'}, ` +
          `latency: ${statusData.latencyMs ?? 'N/A'}ms, ` +
          `players: ${statusData.playerCount ?? 'N/A'}`);
      } else {
        // Status check endpoint returned error - server likely offline
        console.warn(`[slimecraft-poller] Status endpoint returned HTTP ${response.status}`);
        statusData.online = false;
        statusData.raw = {
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      // Network error or timeout - server offline or unreachable
      console.error('[slimecraft-poller] Failed to fetch status:', error.message);
      statusData.online = false;
      statusData.raw = {
        error: error.message,
        type: error.name
      };
    }

    // Insert the status ping into database
    console.log('[slimecraft-poller] Recording status to database...');
    const prisma = database.getClient();
    const ping = await prisma.slimecraftStatusPing.create({
      data: {
        online: statusData.online,
        latencyMs: statusData.latencyMs,
        playerCount: statusData.playerCount,
        raw: statusData.raw
      }
    });

    console.log(`[slimecraft-poller] Successfully recorded ping #${ping.id} at ${ping.timestamp}`);
    console.log('[slimecraft-poller] Poll completed successfully');

    // Close database connection
    await database.close();

    process.exit(0);
  } catch (error) {
    console.error('[slimecraft-poller] Fatal error:', error);
    await database.close().catch(() => {});
    process.exit(1);
  }
}

// Export the function for testing or programmatic use
module.exports = { runSlimecraftStatusPollOnce };

// If running directly (not imported), execute the poll
if (require.main === module) {
  runSlimecraftStatusPollOnce();
}
