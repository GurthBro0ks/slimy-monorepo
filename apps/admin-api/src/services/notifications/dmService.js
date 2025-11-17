"use strict";

const database = require("../../lib/database");

/**
 * Send a Discord DM to a user
 * @param {string} discordId - Discord user ID
 * @param {string} message - Message to send
 * @returns {Promise<void>}
 */
async function sendDiscordDM(discordId, message) {
  const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

  if (!DISCORD_BOT_TOKEN) {
    console.warn(
      "[dmService] DISCORD_BOT_TOKEN not configured, skipping Discord DM",
      { discordId }
    );
    return;
  }

  // TODO: Implement actual Discord REST API call
  // Example implementation:
  // 1. Create a DM channel with the user
  //    POST https://discord.com/api/v10/users/@me/channels
  //    Body: { recipient_id: discordId }
  // 2. Send message to the DM channel
  //    POST https://discord.com/api/v10/channels/{channel_id}/messages
  //    Body: { content: message }

  console.log(
    `[dmService] TODO: Send Discord DM to ${discordId}: ${message.substring(0, 50)}...`
  );
}

/**
 * Send a Discord DM to a user if they have opted in
 * @param {string} userId - User ID (database ID)
 * @param {string} message - Message to send
 * @returns {Promise<void>}
 */
async function sendDiscordDMIfOptedIn(userId, message) {
  try {
    const prisma = database.getClient();

    // Get user and their preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { notificationPreference: true },
    });

    if (!user) {
      console.warn("[dmService] User not found:", userId);
      return;
    }

    // Check if user has opted in for Discord DMs
    const prefs = user.notificationPreference;
    if (!prefs || !prefs.discordDMOptIn) {
      console.log(
        `[dmService] User ${userId} has not opted in for Discord DMs, skipping`
      );
      return;
    }

    // Send the DM
    await sendDiscordDM(user.discordId, message);
  } catch (error) {
    console.error("[dmService] Error sending Discord DM:", error);
    // Don't throw - we don't want to fail the whole operation if DM fails
  }
}

module.exports = {
  sendDiscordDM,
  sendDiscordDMIfOptedIn,
};
