"use strict";

const { v4: uuidv4 } = require("uuid");

/**
 * Request ID middleware
 * Generates a unique request ID and adds it to request/response
 */
function requestIdMiddleware(req, res, next) {
  // Get request ID from header or generate new one
  const headerId = req.headers["x-request-id"];
  const generatedId = typeof uuidv4 === "function" ? uuidv4() : null;
  const requestId =
    headerId ||
    generatedId ||
    `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  // Add to request/response, always as a string to avoid invalid header values
  req.id = String(requestId);
  res.setHeader("X-Request-ID", String(requestId));
  
  next();
}

module.exports = requestIdMiddleware;
