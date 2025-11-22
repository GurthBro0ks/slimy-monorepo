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
if (require.main === module) {
  main().catch(error => {
    console.error('[bot] Fatal error:', error);
    process.exit(1);
  });
}

export { parseNumber, isValidSnowflake, calculateClubStats };
