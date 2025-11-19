"use strict";

function validateBody(schema) {
  return (req, res, next) => {
    const parseResult = schema.safeParse(req.body);
    if (!parseResult.success) {
      const fieldErrors = parseResult.error.errors.map((err) => ({
        field: err.path.join('.') || 'body',
        message: err.message,
      }));

      return res.status(400).json({
        ok: false,
        error: {
          code: "INVALID_REQUEST",
          message: "Request validation failed",
          details: fieldErrors,
        },
      });
    }

    req.validated = req.validated || {};
    req.validated.body = parseResult.data;
    return next();
  };
}

function validateQuery(schema) {
  return (req, res, next) => {
    const parseResult = schema.safeParse(req.query);
    if (!parseResult.success) {
      const fieldErrors = parseResult.error.errors.map((err) => ({
        field: err.path.join('.') || 'query',
        message: err.message,
      }));

      return res.status(400).json({
        ok: false,
        error: {
          code: "INVALID_REQUEST",
          message: "Query validation failed",
          details: fieldErrors,
        },
      });
    }

    req.validated = req.validated || {};
    req.validated.query = parseResult.data;
    return next();
  };
}

module.exports = {
  validateBody,
  validateQuery,
};
