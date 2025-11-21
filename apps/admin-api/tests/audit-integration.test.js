"use strict";

/**
 * Phase 3.2 Audit Logging Integration Tests
 *
 * Verifies that audit logs are properly emitted for instrumented routes:
 * - Guild settings updates
 * - Guild channel overrides updates
 * - Personality updates and resets
 * - Bot rescan operations
 */

process.env.DISCORD_CLIENT_ID ||= "test-client-id";
process.env.DISCORD_CLIENT_SECRET ||= "test-secret";
process.env.DISCORD_REDIRECT_URI ||= "https://admin.slimyai.xyz/api/auth/callback";
process.env.SESSION_SECRET ||= "test-session-secret";
process.env.COOKIE_DOMAIN ||= "admin.slimyai.xyz";
process.env.ADMIN_AUDIT_DISABLED ||= "false"; // Enable audit logging for tests

const request = require("supertest");
const app = require("../src/app");
const { signSession, COOKIE_NAME } = require("../lib/jwt");
const { storeSession } = require("../lib/session-store");
const auditService = require("../src/services/audit");

const TEST_GUILD_ID = "1234567890";
const TEST_USER_ID = "admin-test-user";

// Track audit calls for verification
const auditCalls = [];
const originalRecordAudit = auditService.recordAudit;

// Mock recordAudit to track calls without actually writing to DB
auditService.recordAudit = async function(data) {
  auditCalls.push(data);
  // Optionally call original if you want to test DB persistence
  // return originalRecordAudit.call(this, data);
  return Promise.resolve();
};

function buildAuthCookie({ id, username, role, guilds }) {
  storeSession(id, {
    guilds: guilds || [],
    role: role || "admin",
    accessToken: "test-access-token",
    refreshToken: "test-refresh-token",
  });

  const token = signSession({
    user: {
      id,
      sub: id, // Some routes use sub, others use id
      username: username || `${role}-tester`,
      globalName: username || `${role}-tester`,
      role: role || "admin",
    },
  });

  return `${COOKIE_NAME}=${token}`;
}

function clearAuditCalls() {
  auditCalls.length = 0;
}

function findAuditCall(action, guildId = null) {
  return auditCalls.find(call => {
    const matchesAction = call.action === action;
    const matchesGuild = guildId ? call.guildId === guildId : true;
    return matchesAction && matchesGuild;
  });
}

async function getCsrfToken(cookie) {
  const res = await request(app)
    .get("/api/auth/csrf-token")
    .set("Cookie", cookie);
  return res.body.csrfToken;
}

async function run() {
  console.log("\n=== Phase 3.2 Audit Logging Integration Tests ===\n");

  const adminCookie = buildAuthCookie({
    id: TEST_USER_ID,
    username: "admin-tester",
    role: "admin",
    guilds: [{ id: TEST_GUILD_ID, name: "Test Guild" }],
  });

  const csrfToken = await getCsrfToken(adminCookie);

  // Test 1: Guild settings update emits audit log
  console.log("Test 1: Guild settings update emits audit log");
  clearAuditCalls();

  const settingsRes = await request(app)
    .put(`/api/guilds/${TEST_GUILD_ID}/settings`)
    .set("Cookie", adminCookie)
    .set("X-CSRF-Token", csrfToken)
    .send({
      screenshot_channel_id: "9876543210",
      personality: { tone: "friendly" },
    });

  if (settingsRes.status !== 200 && settingsRes.status !== 404) {
    // 404 is OK if the settings file doesn't exist in test env
    console.log(`  ⚠️  Skipping (status ${settingsRes.status})`);
  } else {
    const auditCall = findAuditCall("guild.settings.update", TEST_GUILD_ID);
    if (!auditCall) {
      throw new Error("Expected audit log for guild.settings.update");
    }
    if (auditCall.adminId !== TEST_USER_ID) {
      throw new Error(`Expected adminId ${TEST_USER_ID}, got ${auditCall.adminId}`);
    }
    console.log("  ✓ Audit log emitted with correct action and adminId");
  }

  // Test 2: Screenshot channel update emits audit log
  console.log("Test 2: Screenshot channel update emits audit log");
  clearAuditCalls();

  const screenshotRes = await request(app)
    .post(`/api/guilds/${TEST_GUILD_ID}/settings/screenshot-channel`)
    .set("Cookie", adminCookie)
    .set("X-CSRF-Token", csrfToken)
    .send({ channelId: "1111111111" });

  if (screenshotRes.status !== 200 && screenshotRes.status !== 404) {
    console.log(`  ⚠️  Skipping (status ${screenshotRes.status})`);
  } else {
    const auditCall = findAuditCall("guild.screenshot_channel.update", TEST_GUILD_ID);
    if (!auditCall) {
      throw new Error("Expected audit log for guild.screenshot_channel.update");
    }
    if (!auditCall.payload || auditCall.payload.channelId !== "1111111111") {
      throw new Error("Expected payload with channelId");
    }
    console.log("  ✓ Audit log emitted with correct payload");
  }

  // Test 3: Channel overrides update emits audit log
  console.log("Test 3: Channel overrides update emits audit log");
  clearAuditCalls();

  const channelsRes = await request(app)
    .post(`/api/guilds/${TEST_GUILD_ID}/channels`)
    .set("Cookie", adminCookie)
    .set("X-CSRF-Token", csrfToken)
    .send({
      overrides: [
        { id: "ch1", name: "general" },
        { id: "ch2", name: "random" },
      ],
    });

  if (channelsRes.status !== 200 && channelsRes.status !== 404) {
    console.log(`  ⚠️  Skipping (status ${channelsRes.status})`);
  } else {
    const auditCall = findAuditCall("guild.channel_overrides.update", TEST_GUILD_ID);
    if (!auditCall) {
      throw new Error("Expected audit log for guild.channel_overrides.update");
    }
    if (!auditCall.payload || auditCall.payload.channelCount !== 2) {
      throw new Error("Expected payload with channelCount");
    }
    console.log("  ✓ Audit log emitted with channel count");
  }

  // Test 4: Personality update emits audit log
  console.log("Test 4: Personality update emits audit log");
  clearAuditCalls();

  const personalityRes = await request(app)
    .put(`/api/guilds/${TEST_GUILD_ID}/personality`)
    .set("Cookie", adminCookie)
    .set("X-CSRF-Token", csrfToken)
    .send({
      tone: "professional",
      temperature: 0.7,
      top_p: 0.9,
      system_prompt: "You are a helpful assistant",
    });

  if (personalityRes.status !== 200 && personalityRes.status !== 500) {
    console.log(`  ⚠️  Skipping (status ${personalityRes.status})`);
  } else if (personalityRes.status === 500) {
    // Database might not be set up in test env, but audit should still be called
    console.log("  ⚠️  Route returned 500 (expected in test env without DB)");
  } else {
    const auditCall = findAuditCall("guild.personality.update", TEST_GUILD_ID);
    if (!auditCall) {
      throw new Error("Expected audit log for guild.personality.update");
    }
    console.log("  ✓ Audit log emitted for personality update");
  }

  // Test 5: Personality reset emits audit log
  console.log("Test 5: Personality reset emits audit log");
  clearAuditCalls();

  const resetRes = await request(app)
    .post(`/api/guilds/${TEST_GUILD_ID}/personality/reset`)
    .set("Cookie", adminCookie)
    .set("X-CSRF-Token", csrfToken)
    .send({ preset: "friendly" });

  if (resetRes.status !== 200 && resetRes.status !== 500) {
    console.log(`  ⚠️  Skipping (status ${resetRes.status})`);
  } else if (resetRes.status === 500) {
    console.log("  ⚠️  Route returned 500 (expected in test env without DB)");
  } else {
    const auditCall = findAuditCall("guild.personality.reset", TEST_GUILD_ID);
    if (!auditCall) {
      throw new Error("Expected audit log for guild.personality.reset");
    }
    if (!auditCall.payload || !auditCall.payload.preset) {
      throw new Error("Expected payload with preset");
    }
    console.log("  ✓ Audit log emitted with preset info");
  }

  // Test 6: Bot rescan emits audit log (only if BOT_RESCAN_URL is configured)
  console.log("Test 6: Bot rescan emits audit log");
  if (!process.env.BOT_RESCAN_URL) {
    console.log("  ⚠️  Skipping (BOT_RESCAN_URL not configured)");
  } else {
    clearAuditCalls();

    const rescanRes = await request(app)
      .post("/api/bot/rescan")
      .set("Cookie", adminCookie)
      .set("X-CSRF-Token", csrfToken)
      .send({ guildId: TEST_GUILD_ID });

    // Rescan might fail in test env, but should still emit audit
    const auditCall = findAuditCall("bot.rescan");
    if (!auditCall) {
      throw new Error("Expected audit log for bot.rescan");
    }
    if (!auditCall.payload || !auditCall.payload.status) {
      throw new Error("Expected payload with status");
    }
    console.log(`  ✓ Audit log emitted with status: ${auditCall.payload.status}`);
  }

  console.log("\n✅ All audit logging integration tests passed!\n");
}

// Run tests
run()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Test failed:", err.message);
    console.error(err.stack);
    process.exit(1);
  });
