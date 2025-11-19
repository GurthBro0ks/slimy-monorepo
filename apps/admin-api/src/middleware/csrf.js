"use strict";

const config = require("../config");
const { AuthenticationError, AuthorizationError } = require("../lib/errors");

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function requireCsrf(req, res, next) {
  if (SAFE_METHODS.has(req.method.toUpperCase())) {
    return next();
  }

  if (!req.user?.csrfToken) {
    return next(new AuthenticationError("Authentication required"));
  }

  const headerName = config.csrf.headerName;
  const headerValue =
    req.headers?.[headerName] || req.headers?.[headerName.toLowerCase()];

  if (!headerValue || headerValue !== req.user.csrfToken) {
    return next(new AuthorizationError("Invalid or missing CSRF token"));
  }

  return next();
}

module.exports = { requireCsrf };
