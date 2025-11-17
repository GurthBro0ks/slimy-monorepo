"use strict";

const database = require("../../lib/database");

/**
 * Create a new notification for a user
 * @param {Object} params - Notification parameters
 * @param {string} params.userId - User ID
 * @param {string} params.type - Notification type (e.g. "weekly_digest", "club_update", "system")
 * @param {string} params.title - Notification title
 * @param {string} params.body - Notification body
 * @param {Object} [params.meta] - Optional metadata
 * @returns {Promise<Object>} Created notification
 */
async function createNotification({ userId, type, title, body, meta }) {
  try {
    const prisma = database.getClient();

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        meta: meta || null,
      },
    });

    console.log(`[notifyService] Created notification ${notification.id} for user ${userId}`);
    return notification;
  } catch (error) {
    console.error("[notifyService] Error creating notification:", error);
    throw error;
  }
}

/**
 * Mark a notification as read
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID (for verification)
 * @returns {Promise<void>}
 */
async function markAsRead(notificationId, userId) {
  try {
    const prisma = database.getClient();

    // Verify the notification belongs to the user before updating
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new Error("Notification not found or access denied");
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    console.log(`[notifyService] Marked notification ${notificationId} as read`);
  } catch (error) {
    console.error("[notifyService] Error marking notification as read:", error);
    throw error;
  }
}

/**
 * Get notifications for a user
 * @param {string} userId - User ID
 * @param {Object} [opts] - Options
 * @param {boolean} [opts.unreadOnly] - Only return unread notifications
 * @param {number} [opts.limit] - Maximum number of notifications to return
 * @returns {Promise<Array>} Array of notifications
 */
async function getNotificationsForUser(userId, opts = {}) {
  try {
    const prisma = database.getClient();
    const { unreadOnly = false, limit = 50 } = opts;

    const where = { userId };
    if (unreadOnly) {
      where.read = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 200), // Max 200 notifications
    });

    return notifications;
  } catch (error) {
    console.error("[notifyService] Error getting notifications:", error);
    throw error;
  }
}

/**
 * Get unread notification count for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Count of unread notifications
 */
async function getUnreadCount(userId) {
  try {
    const prisma = database.getClient();

    const count = await prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });

    return count;
  } catch (error) {
    console.error("[notifyService] Error getting unread count:", error);
    throw error;
  }
}

module.exports = {
  createNotification,
  markAsRead,
  getNotificationsForUser,
  getUnreadCount,
};
