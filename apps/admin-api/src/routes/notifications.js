"use strict";

const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const notifyService = require("../services/notifications/notifyService");
const database = require("../lib/database");

// All notification routes require authentication
router.use(requireAuth);

/**
 * GET /api/notifications
 * Get notifications for the current user
 * Query params:
 *   - unreadOnly: boolean (default: false)
 *   - limit: number (default: 50, max: 200)
 */
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const unreadOnly = req.query.unreadOnly === "true";
    const limit = parseInt(req.query.limit) || 50;

    const notifications = await notifyService.getNotificationsForUser(userId, {
      unreadOnly,
      limit,
    });

    res.json({
      ok: true,
      notifications,
    });
  } catch (error) {
    console.error("[notifications] Error fetching notifications:", error);
    res.status(500).json({
      ok: false,
      code: "INTERNAL_ERROR",
      message: "Failed to fetch notifications",
    });
  }
});

/**
 * GET /api/notifications/count
 * Get unread notification count for the current user
 */
router.get("/count", async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await notifyService.getUnreadCount(userId);

    res.json({
      ok: true,
      count,
    });
  } catch (error) {
    console.error("[notifications] Error fetching notification count:", error);
    res.status(500).json({
      ok: false,
      code: "INTERNAL_ERROR",
      message: "Failed to fetch notification count",
    });
  }
});

/**
 * POST /api/notifications/:id/read
 * Mark a notification as read
 */
router.post("/:id/read", async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    await notifyService.markAsRead(notificationId, userId);

    res.json({
      ok: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("[notifications] Error marking notification as read:", error);

    if (error.message.includes("not found") || error.message.includes("access denied")) {
      return res.status(404).json({
        ok: false,
        code: "NOT_FOUND",
        message: "Notification not found",
      });
    }

    res.status(500).json({
      ok: false,
      code: "INTERNAL_ERROR",
      message: "Failed to mark notification as read",
    });
  }
});

/**
 * GET /api/notifications/preferences
 * Get notification preferences for the current user
 */
router.get("/preferences", async (req, res) => {
  try {
    const userId = req.user.id;
    const prisma = database.getClient();

    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: {
          userId,
          emailOptIn: false,
          discordDMOptIn: false,
          weeklyDigest: true,
        },
      });
    }

    res.json({
      ok: true,
      preferences,
    });
  } catch (error) {
    console.error("[notifications] Error fetching preferences:", error);
    res.status(500).json({
      ok: false,
      code: "INTERNAL_ERROR",
      message: "Failed to fetch notification preferences",
    });
  }
});

/**
 * PATCH /api/notifications/preferences
 * Update notification preferences for the current user
 * Body:
 *   - emailOptIn: boolean
 *   - discordDMOptIn: boolean
 *   - weeklyDigest: boolean
 *   - channels: object
 */
router.patch("/preferences", async (req, res) => {
  try {
    const userId = req.user.id;
    const { emailOptIn, discordDMOptIn, weeklyDigest, channels } = req.body;
    const prisma = database.getClient();

    // Build update object with only provided fields
    const updateData = {};
    if (typeof emailOptIn === "boolean") updateData.emailOptIn = emailOptIn;
    if (typeof discordDMOptIn === "boolean") updateData.discordDMOptIn = discordDMOptIn;
    if (typeof weeklyDigest === "boolean") updateData.weeklyDigest = weeklyDigest;
    if (channels !== undefined) updateData.channels = channels;

    // Upsert preferences
    const preferences = await prisma.notificationPreference.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        emailOptIn: emailOptIn ?? false,
        discordDMOptIn: discordDMOptIn ?? false,
        weeklyDigest: weeklyDigest ?? true,
        channels: channels ?? null,
      },
    });

    res.json({
      ok: true,
      preferences,
    });
  } catch (error) {
    console.error("[notifications] Error updating preferences:", error);
    res.status(500).json({
      ok: false,
      code: "INTERNAL_ERROR",
      message: "Failed to update notification preferences",
    });
  }
});

module.exports = router;
