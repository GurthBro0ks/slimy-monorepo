"use strict";

const express = require("express");
const { requireAuth } = require("../middleware/auth");
const database = require("../lib/database");

const router = express.Router();

/**
 * GET /api/profile/me
 * Get the current user's profile
 */
router.get("/me", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const prisma = database.getClient();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        discordId: true,
        username: true,
        globalName: true,
        avatar: true,
        displayName: true,
        avatarUrl: true,
        timezone: true,
        preferences: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("[profile] Error fetching profile:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

/**
 * PATCH /api/profile/me
 * Update the current user's profile
 */
router.patch("/me", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { displayName, avatarUrl, timezone, preferences } = req.body;

    // Build update object with only provided fields
    const updateData = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (preferences !== undefined) {
      // Validate that preferences is an object
      if (typeof preferences !== "object" || Array.isArray(preferences)) {
        return res.status(400).json({
          error: "preferences must be a valid JSON object",
        });
      }
      updateData.preferences = preferences;
    }

    // Check if there are any fields to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: "No valid fields to update",
      });
    }

    const prisma = database.getClient();
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        discordId: true,
        username: true,
        globalName: true,
        avatar: true,
        displayName: true,
        avatarUrl: true,
        timezone: true,
        preferences: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error("[profile] Error updating profile:", error);

    // Handle Prisma-specific errors
    if (error.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(500).json({ error: "Failed to update profile" });
  }
});

module.exports = router;
