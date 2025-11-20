"use strict";

const express = require("express");
const jwt = require("jsonwebtoken");
const { exchangeCode, fetchUserProfile } = require("../../services/oauth");
const logger = require("../../../lib/logger");

const router = express.Router();

// Mock database for user storage (replace with real DB in production)
const mockUsers = new Map();

/**
 * GET /api/auth/discord
 * OAuth callback endpoint - exchanges authorization code for Discord user info
 * and creates a session
 */
router.get("/discord", async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: "Missing authorization code" });
    }

    // Exchange code with Discord OAuth2
    logger.info("[auth/discord] Exchanging code with Discord");
    const tokenData = await exchangeCode(code);
    const { access_token: accessToken } = tokenData;

    // Fetch user profile from Discord
    logger.info("[auth/discord] Fetching user profile");
    const discordUser = await fetchUserProfile(accessToken);

    // Mock DB upsert - store or update user
    const userId = discordUser.id;
    const user = {
      id: userId,
      username: discordUser.username,
      globalName: discordUser.globalName,
      avatar: discordUser.avatar,
      discriminator: discordUser.discriminator,
      updatedAt: new Date().toISOString(),
    };

    mockUsers.set(userId, user);
    logger.info("[auth/discord] User upserted in mock DB", { userId });

    // Sign JWT with userId using process.env.JWT_SECRET
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error("[auth/discord] JWT_SECRET not configured");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const token = jwt.sign(
      { userId, username: user.username },
      jwtSecret,
      { expiresIn: "12h", algorithm: "HS256" }
    );

    // Set cookie with httpOnly + secure flags
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 12 * 60 * 60 * 1000, // 12 hours in milliseconds
    };

    // Set domain if configured
    if (process.env.COOKIE_DOMAIN) {
      cookieOptions.domain = process.env.COOKIE_DOMAIN;
    }

    res.cookie("session", token, cookieOptions);

    logger.info("[auth/discord] Session created successfully", { userId });

    // Redirect to success page or return success response
    const redirectUrl = process.env.ADMIN_REDIRECT_SUCCESS || "http://localhost:3081";
    res.redirect(redirectUrl);

  } catch (error) {
    logger.error("[auth/discord] OAuth callback failed", { error: error.message });
    res.status(500).json({ error: "Authentication failed" });
  }
});

/**
 * GET /api/auth/logout
 * Clears the session cookie and logs the user out
 */
router.get("/logout", (req, res) => {
  try {
    // Clear the session cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    };

    // Set domain if configured (must match the domain used when setting)
    if (process.env.COOKIE_DOMAIN) {
      cookieOptions.domain = process.env.COOKIE_DOMAIN;
    }

    res.clearCookie("session", cookieOptions);

    logger.info("[auth/discord] User logged out");

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    logger.error("[auth/discord] Logout failed", { error: error.message });
    res.status(500).json({ error: "Logout failed" });
  }
});

// Export mock users for testing purposes
router._mockUsers = mockUsers;

module.exports = router;
