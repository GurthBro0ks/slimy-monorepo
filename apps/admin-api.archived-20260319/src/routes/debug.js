"use strict";

const express = require("express");
const { COOKIE_NAME, verifySession } = require("../../lib/jwt");
const { getSession } = require("../../lib/session-store");
const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");

const router = express.Router();

// Simple ping endpoint for health checks
// Public endpoint for load balancers and monitoring systems
router.get("/ping", (_req, res) => {
  res.json({ ok: true, now: new Date().toISOString() });
});

// Auth debugging endpoint - requires authentication to prevent information disclosure
// Only authenticated users can debug their own auth state
router.get("/auth/debug", requireAuth, (req, res) => {
  // If we reach here, requireAuth has already validated the user
  const user = req.user;

  if (!user) {
    // This should never happen if requireAuth works correctly
    return res.status(500).json({
      error: "auth-middleware-failure",
      message: "Authentication middleware succeeded but no user attached to request"
    });
  }

  // Guilds are stored in session store, not JWT (to keep JWT under 4KB)
  const sessionData = req.session || getSession(user.id);
  const guilds = Array.isArray(sessionData?.guilds) ? sessionData.guilds : [];

  return res.json({
    authenticated: true,
    user: {
      id: user.id,
      username: user.username,
      globalName: user.globalName,
      role: user.role || "member",
    },
    guildCount: guilds.length,
    sessionPresent: !!req.session,
  });
});

module.exports = router;
