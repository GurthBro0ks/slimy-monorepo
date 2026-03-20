"use strict";

const database = require("../src/lib/database");

// Session store using database persistence
const MAX_AGE = 2 * 60 * 60 * 1000; // 2 hours for better security

// Clean up expired sessions every hour
setInterval(async () => {
  try {
    await database.deleteExpiredSessions();
  } catch (err) {
    // Log error without exposing sensitive details
    console.error('[session-store] Failed to cleanup expired sessions:', err.message);
  }
}, 60 * 60 * 1000);

async function storeSession(userId, data) {
  try {
    // Calculate token expiration (12 hours from now)
    const expiresAt = Date.now() + MAX_AGE;

    // Extract token from session data if it exists
    const token = data.tokens?.accessToken || data.token;

    if (!token) {
      console.warn('[session-store] No token found in session data for user:', userId);
      return;
    }

    // Store session in database
    await database.createSession(userId, token, expiresAt);

  } catch (err) {
    // Log error without exposing sensitive details
    console.error('[session-store] Failed to store session');
    throw err;
  }
}

async function getSession(userId) {
  try {
    const discordId = String(userId || "").trim();
    if (!discordId) return null;

    const user = await database.findUserByDiscordId(discordId);
    if (!user) return null;

    // Fetch user's guilds from the database (expects internal user.id)
    const userGuilds = await database.getUserGuilds(user.id);

    if (!userGuilds || userGuilds.length === 0) {
      return null;
    }

    // Transform to the format expected by the auth system
    const guilds = userGuilds.map(ug => ({
      id: ug.guild.discordId || ug.guild.id,
      roles: ug.roles || [],
    }));

    return {
      guilds,
    };
  } catch (err) {
    console.error('[session-store] Failed to get session:', err.message);
    return null;
  }
}

async function clearSession(userId) {
  try {
    await database.deleteUserSessions(userId);
  } catch (err) {
    // Log error without exposing sensitive details
    console.error('[session-store] Failed to clear session');
    throw err;
  }
}

async function activeSessionCount() {
  // This is a simplified count - in a real implementation we'd query the database
  // For now, return 0 since we can't easily count without proper session management
  return 0;
}

async function getAllSessions() {
  // Return empty array for now - full implementation would require database query
  return [];
}

module.exports = {
  storeSession,
  getSession,
  clearSession,
  activeSessionCount,
  getAllSessions
};
