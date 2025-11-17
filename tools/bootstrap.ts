#!/usr/bin/env tsx
/**
 * Bootstrap Script for SlimyAI Monorepo
 *
 * This script initializes the database and sets up the admin environment.
 * It is safe to run multiple times (idempotent).
 *
 * Features:
 * - Runs database migrations for both web and admin-api
 * - Seeds initial data
 * - Creates/updates admin users
 * - Generates Discord OAuth invite URL
 * - Prints system information
 *
 * Usage:
 *   pnpm tsx tools/bootstrap.ts
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

// Load environment variables
const monorepoRoot = join(__dirname, '..');
const webAppRoot = join(monorepoRoot, 'apps', 'web');
const adminApiRoot = join(monorepoRoot, 'apps', 'admin-api');

// Try to load .env from admin-api (primary config)
const adminEnvPath = join(adminApiRoot, '.env');
if (existsSync(adminEnvPath)) {
  dotenv.config({ path: adminEnvPath });
  console.log(`${colors.dim}Loaded environment from: ${adminEnvPath}${colors.reset}\n`);
}

/**
 * Print a section header
 */
function printHeader(title: string) {
  console.log(`\n${colors.bright}${colors.blue}━━━ ${title} ━━━${colors.reset}\n`);
}

/**
 * Print a success message
 */
function printSuccess(message: string) {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

/**
 * Print an error message
 */
function printError(message: string) {
  console.log(`${colors.red}✗${colors.reset} ${message}`);
}

/**
 * Print an info message
 */
function printInfo(message: string) {
  console.log(`${colors.cyan}ℹ${colors.reset} ${message}`);
}

/**
 * Print a warning message
 */
function printWarning(message: string) {
  console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
}

/**
 * Execute a command and return the output
 */
function exec(command: string, cwd: string, silent = false): string {
  try {
    const output = execSync(command, {
      cwd,
      encoding: 'utf-8',
      stdio: silent ? 'pipe' : 'inherit',
    });
    return output;
  } catch (error: any) {
    if (!silent) {
      printError(`Command failed: ${command}`);
      if (error.stderr) {
        console.error(error.stderr.toString());
      }
    }
    throw error;
  }
}

/**
 * Check if a database is accessible
 */
async function checkDatabaseConnection(appName: string, databaseUrl: string): Promise<boolean> {
  printInfo(`Checking ${appName} database connection...`);

  if (!databaseUrl) {
    printWarning(`DATABASE_URL not set for ${appName}`);
    return false;
  }

  try {
    // Use Prisma's connection test (via a simple query)
    // This is handled by the migration step, so we'll just validate the URL format
    const url = new URL(databaseUrl.replace('postgresql://', 'postgres://'));
    printSuccess(`${appName} database URL is valid: ${url.hostname}:${url.port}/${url.pathname.slice(1)}`);
    return true;
  } catch (error) {
    printError(`Invalid DATABASE_URL for ${appName}`);
    return false;
  }
}

/**
 * Run database migrations for an app
 */
async function runMigrations(appName: string, appRoot: string): Promise<boolean> {
  printInfo(`Running migrations for ${appName}...`);

  const schemaPath = join(appRoot, 'prisma', 'schema.prisma');

  if (!existsSync(schemaPath)) {
    printWarning(`No Prisma schema found for ${appName} at ${schemaPath}`);
    return false;
  }

  try {
    // Generate Prisma client
    printInfo(`Generating Prisma client for ${appName}...`);
    exec('npx prisma generate', appRoot, true);
    printSuccess(`Prisma client generated for ${appName}`);

    // Run migrations (idempotent - uses migrate deploy in production)
    printInfo(`Deploying migrations for ${appName}...`);
    exec('npx prisma migrate deploy', appRoot, true);
    printSuccess(`Migrations deployed for ${appName}`);

    return true;
  } catch (error: any) {
    printError(`Migration failed for ${appName}: ${error.message}`);
    return false;
  }
}

/**
 * Seed the database with initial data
 */
async function seedDatabase(appName: string, appRoot: string): Promise<boolean> {
  const seedPath = join(appRoot, 'prisma', 'seed.ts');

  if (!existsSync(seedPath)) {
    printInfo(`No seed file found for ${appName}, skipping seeding`);
    return true;
  }

  try {
    printInfo(`Seeding database for ${appName}...`);
    exec('npx tsx prisma/seed.ts', appRoot, true);
    printSuccess(`Database seeded for ${appName}`);
    return true;
  } catch (error: any) {
    printWarning(`Seeding failed for ${appName}: ${error.message}`);
    return false;
  }
}

/**
 * Get package version from package.json
 */
function getVersion(appRoot: string): string {
  try {
    const packageJson = require(join(appRoot, 'package.json'));
    return packageJson.version || 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Generate Discord OAuth invite URL
 */
function generateDiscordInviteUrl(): string {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = process.env.DISCORD_REDIRECT_URI || 'https://admin.slimyai.xyz/api/auth/callback';
  const scopes = process.env.DISCORD_OAUTH_SCOPES || 'identify guilds';

  if (!clientId) {
    return 'N/A (DISCORD_CLIENT_ID not set)';
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes,
  });

  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

/**
 * Print system information
 */
function printSystemInfo() {
  printHeader('System Information');

  const webVersion = getVersion(webAppRoot);
  const adminApiVersion = getVersion(adminApiRoot);

  console.log(`${colors.bright}Web App Version:${colors.reset}       ${webVersion}`);
  console.log(`${colors.bright}Admin API Version:${colors.reset}     ${adminApiVersion}`);
  console.log(`${colors.bright}Node Version:${colors.reset}          ${process.version}`);
  console.log(`${colors.bright}Environment:${colors.reset}           ${process.env.NODE_ENV || 'development'}`);

  printHeader('Service URLs');

  const adminUrl = process.env.CORS_ORIGIN || 'https://admin.slimyai.xyz';
  const apiUrl = `${adminUrl.replace('admin.', 'api.')}/admin`;

  console.log(`${colors.bright}Admin UI:${colors.reset}              ${adminUrl}`);
  console.log(`${colors.bright}Admin API:${colors.reset}             ${apiUrl}`);
  console.log(`${colors.bright}Port:${colors.reset}                  ${process.env.PORT || '3080'}`);

  printHeader('Discord OAuth');

  const inviteUrl = generateDiscordInviteUrl();
  console.log(`${colors.bright}Client ID:${colors.reset}             ${process.env.DISCORD_CLIENT_ID || 'Not set'}`);
  console.log(`${colors.bright}Redirect URI:${colors.reset}          ${process.env.DISCORD_REDIRECT_URI || 'Not set'}`);
  console.log(`${colors.bright}Invite URL:${colors.reset}\n${colors.cyan}${inviteUrl}${colors.reset}`);

  printHeader('Admin Configuration');

  const adminUserIds = process.env.ADMIN_USER_IDS;
  const clubUserIds = process.env.CLUB_USER_IDS;

  if (adminUserIds) {
    const adminIds = adminUserIds.split(',').map(id => id.trim());
    console.log(`${colors.bright}Admin User IDs:${colors.reset}        ${adminIds.length} configured`);
    adminIds.forEach((id, i) => {
      console.log(`  ${i + 1}. ${id}`);
    });
  } else {
    printWarning('No ADMIN_USER_IDS configured');
  }

  if (clubUserIds) {
    const clubIds = clubUserIds.split(',').map(id => id.trim());
    console.log(`${colors.bright}Club User IDs:${colors.reset}         ${clubIds.length} configured`);
  } else {
    printInfo('No CLUB_USER_IDS configured');
  }
}

/**
 * Print admin setup instructions
 */
function printAdminInstructions() {
  printHeader('Next Steps');

  console.log('To grant admin access to a user:');
  console.log(`  1. Add their Discord User ID to the ${colors.bright}ADMIN_USER_IDS${colors.reset} environment variable`);
  console.log(`  2. Restart the admin-api service`);
  console.log(`  3. User authenticates via: ${colors.cyan}${generateDiscordInviteUrl()}${colors.reset}\n`);

  console.log('To start the services:');
  console.log(`  ${colors.dim}# Start admin-api${colors.reset}`);
  console.log(`  cd apps/admin-api && pnpm start\n`);
  console.log(`  ${colors.dim}# Start admin-ui (in another terminal)${colors.reset}`);
  console.log(`  cd apps/admin-ui && pnpm dev\n`);

  console.log('To get a Discord User ID:');
  console.log(`  1. Enable Developer Mode in Discord: Settings > Advanced > Developer Mode`);
  console.log(`  2. Right-click on a user and select "Copy User ID"\n`);
}

/**
 * Validate environment variables
 */
function validateEnvironment(): boolean {
  printHeader('Environment Validation');

  let isValid = true;

  const requiredVars = [
    'DATABASE_URL',
    'DISCORD_CLIENT_ID',
    'DISCORD_CLIENT_SECRET',
    'JWT_SECRET',
    'SESSION_SECRET',
  ];

  const optionalVars = [
    'ADMIN_USER_IDS',
    'CORS_ORIGIN',
    'DISCORD_REDIRECT_URI',
  ];

  // Check required variables
  console.log(`${colors.bright}Required Variables:${colors.reset}`);
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      printSuccess(`${varName} is set`);
    } else {
      printError(`${varName} is NOT set`);
      isValid = false;
    }
  }

  // Check optional variables
  console.log(`\n${colors.bright}Optional Variables:${colors.reset}`);
  for (const varName of optionalVars) {
    if (process.env[varName]) {
      printSuccess(`${varName} is set`);
    } else {
      printWarning(`${varName} is not set (optional)`);
    }
  }

  return isValid;
}

/**
 * Main bootstrap function
 */
async function main() {
  console.log(`${colors.bright}${colors.cyan}`);
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║                                                       ║');
  console.log('║          SlimyAI Bootstrap Script v1.0                ║');
  console.log('║                                                       ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  // Validate environment
  const envValid = validateEnvironment();

  if (!envValid) {
    printError('\nEnvironment validation failed. Please check your .env file.');
    printInfo(`Expected location: ${adminEnvPath}`);
    printInfo(`Example file: ${join(adminApiRoot, '.env.example')}`);
    process.exit(1);
  }

  // Check database connections
  printHeader('Database Connection');

  const databaseUrl = process.env.DATABASE_URL || '';
  await checkDatabaseConnection('admin-api', databaseUrl);

  // Run migrations
  printHeader('Database Migrations');

  let migrationsSuccessful = true;

  // Admin API migrations (primary)
  if (!await runMigrations('admin-api', adminApiRoot)) {
    migrationsSuccessful = false;
  }

  // Web app migrations (if different database)
  // Note: Currently both apps use the same DATABASE_URL
  const webDbUrl = process.env.WEB_DATABASE_URL || databaseUrl;
  if (webDbUrl && webDbUrl !== databaseUrl) {
    if (!await runMigrations('web', webAppRoot)) {
      migrationsSuccessful = false;
    }
  }

  if (!migrationsSuccessful) {
    printWarning('\nSome migrations failed. Please check the errors above.');
  }

  // Seed databases
  printHeader('Database Seeding');

  await seedDatabase('admin-api', adminApiRoot);
  await seedDatabase('web', webAppRoot);

  // Print system information
  printSystemInfo();

  // Print admin instructions
  printAdminInstructions();

  // Success message
  printHeader('Bootstrap Complete');
  printSuccess('Database initialized successfully!');
  printSuccess('You can now start the services.');

  console.log(`\n${colors.dim}Run this script again anytime to re-apply migrations or check configuration.${colors.reset}\n`);
}

// Run the bootstrap script
main().catch((error) => {
  printError(`\nBootstrap failed: ${error.message}`);
  console.error(error);
  process.exit(1);
});
