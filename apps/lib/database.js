/**
 * Minimal database stub for monorepo root.
 * Real implementation should use the database module from admin-api/lib/database.js
 * or a proper shared database package.
 *
 * This stub provides a minimal mock interface to prevent import errors during tests.
 */

/**
 * Mock pool object
 */
const pool = {
  query: async (sql, params) => [[]], // Returns empty result set
  getConnection: async () => ({
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
    query: async (sql, params) => [[]],
    execute: async (sql, params) => [[]],
  }),
  end: async () => {},
};

/**
 * Get the database pool
 * @returns {Object} Mock database pool
 */
function getPool() {
  return pool;
}

/**
 * Execute a query
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Empty result set
 */
async function query(sql, params = []) {
  return [];
}

/**
 * Execute a query and return first row
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object|null>} Null result
 */
async function one(sql, params = []) {
  return null;
}

/**
 * Execute a transaction
 * @param {Function} fn - Transaction function
 * @returns {Promise<any>} Result of transaction function
 */
async function tx(fn) {
  const mockConn = {
    query: async (s, p) => [],
    execute: async (s, p) => [[]],
  };
  return fn(mockConn);
}

module.exports = {
  pool,
  getPool,
  query,
  one,
  tx,
};
