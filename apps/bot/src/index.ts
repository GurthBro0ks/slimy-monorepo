/**
 * Discord Bot Entry Point
 *
 * This is a minimal scaffold. Actual Discord bot logic will be
 * migrated from existing services.
 *
 * TODO:
 * - Import Discord.js client setup
 * - Add command handlers
 * - Connect to database
 * - Implement club analytics features
 */

import { parseNumber, isValidSnowflake } from './utils/parsing';
import { calculateClubStats } from './utils/stats';
import { database } from './lib/database.js';

async function main() {
  console.log('[bot] Starting Slimy Discord Bot (scaffold mode)...');

  // Check required environment variables
  const token = process.env.DISCORD_BOT_TOKEN;

  if (!token) {
    console.error('[bot] ERROR: DISCORD_BOT_TOKEN is required');
    console.log('[bot] This is a scaffold. Set DISCORD_BOT_TOKEN to run.');
    return;
  }

  // Initialize database (creates tables if not exist, skips gracefully if unconfigured)
  const dbOk = await database.initialize();
  if (dbOk) {
    console.log('[bot] Database initialized successfully');
    try {
      const connected = await database.testConnection();
      console.log('[bot] Database connection verified:', connected);
    } catch (err) {
      console.warn('[bot] Database connection test failed (non-fatal):', (err as Error).message);
    }
  } else {
    console.warn('[bot] Database not configured — skipping DB init (env vars missing)');
  }

  console.log('[bot] Configuration validated');
  console.log('[bot] Utils available:', {
    parseNumber,
    isValidSnowflake,
    calculateClubStats,
  });

  // TODO: Initialize Discord client
  // TODO: Register command handlers

  console.log('[bot] Scaffold initialization complete');
  console.log('[bot] Waiting for actual bot implementation...');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[bot] Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[bot] Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Run if this is the main module
const isMain = process.argv[1] != null && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main().catch(error => {
    console.error('[bot] Fatal error:', error);
    process.exit(1);
  });
}

export { parseNumber, isValidSnowflake, calculateClubStats };
