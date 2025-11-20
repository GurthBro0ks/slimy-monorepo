"use strict";

/**
 * Database Guard Middleware
 *
 * Provides middleware to protect routes that require database access
 * and handle degraded mode gracefully.
 */

const database = require("../lib/database");
const { DatabaseError } = require("../lib/errors");
const { DatabaseMode } = require("../lib/database");

/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 * @typedef {import('express').NextFunction} NextFunction
 */

/**
 * Middleware to require database availability
 * Returns 503 Service Unavailable if database is not available
 *
 * @param {Object} options
 * @param {boolean} options.allowDegraded - Allow degraded mode (default: false)
 * @returns {Function} Express middleware
 */
function requireDatabase(options = {}) {
  const { allowDegraded = false } = options;

  return (req, res, next) => {
    const status = database.getStatus();

    // Database is connected - all good
    if (status.mode === DatabaseMode.CONNECTED) {
      return next();
    }

    // Database is in degraded mode
    if (allowDegraded && status.mode === DatabaseMode.DEGRADED) {
      // Add warning to response headers
      res.setHeader("X-Database-Mode", "DEGRADED");
      res.setHeader("X-Database-Warning", "Database operating in degraded mode");
      return next();
    }

    // Database is not available
    const error = new DatabaseError(
      "This feature requires database access which is currently unavailable",
      {
        mode: status.mode,
        reason: status.error || "Database not initialized",
      }
    );

    return next(error);
  };
}

/**
 * Middleware to add database status to request object
 * Always passes through - does not block the request
 *
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {NextFunction} next - Next middleware function
 */
function attachDatabaseStatus(req, res, next) {
  req.dbStatus = database.getStatus();
  req.dbAvailable = database.isAvailable();
  return next();
}

/**
 * Wrap an async database operation with error handling
 * Converts database errors to appropriate HTTP responses
 *
 * @param {Function} fn - Async function that performs database operations
 * @returns {Function} Wrapped function with error handling
 */
function withDatabaseErrorHandling(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      // Prisma error codes
      if (error.code === "P2002") {
        // Unique constraint violation
        throw new DatabaseError("A record with this value already exists", {
          field: error.meta?.target,
          prismaCode: error.code,
        });
      } else if (error.code === "P2025") {
        // Record not found
        const { NotFoundError } = require("../lib/errors");
        throw new NotFoundError("The requested record was not found", {
          prismaCode: error.code,
        });
      } else if (error.code === "P2003") {
        // Foreign key constraint violation
        throw new DatabaseError("Cannot perform operation due to related records", {
          prismaCode: error.code,
        });
      } else if (error.code?.startsWith("P")) {
        // Other Prisma errors
        throw new DatabaseError("Database operation failed", {
          prismaCode: error.code,
          message: error.message,
        });
      }

      // Re-throw if not a database error
      throw error;
    }
  };
}

module.exports = {
  requireDatabase,
  attachDatabaseStatus,
  withDatabaseErrorHandling,
};
