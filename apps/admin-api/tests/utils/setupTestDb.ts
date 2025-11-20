/**
 * Test database setup and teardown utilities
 * Manages a separate test database connection and runs migrations
 */

import { PrismaClient } from '@prisma/client';

let testPrismaClient: PrismaClient | null = null;

/**
 * Initialize test database with fresh migrations
 * Call this in beforeAll() hook
 */
export async function setupTestDb(): Promise<PrismaClient> {
  // Use test database URL from environment or fallback to test variant
  const databaseUrl = process.env.DATABASE_URL_TEST ||
    process.env.DATABASE_URL?.replace('/slimy', '/slimy_test') ||
    'postgresql://slimy:slimy_dev_password@localhost:5432/slimy_test?schema=public';

  testPrismaClient = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  try {
    // Test the connection
    await testPrismaClient.$executeRawUnsafe('SELECT 1');
    console.log('✓ Test database connection successful');

    return testPrismaClient;
  } catch (error) {
    console.error('✗ Failed to connect to test database:', error);
    throw error;
  }
}

/**
 * Clean up all data from test database
 * Call this in afterEach() hook to ensure test isolation
 */
export async function cleanTestDb(): Promise<void> {
  if (!testPrismaClient) {
    throw new Error('Test database not initialized. Call setupTestDb() first.');
  }

  try {
    // Delete in order of foreign key dependencies
    // Note: Order matters! Delete child records before parents

    await testPrismaClient.webhookDelivery.deleteMany({});
    await testPrismaClient.webhook.deleteMany({});

    await testPrismaClient.auditLog.deleteMany({});

    await testPrismaClient.screenshotComparison.deleteMany({});
    await testPrismaClient.screenshotRecommendation.deleteMany({});
    await testPrismaClient.screenshotInsight.deleteMany({});
    await testPrismaClient.screenshotTag.deleteMany({});
    await testPrismaClient.screenshotData.deleteMany({});
    await testPrismaClient.screenshotAnalysis.deleteMany({});

    await testPrismaClient.clubMetric.deleteMany({});
    await testPrismaClient.clubAnalysisImage.deleteMany({});
    await testPrismaClient.clubAnalysis.deleteMany({});

    await testPrismaClient.correction.deleteMany({});
    await testPrismaClient.guildPersonality.deleteMany({});
    await testPrismaClient.guildSettings.deleteMany({});

    await testPrismaClient.chatMessage.deleteMany({});
    await testPrismaClient.conversation.deleteMany({});
    await testPrismaClient.stat.deleteMany({});

    await testPrismaClient.userGuild.deleteMany({});
    await testPrismaClient.session.deleteMany({});

    await testPrismaClient.user.deleteMany({});
    await testPrismaClient.guild.deleteMany({});

    console.log('✓ Test database cleaned');
  } catch (error) {
    console.error('✗ Failed to clean test database:', error);
    throw error;
  }
}

/**
 * Close test database connection
 * Call this in afterAll() hook
 */
export async function teardownTestDb(): Promise<void> {
  if (testPrismaClient) {
    await testPrismaClient.$disconnect();
    testPrismaClient = null;
    console.log('✓ Test database connection closed');
  }
}

/**
 * Get the test Prisma client instance
 */
export function getTestPrismaClient(): PrismaClient {
  if (!testPrismaClient) {
    throw new Error('Test database not initialized. Call setupTestDb() first.');
  }
  return testPrismaClient;
}
