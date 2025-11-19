"use strict";

const rateLimit = require("express-rate-limit");

const config = require("../config");
const { formatErrorResponse } = require("../lib/errors");

const tasksLimiter = rateLimit({
  windowMs: config.rateLimit.tasks.windowMs,
  max: config.rateLimit.tasks.max,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userId = req.user?.sub || req.ip;
    const guildId = req.params?.guildId || "global";
    return `${userId}:${guildId}`;
  },
  handler: (req, res) => {
    const requestId = req.id || req.headers["x-request-id"] || "unknown";
    res.status(429).json({
      ok: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests. Please try again later.",
        requestId,
      },
    });
  },
});

module.exports = { tasksLimiter };
