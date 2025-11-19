#!/usr/bin/env node

/**
 * Session Cleanup Script
 *
 * Safely removes expired sessions from the database in batches
 * to prevent unbounded growth and avoid large transactions.
 *
 * Usage:
 *   node scripts/cleanup-sessions.js [options]
 *
 * Options:
 *   --batch-size <number>  Number of sessions to delete per batch (default: 1000)
 *   --delay <number>       Delay between batches in milliseconds (default: 100)
 *   --max-age <number>     Delete sessions older than N days (default: 30)
 *   --dry-run             Show what would be deleted without actually deleting
 *   --help                Show this help message
 *
 * Examples:
 *   node scripts/cleanup-sessions.js
 *   node scripts/cleanup-sessions.js --max-age 60
 *   node scripts/cleanup-sessions.js --batch-size 500 --delay 200
 *   node scripts/cleanup-sessions.js --dry-run
 */

// Lazy-load database module to allow --help to work without dependencies
let database = null;
function getDatabase() {
  if (!database) {
    database = require('../src/lib/database');
  }
  return database;
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    batchSize: 1000,
    delayMs: 100,
    maxAge: 30,
    dryRun: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--batch-size':
        options.batchSize = parseInt(args[++i], 10);
        break;
      case '--delay':
        options.delayMs = parseInt(args[++i], 10);
        break;
      case '--max-age':
        options.maxAge = parseInt(args[++i], 10);
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        console.error(`Unknown option: ${arg}`);
        console.error('Use --help for usage information');
        process.exit(1);
    }
  }

  return options;
}

// Show help message
function showHelp() {
  console.log(`
Session Cleanup Script

Safely removes expired sessions from the database in batches
to prevent unbounded growth and avoid large transactions.

Usage:
  node scripts/cleanup-sessions.js [options]

Options:
  --batch-size <number>  Number of sessions to delete per batch (default: 1000)
  --delay <number>       Delay between batches in milliseconds (default: 100)
  --max-age <number>     Delete sessions older than N days (default: 30)
  --dry-run             Show what would be deleted without actually deleting
  --help                Show this help message

Examples:
  node scripts/cleanup-sessions.js
  node scripts/cleanup-sessions.js --max-age 60
  node scripts/cleanup-sessions.js --batch-size 500 --delay 200
  node scripts/cleanup-sessions.js --dry-run

Recommended Cron Schedule:
  # Run daily at 2 AM
  0 2 * * * cd /path/to/admin-api && node scripts/cleanup-sessions.js >> /var/log/session-cleanup.log 2>&1

Systemd Timer:
  # See docs/session-cleanup.md for systemd timer setup
`);
}

// Perform dry run (count without deleting)
async function performDryRun(options) {
  const { maxAge } = options;
  const database = getDatabase();
  const prisma = database.getClient();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - maxAge);

  console.log('[DRY RUN] Session cleanup simulation');
  console.log(`[DRY RUN] Cutoff date: ${cutoffDate.toISOString()}`);
  console.log(`[DRY RUN] Max age: ${maxAge} days`);
  console.log('');

  const count = await prisma.session.count({
    where: {
      expiresAt: {
        lt: cutoffDate,
      },
    },
  });

  const totalSessions = await prisma.session.count();

  console.log(`[DRY RUN] Total sessions: ${totalSessions}`);
  console.log(`[DRY RUN] Expired sessions to delete: ${count}`);
  console.log(`[DRY RUN] Sessions that would remain: ${totalSessions - count}`);
  console.log('');
  console.log('[DRY RUN] No sessions were deleted. Run without --dry-run to actually delete.');

  return { count, totalSessions };
}

// Main execution
async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  console.log('╔════════════════════════════════════════════╗');
  console.log('║   Admin-API Session Cleanup Script        ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('');

  // Validate options
  if (isNaN(options.batchSize) || options.batchSize <= 0) {
    console.error('Error: batch-size must be a positive number');
    process.exit(1);
  }

  if (isNaN(options.delayMs) || options.delayMs < 0) {
    console.error('Error: delay must be a non-negative number');
    process.exit(1);
  }

  if (isNaN(options.maxAge) || options.maxAge <= 0) {
    console.error('Error: max-age must be a positive number');
    process.exit(1);
  }

  const database = getDatabase();

  try {
    // Initialize database connection
    console.log('[init] Connecting to database...');
    await database.initialize();

    if (!database.isConfigured()) {
      console.error('[error] Database is not configured. Please set DATABASE_URL environment variable.');
      process.exit(1);
    }

    console.log('[init] Database connected successfully');
    console.log('');

    if (options.dryRun) {
      // Dry run mode
      await performDryRun(options);
    } else {
      // Actual cleanup
      console.log('[cleanup] Starting session cleanup...');
      console.log(`[cleanup] Batch size: ${options.batchSize}`);
      console.log(`[cleanup] Delay between batches: ${options.delayMs}ms`);
      console.log(`[cleanup] Max age: ${options.maxAge} days`);
      console.log('');

      const result = await database.cleanupExpiredSessionsBatched({
        batchSize: options.batchSize,
        delayMs: options.delayMs,
        maxAge: options.maxAge,
        onProgress: (batchNum, deletedCount, totalDeleted) => {
          // Progress is already logged by the cleanup function
        },
      });

      console.log('');
      console.log('╔════════════════════════════════════════════╗');
      console.log('║           Cleanup Summary                  ║');
      console.log('╚════════════════════════════════════════════╝');
      console.log(`Total deleted:      ${result.totalDeleted}`);
      console.log(`Batches processed:  ${result.batchesProcessed}`);
      console.log(`Duration:           ${result.duration}ms (${(result.duration / 1000).toFixed(2)}s)`);
      console.log('');

      if (result.totalDeleted === 0) {
        console.log('✓ No expired sessions found. Database is clean!');
      } else {
        console.log('✓ Session cleanup completed successfully!');
      }
    }

  } catch (error) {
    console.error('');
    console.error('╔════════════════════════════════════════════╗');
    console.error('║              Error                         ║');
    console.error('╚════════════════════════════════════════════╝');
    console.error(`${error.message}`);
    console.error('');

    if (process.env.DEBUG) {
      console.error('Stack trace:');
      console.error(error.stack);
    }

    process.exit(1);
  } finally {
    // Close database connection
    await database.close();
    console.log('[cleanup] Database connection closed');
  }
}

// Run the script
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
