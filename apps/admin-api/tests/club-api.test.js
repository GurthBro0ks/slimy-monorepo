/**
 * club-api.test.js - Tests for club analytics API endpoints
 */

"use strict";

process.env.DISCORD_CLIENT_ID ||= "1234567890123456789";
process.env.DISCORD_CLIENT_SECRET ||= "test-secret-32-characters-long-secret";
process.env.DISCORD_REDIRECT_URI ||= "https://admin.slimyai.xyz/api/auth/callback";
process.env.SESSION_SECRET ||= "test-session-secret-32-characters-long-secret";
process.env.JWT_SECRET ||= "test-jwt-secret-32-characters-long-secret";
process.env.DATABASE_URL ||= "postgresql://testuser:testpass@localhost:5432/test";
process.env.COOKIE_DOMAIN ||= "admin.slimyai.xyz";

const request = require("supertest");
const app = require("../src/app");
const { signSession, COOKIE_NAME } = require("../lib/jwt");
const { storeSession, clearSession } = require("../lib/session-store");
const {
  enableInMemoryMode,
  disableInMemoryMode,
  canonicalize,
  recordMetrics,
  recomputeLatest
} = require("../lib/club-store");

const TEST_GUILD_ID = "test-guild-123";
const TEST_GUILD_ID_2 = "test-guild-456";

function buildAuthCookie({ id, username, role, guilds, avatar = null }) {
  storeSession(id, {
    guilds: guilds || [],
    role: role || "member",
    accessToken: "test-access-token",
    refreshToken: "test-refresh-token",
  });

  const token = signSession({
    user: {
      id,
      username: username || `${role}-tester`,
      globalName: username || `${role}-tester`,
      avatar,
      role: role || "member",
    },
  });

  return `${COOKIE_NAME}=${token}`;
}

async function expectStatus(label, req, expected) {
  const res = await req;
  if (res.status !== expected) {
    throw new Error(
      `${label} expected HTTP ${expected} but received ${res.status} (${JSON.stringify(res.body || res.text)})`,
    );
  }
  return res;
}

async function run() {
  console.log("\n=== Club Analytics API Tests ===\n");

  // Enable in-memory mode for tests
  enableInMemoryMode();

  // Test 1: GET /latest without auth
  console.log("Test 1: GET /latest without auth should return 401");
  await expectStatus(
    "GET /latest no auth",
    request(app).get(`/api/guilds/${TEST_GUILD_ID}/club/latest`),
    401
  );
  console.log("✓ Passed\n");

  // Test 2: GET /latest without guild access
  console.log("Test 2: GET /latest without guild access should return 403");
  const noAccessUser = "user-no-access";
  const noAccessCookie = buildAuthCookie({
    id: noAccessUser,
    username: "NoAccess",
    role: "member",
    guilds: [], // No guilds
  });

  await expectStatus(
    "GET /latest no guild access",
    request(app)
      .get(`/api/guilds/${TEST_GUILD_ID}/club/latest`)
      .set("Cookie", noAccessCookie),
    403
  );
  console.log("✓ Passed\n");

  // Test 3: GET /latest with guild access - empty data
  console.log("Test 3: GET /latest with guild access should return empty array initially");
  const memberId = "member-test-user";
  const memberCookie = buildAuthCookie({
    id: memberId,
    username: "Member",
    role: "member",
    guilds: [{ id: TEST_GUILD_ID, name: "Test Guild" }],
  });

  const res3 = await expectStatus(
    "GET /latest empty",
    request(app)
      .get(`/api/guilds/${TEST_GUILD_ID}/club/latest`)
      .set("Cookie", memberCookie),
    200
  );

  if (!res3.body.ok) {
    throw new Error("Response should have ok: true");
  }
  if (res3.body.guildId !== TEST_GUILD_ID) {
    throw new Error(`Expected guildId ${TEST_GUILD_ID}, got ${res3.body.guildId}`);
  }
  if (!Array.isArray(res3.body.members) || res3.body.members.length !== 0) {
    throw new Error("Expected empty members array");
  }
  console.log("✓ Passed\n");

  // Test 4: Seed data and GET /latest with populated data
  console.log("Test 4: GET /latest with populated data should return members");

  // Seed some test data
  const now = new Date();
  await recordMetrics(canonicalize(TEST_GUILD_ID, "Alice", 50000, 100000, now));
  await recordMetrics(canonicalize(TEST_GUILD_ID, "Bob", 60000, 120000, now));
  await recordMetrics(canonicalize(TEST_GUILD_ID, "Charlie", 45000, 90000, now));
  await recomputeLatest(TEST_GUILD_ID);

  const res4 = await expectStatus(
    "GET /latest populated",
    request(app)
      .get(`/api/guilds/${TEST_GUILD_ID}/club/latest`)
      .set("Cookie", memberCookie),
    200
  );

  if (!res4.body.ok) {
    throw new Error("Response should have ok: true");
  }
  if (res4.body.members.length !== 3) {
    throw new Error(`Expected 3 members, got ${res4.body.members.length}`);
  }

  // Check that members are sorted by total power (descending)
  const members = res4.body.members;
  if (members[0].name !== "Bob" || members[0].totalPower !== 120000) {
    throw new Error("Expected Bob with 120000 total power to be first");
  }
  if (members[1].name !== "Alice" || members[1].totalPower !== 100000) {
    throw new Error("Expected Alice with 100000 total power to be second");
  }
  if (members[2].name !== "Charlie" || members[2].totalPower !== 90000) {
    throw new Error("Expected Charlie with 90000 total power to be third");
  }

  // Check member structure
  const alice = members.find(m => m.name === "Alice");
  if (!alice.memberKey || !alice.simPower || !alice.totalPower) {
    throw new Error("Member should have memberKey, simPower, and totalPower");
  }

  console.log("✓ Passed\n");

  // Test 5: Multiple guilds - ensure isolation
  console.log("Test 5: Guild data isolation");

  // Seed data for guild 2
  await recordMetrics(canonicalize(TEST_GUILD_ID_2, "David", 70000, 140000, now));
  await recomputeLatest(TEST_GUILD_ID_2);

  const guild2Cookie = buildAuthCookie({
    id: "member-guild2",
    username: "Member2",
    role: "member",
    guilds: [{ id: TEST_GUILD_ID_2, name: "Test Guild 2" }],
  });

  const res5 = await expectStatus(
    "GET /latest guild 2",
    request(app)
      .get(`/api/guilds/${TEST_GUILD_ID_2}/club/latest`)
      .set("Cookie", guild2Cookie),
    200
  );

  if (res5.body.members.length !== 1) {
    throw new Error(`Expected 1 member for guild 2, got ${res5.body.members.length}`);
  }
  if (res5.body.members[0].name !== "David") {
    throw new Error(`Expected David in guild 2, got ${res5.body.members[0].name}`);
  }

  // Verify guild 1 still has 3 members
  const res5b = await expectStatus(
    "GET /latest guild 1 again",
    request(app)
      .get(`/api/guilds/${TEST_GUILD_ID}/club/latest`)
      .set("Cookie", memberCookie),
    200
  );

  if (res5b.body.members.length !== 3) {
    throw new Error(`Expected 3 members for guild 1, got ${res5b.body.members.length}`);
  }

  console.log("✓ Passed\n");

  // Test 6: POST /rescan without admin role
  console.log("Test 6: POST /rescan without admin role should return 403");

  await expectStatus(
    "POST /rescan member role",
    request(app)
      .post(`/api/guilds/${TEST_GUILD_ID}/club/rescan`)
      .set("Cookie", memberCookie),
    403
  );
  console.log("✓ Passed\n");

  // Test 7: POST /rescan with admin role
  console.log("Test 7: POST /rescan with admin role should return 202");

  const adminId = "admin-test-user";
  const adminCookie = buildAuthCookie({
    id: adminId,
    username: "Admin",
    role: "admin",
    guilds: [{ id: TEST_GUILD_ID, name: "Test Guild" }],
  });

  const res7 = await expectStatus(
    "POST /rescan admin",
    request(app)
      .post(`/api/guilds/${TEST_GUILD_ID}/club/rescan`)
      .set("Cookie", adminCookie),
    202
  );

  if (!res7.body.ok) {
    throw new Error("Response should have ok: true");
  }
  if (!res7.body.message) {
    throw new Error("Response should have a message");
  }
  if (res7.body.guildId !== TEST_GUILD_ID) {
    throw new Error(`Expected guildId ${TEST_GUILD_ID}, got ${res7.body.guildId}`);
  }

  console.log("✓ Passed\n");

  // Cleanup
  clearSession(memberId);
  clearSession(adminId);
  clearSession(noAccessUser);
  clearSession("member-guild2");
  disableInMemoryMode();

  console.log("=== All club API tests passed! ===\n");
}

if (require.main === module) {
  run()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error("\n❌ Test failed:", err.message);
      console.error(err.stack);
      process.exit(1);
    });
}

module.exports = { run };
