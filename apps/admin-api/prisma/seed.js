/**
 * Database Seed Script for Admin API
 *
 * This script seeds the database with initial data.
 * It is safe to run multiple times (idempotent).
 *
 * Admin users are managed via ADMIN_USER_IDS environment variable.
 * This seed file can create sample data for testing.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Seed example guilds (Discord servers)
 */
async function seedGuilds() {
  console.log('Seeding guilds...');

  // Example guild - only create if it doesn't exist
  const exampleGuild = await prisma.guild.upsert({
    where: { discordId: 'example_guild_id' },
    update: {},
    create: {
      discordId: 'example_guild_id',
      name: 'Example Guild',
      settings: {
        features: {
          analytics: true,
          screenshots: true,
        },
      },
    },
  });

  console.log(`✓ Seeded guild: ${exampleGuild.name} (${exampleGuild.id})`);
  return exampleGuild;
}

/**
 * Seed example users
 * Note: Real users are created via Discord OAuth flow
 */
async function seedUsers() {
  console.log('Seeding users...');

  // Note: Admin users are authenticated via Discord OAuth
  // Their admin status is determined by the ADMIN_USER_IDS environment variable
  // This is just an example for testing purposes

  const exampleUser = await prisma.user.upsert({
    where: { discordId: 'example_user_id' },
    update: {},
    create: {
      discordId: 'example_user_id',
      username: 'example_user',
      globalName: 'Example User',
      avatar: null,
    },
  });

  console.log(`✓ Seeded user: ${exampleUser.username} (${exampleUser.id})`);
  return exampleUser;
}

/**
 * Clean up expired sessions
 */
async function cleanupSessions() {
  console.log('Cleaning up expired sessions...');

  const now = new Date();
  const result = await prisma.session.deleteMany({
    where: {
      expiresAt: {
        lt: now,
      },
    },
  });

  console.log(`✓ Deleted ${result.count} expired sessions`);
}

/**
 * Main seed function
 */
async function main() {
  console.log('🌱 Starting database seed...\n');

  try {
    // Seed guilds
    await seedGuilds();

    // Seed users (example only)
    await seedUsers();

    // Clean up old sessions
    await cleanupSessions();

    console.log('\n✅ Database seeded successfully!');
    console.log('\nℹ️  Admin users are authenticated via Discord OAuth.');
    console.log('   Add Discord User IDs to ADMIN_USER_IDS environment variable to grant admin access.\n');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

// Run the seed script
main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
