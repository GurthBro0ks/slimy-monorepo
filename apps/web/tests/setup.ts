import '@testing-library/jest-dom';

import fs from 'node:fs';
import path from 'node:path';
import { config as dotenvConfig } from 'dotenv';

// Set required environment variables for all tests
process.env.NEXT_PUBLIC_ADMIN_API_BASE = 'https://admin.example.test';
process.env.NEXT_PUBLIC_SNELP_CODES_URL = 'https://snelp.example.test/api/codes';

const testEnvPath = path.resolve(__dirname, '..', '.env.test.local');
if (fs.existsSync(testEnvPath)) {
  dotenvConfig({ path: testEnvPath, override: true });
}

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl && (databaseUrl.toLowerCase().includes('prod') || /slimyai_prod/i.test(databaseUrl))) {
  throw new Error(
    `Refusing to run tests: DATABASE_URL appears to point to production (${databaseUrl}). ` +
      'Use apps/web/.env.test.local with a safe *_test database, or rely on Prisma mocks.'
  );
}

// Tests mock Prisma; DATABASE_URL is only a safe placeholder to satisfy Prisma initialization paths.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'mysql://slimy_test:CHANGE_ME@127.0.0.1:3306/slimyai_test';
}
