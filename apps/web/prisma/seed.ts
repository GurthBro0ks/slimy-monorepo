/**
 * Database Seed Script for Web App
 *
 * This script seeds the database with initial data.
 * It is safe to run multiple times (idempotent).
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed example club analyses
 */
async function seedClubAnalyses() {
  console.log('Seeding club analyses...');

  // Note: In production, club analyses are created by users
  // This is just example data for testing

  console.log('✓ No example data created (club analyses are user-generated)');
}

/**
 * Seed example feature flags
 */
async function seedFeatureFlags() {
  console.log('Seeding feature flags...');

  // Example guild feature flags
  const exampleFlags = await prisma.guildFeatureFlags.upsert({
    where: { guildId: 'example_guild_id' },
    update: {},
    create: {
      guildId: 'example_guild_id',
      colorPrimary: '#3b82f6',
      badgeStyle: 'rounded',
      ensembleOCR: false,
      secondApprover: false,
      askManus: true,
      publicStats: true,
    },
  });

  console.log(`✓ Seeded feature flags for guild: ${exampleFlags.guildId}`);
}

/**
 * Main seed function
 */
async function main() {
  console.log('🌱 Starting web app database seed...\n');

  try {
    await seedClubAnalyses();
    await seedFeatureFlags();

    console.log('\n✅ Web app database seeded successfully!\n');
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
