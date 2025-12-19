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

import { resolve } from 'path';
import { fileURLToPath } from 'url';

import { parseNumber, isValidSnowflake } from './utils/parsing.js';
import { calculateClubStats } from './utils/stats.js';

async function main() {
  console.log('[bot] Starting Slimy Discord Bot (scaffold mode)...');

  // Check required environment variables
  const token = process.env.DISCORD_BOT_TOKEN;

  if (!token) {
    console.error('[bot] ERROR: DISCORD_BOT_TOKEN is required');
    console.log('[bot] This is a scaffold. Set DISCORD_BOT_TOKEN to run.');
    return;
  }

  console.log('[bot] Configuration validated');
  console.log('[bot] Utils available:', {
    parseNumber,
    isValidSnowflake,
    calculateClubStats
  });

  // TODO: Initialize Discord client
  // TODO: Register command handlers
  // TODO: Connect to database

  console.log('[bot] Scaffold initialization complete');
  console.log('[bot] Waiting for actual bot implementation...');
  // Keep the process alive while the scaffold mode is running.
  setInterval(() => {}, 60_000);
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

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

// Run if this is the main module
if (isMain) {
  main().catch(error => {
    console.error('[bot] Fatal error:', error);
    process.exit(1);
  });
}

export { parseNumber, isValidSnowflake, calculateClubStats };
