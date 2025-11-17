import { defineWorkspace } from 'vitest/config';

/**
 * Vitest Workspace Configuration
 * Allows running tests with different environments
 */
export default defineWorkspace([
  // Backend tests (Node environment)
  {
    extends: './vitest.config.ts',
    test: {
      name: 'backend',
      environment: 'node',
      include: ['tests/backend/**/*.{test,spec}.{ts,tsx}'],
    },
  },

  // Frontend tests (jsdom environment)
  {
    extends: './vitest.config.ts',
    test: {
      name: 'frontend',
      environment: 'jsdom',
      include: ['tests/frontend/**/*.{test,spec}.{ts,tsx}'],
      setupFiles: ['./tests/frontend-setup.ts'],
    },
  },
]);
