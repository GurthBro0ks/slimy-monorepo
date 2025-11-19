"use strict";

const express = require("express");
const { COOKIE_NAME, verifySession } = require("../../lib/jwt");
const { getSession } = require("../../lib/session-store");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Simple ping endpoint for health checks
router.get("/ping", (_req, res) => {
  res.json({ ok: true, now: new Date().toISOString() });
});

// Auth debugging endpoint - REQUIRES AUTHENTICATION
// This endpoint exposes session data and MUST be protected
router.get("/auth/debug", requireAuth, (req, res) => {
  // User is already authenticated and available on req.user
  const user = req.user;

  // Guilds are stored in session store, not JWT (to keep JWT under 4KB)
  const sessionData = getSession(user.id);
  const guilds = Array.isArray(sessionData?.guilds) ? sessionData.guilds : [];

  return res.json({
    ok: true,
    authenticated: true,
    user: {
      id: user.id,
      username: user.username,
      globalName: user.globalName,
      role: user.role || "member",
    },
    guildCount: guilds.length,
  });
});

module.exports = router;
