/**
 * Database Client
 *
 * Provides a singleton Prisma client instance for database operations
 */

import { PrismaClient } from '@prisma/client';

// Extend PrismaClient type for global storage
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Create Prisma client instance with logging configuration
 */
function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });
}

// Use global variable in development to prevent multiple instances during hot reload
// In production, create a single instance
export const db =
  global.prisma ||
  createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = db;
}

/**
 * Gracefully disconnect from database
 */
export async function disconnectDb(): Promise<void> {
  await db.$disconnect();
}

/**
 * Test database connection
 */
export async function testDbConnection(): Promise<boolean> {
  try {
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

/**
 * Database health check
 */
export async function getDbHealth(): Promise<{
  healthy: boolean;
  responseTime: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    await db.$queryRaw`SELECT 1`;
    return {
      healthy: true,
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      healthy: false,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Export Prisma types for use in other files
export * from '@prisma/client';
