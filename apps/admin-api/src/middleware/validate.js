"use strict";

const { ValidationError } = require("../lib/errors");

/**
 * Format Zod validation errors into a consistent structure
 * @param {import('zod').ZodError} zodError
 * @returns {Array<{field: string, message: string, code: string}>}
 */
function formatZodErrors(zodError) {
  return zodError.errors.map((err) => ({
    field: err.path.join(".") || "root",
    message: err.message,
    code: err.code,
  }));
}

/**
 * Validate request body against a Zod schema
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware
 */
function validateBody(schema) {
  return (req, res, next) => {
    const parseResult = schema.safeParse(req.body);
    if (!parseResult.success) {
      const formattedErrors = formatZodErrors(parseResult.error);
      const error = new ValidationError("Request body validation failed", {
        fields: formattedErrors,
      });
      return next(error);
    }

    req.validated = req.validated || {};
    req.validated.body = parseResult.data;
    return next();
  };
}

/**
 * Validate request query parameters against a Zod schema
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware
 */
function validateQuery(schema) {
  return (req, res, next) => {
    const parseResult = schema.safeParse(req.query);
    if (!parseResult.success) {
      const formattedErrors = formatZodErrors(parseResult.error);
      const error = new ValidationError("Query parameter validation failed", {
        fields: formattedErrors,
      });
      return next(error);
    }

    req.validated = req.validated || {};
    req.validated.query = parseResult.data;
    return next();
  };
}

/**
 * Validate request route parameters against a Zod schema
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware
 */
function validateParams(schema) {
  return (req, res, next) => {
    const parseResult = schema.safeParse(req.params);
    if (!parseResult.success) {
      const formattedErrors = formatZodErrors(parseResult.error);
      const error = new ValidationError("Route parameter validation failed", {
        fields: formattedErrors,
      });
      return next(error);
    }

    req.validated = req.validated || {};
    req.validated.params = parseResult.data;
    return next();
  };
}

module.exports = {
  validateBody,
  validateQuery,
  validateParams,
  formatZodErrors,
};
