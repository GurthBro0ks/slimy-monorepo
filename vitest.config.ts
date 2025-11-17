import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Root-level Vitest Configuration
 * Handles both backend (Node) and frontend (jsdom) tests
 */
export default defineConfig({
  test: {
    // Run tests in multiple environments
    // Backend tests use 'node', frontend tests use 'jsdom'
    environment: 'node',

    // Global test utilities
    globals: true,

    // Test file patterns
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],

    // Exclude patterns
    exclude: [
      'node_modules',
      'dist',
      '.next',
      'coverage',
      'apps/*/tests/**', // Exclude app-specific tests (they run separately)
      'test-results',
      'playwright-report',
    ],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '.next/',
        'coverage/',
        '**/*.d.ts',
        '**/*.config.*',
        'test-results/',
        'playwright-report/',
        '**/vendor/**',
      ],
      thresholds: {
        global: {
          branches: 50,
          functions: 50,
          lines: 50,
          statements: 50,
        },
      },
    },

    // Test timeout
    testTimeout: 10000,

    // Hook timeout
    hookTimeout: 10000,

    // Teardown timeout
    teardownTimeout: 10000,

    // Allow global setup/teardown
    // setupFiles: ['./tests/setup.ts'], // Uncomment if needed
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
