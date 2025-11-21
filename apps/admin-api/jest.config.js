/**
 * Jest configuration for admin-api
 */
const path = require('path');

module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/tests/**/*.test.js',
    '**/src/**/*.test.js',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!**/node_modules/**',
  ],
  // Map lib/* imports to monorepo root lib directory
  moduleNameMapper: {
    '^lib/(.*)$': '<rootDir>/../../lib/$1',
  },
  // Increase timeout for integration tests
  testTimeout: 10000,
  // Show individual test results
  verbose: true,
};
