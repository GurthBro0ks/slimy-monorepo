#!/usr/bin/env ts-node
/**
 * Slimy.ai Bootstrap CLI
 *
 * This script initializes the database and ensures an admin user exists.
 * It's safe to run multiple times (idempotent).
 *
 * Usage:
 *   pnpm bootstrap
 *   # or
 *   ts-node tools/bootstrap.ts
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

function logBanner() {
  console.log('\n' + colors.bright + colors.cyan + '╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║              🐌 Slimy.ai Bootstrap (v1.0)                ║');
  console.log('║                  claude-monobranch                        ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝' + colors.reset + '\n');
}

function logSection(title: string) {
  console.log('\n' + colors.bright + colors.blue + `▸ ${title}` + colors.reset);
}

function logSuccess(message: string) {
  console.log(colors.green + '  ✓ ' + message + colors.reset);
}

function logWarning(message: string) {
  console.log(colors.yellow + '  ⚠ ' + message + colors.reset);
}

function logError(message: string) {
  console.log(colors.red + '  ✗ ' + message + colors.reset);
}

function logInfo(message: string) {
  console.log(colors.cyan + '  ℹ ' + message + colors.reset);
}

/**
 * Check which required environment variables are set
 */
function checkRequiredEnv(envVars: string[]): { missing: string[]; present: string[] } {
  const missing: string[] = [];
  const present: string[] = [];

  for (const envVar of envVars) {
    if (process.env[envVar]) {
      present.push(envVar);
    } else {
      missing.push(envVar);
    }
  }

  return { missing, present };
}

/**
 * Ensure an admin user exists in the database
 */
async function ensureAdminUser(): Promise<void> {
  logSection('Admin User Setup');

  // Get admin Discord ID from env or use placeholder
  const adminDiscordId = process.env.INITIAL_ADMIN_DISCORD_ID || 'ADMIN_PLACEHOLDER_123';
  const adminUsername = process.env.INITIAL_ADMIN_USERNAME || 'admin';

  if (adminDiscordId === 'ADMIN_PLACEHOLDER_123') {
    logWarning('INITIAL_ADMIN_DISCORD_ID not set, using placeholder value');
    logInfo('Set INITIAL_ADMIN_DISCORD_ID in your .env file to create a real admin user');
  }

  try {
    // Upsert the admin user
    const user = await prisma.user.upsert({
      where: { discordId: adminDiscordId },
      create: {
        discordId: adminDiscordId,
        username: adminUsername,
        globalName: adminUsername,
      },
      update: {
        username: adminUsername,
        globalName: adminUsername,
      },
    });

    logSuccess(`Admin user ensured: ${user.username} (ID: ${user.id}, Discord: ${user.discordId})`);

    // Check if we should create/ensure a system guild with admin role
    const systemGuildDiscordId = process.env.SYSTEM_GUILD_DISCORD_ID || 'SYSTEM_GUILD_000';

    let systemGuild = await prisma.guild.findUnique({
      where: { discordId: systemGuildDiscordId },
    });

    if (!systemGuild) {
      systemGuild = await prisma.guild.create({
        data: {
          discordId: systemGuildDiscordId,
          name: 'System Administration',
          settings: {
            description: 'System-level administration and configuration',
          },
        },
      });
      logSuccess(`Created system guild: ${systemGuild.name} (ID: ${systemGuild.id})`);
    }

    // Ensure admin user is in system guild with admin role
    const userGuild = await prisma.userGuild.upsert({
      where: {
        userId_guildId: {
          userId: user.id,
          guildId: systemGuild.id,
        },
      },
      create: {
        userId: user.id,
        guildId: systemGuild.id,
        roles: ['admin', 'owner'],
      },
      update: {
        roles: ['admin', 'owner'],
      },
    });

    logSuccess(`Admin user assigned to system guild with roles: ${JSON.stringify(userGuild.roles)}`);
  } catch (error) {
    logError(`Failed to ensure admin user: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Print database statistics
 */
async function printDatabaseStats(): Promise<void> {
  logSection('Database Statistics');

  try {
    const [userCount, guildCount, sessionCount, chatMessageCount] = await Promise.all([
      prisma.user.count(),
      prisma.guild.count(),
      prisma.session.count(),
      prisma.chatMessage.count(),
    ]);

    logInfo(`Users: ${userCount}`);
    logInfo(`Guilds: ${guildCount}`);
    logInfo(`Active Sessions: ${sessionCount}`);
    logInfo(`Chat Messages: ${chatMessageCount}`);
  } catch (error) {
    logError(`Failed to fetch database stats: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Print environment variable status
 */
function printEnvStatus(): void {
  logSection('Environment Configuration');

  const requiredEnvVars = [
    'DATABASE_URL',
    'DISCORD_CLIENT_ID',
    'DISCORD_CLIENT_SECRET',
    'JWT_SECRET',
  ];

  const optionalEnvVars = [
    'OPENAI_API_KEY',
    'NEXT_PUBLIC_APP_URL',
    'INITIAL_ADMIN_DISCORD_ID',
  ];

  const { missing, present } = checkRequiredEnv(requiredEnvVars);

  if (present.length > 0) {
    logSuccess(`Required variables set: ${present.join(', ')}`);
  }

  if (missing.length > 0) {
    logWarning(`Missing required variables: ${missing.join(', ')}`);
  }

  // Check optional vars
  const optionalStatus = checkRequiredEnv(optionalEnvVars);
  if (optionalStatus.present.length > 0) {
    logInfo(`Optional variables set: ${optionalStatus.present.join(', ')}`);
  }
}

/**
 * Print suggested next steps
 */
function printNextSteps(): void {
  logSection('Next Steps');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://login.slimyai.xyz';

  logInfo(`1. Visit the login page: ${appUrl}`);
  logInfo('2. Run migrations if needed: pnpm --filter @slimy/admin-api prisma migrate deploy');
  logInfo('3. Start the services: pnpm dev');

  if (process.env.INITIAL_ADMIN_DISCORD_ID === 'ADMIN_PLACEHOLDER_123' || !process.env.INITIAL_ADMIN_DISCORD_ID) {
    logWarning('Remember to set INITIAL_ADMIN_DISCORD_ID to your real Discord ID');
  }
}

/**
 * Main bootstrap function
 */
async function main(): Promise<void> {
  try {
    logBanner();

    // Step 1: Check environment
    printEnvStatus();

    // Step 2: Test database connection
    logSection('Database Connection');
    await prisma.$connect();
    logSuccess('Connected to database successfully');

    // Step 3: Remind about migrations
    logSection('Database Migrations');
    logInfo('To apply pending migrations, run:');
    logInfo('  cd apps/admin-api && npx prisma migrate deploy');
    logInfo('Or check migration status:');
    logInfo('  cd apps/admin-api && npx prisma migrate status');

    // Step 4: Ensure admin user
    await ensureAdminUser();

    // Step 5: Print stats
    await printDatabaseStats();

    // Step 6: Print next steps
    printNextSteps();

    console.log('\n' + colors.bright + colors.green + '✓ Bootstrap completed successfully!' + colors.reset + '\n');
  } catch (error) {
    console.error('\n' + colors.bright + colors.red + '✗ Bootstrap failed!' + colors.reset);
    logError(error instanceof Error ? error.message : String(error));

    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the bootstrap
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { main as bootstrap };
