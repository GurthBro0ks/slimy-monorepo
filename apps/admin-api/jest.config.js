/** @type {import('jest').Config} */
module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Test match patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/src/**/*.test.js',
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
  ],

  // Coverage thresholds (can be adjusted)
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },

  // Module paths
  moduleDirectories: ['node_modules', '<rootDir>'],

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Timeout for tests (in ms)
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Transform ESM dependencies that need transpiling (e.g., nanoid)
  transformIgnorePatterns: [
    "/node_modules/(?!nanoid/)",
  ],

  // Provide a CJS-friendly mock for ESM-only deps
  moduleNameMapper: {
    "^nanoid$": "<rootDir>/tests/__mocks__/nanoid.js",
  },
};
