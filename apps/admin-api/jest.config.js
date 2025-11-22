/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  rootDir: ".",
  testMatch: ["**/tests/**/*.test.[jt]s?(x)"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleFileExtensions: ["js", "jsx", "json"],
  transform: {},
  moduleNameMapper: {
    // @slimy/core vendor bundle requires ../../lib/numparse; point it at repo root helper.
    "^../../lib/numparse$": "<rootDir>/../../lib/numparse.js",
  },
  // Keep console output so we can see logs from tests
  silent: false,
};
