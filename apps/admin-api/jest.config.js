module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js', '**/tests/**/*.smoke.test.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
  ],
  testTimeout: 10000,
  verbose: true,
  moduleNameMapper: {
    // Redirect missing parent lib imports to local lib stubs
    '^../../lib/week-anchor$': '<rootDir>/lib/week-anchor.js',
    '^../../lib/club-corrections$': '<rootDir>/lib/club-corrections.js',
    '^../../lib/guild-settings$': '<rootDir>/lib/guild-settings.js',
    '^../../lib/thresholds$': '<rootDir>/lib/thresholds.js',
    '^../../lib/numparse$': '<rootDir>/__mocks__/numparse.js',
  },
};
