"use strict";

process.env.CLUB_STORE_MODE = "memory";

const store = require("../../../lib/club-store");
const vision = require("../../../lib/club-vision");

describe("club-store member_key aggregation", () => {
  beforeEach(() => {
    store.__memory.reset();
  });

  test("aggregates sim/total per member_key with normalization", async () => {
    const guildId = "guild-1";
    const snapshotId = "week-01";
    await store.recordMetrics(guildId, snapshotId, [
      { display_name: "Alice 😊", value: 1000, metric: "total" },
      { display_name: "ALICE", value: 1200, metric: "sim" },
      { display_name: "Bob", value: 900, metric: "total" },
    ]);

    const rows = await store.recomputeLatest(guildId, { snapshotId });
    const alice = rows.find((r) => r.member_key === "alice");
    const bob = rows.find((r) => r.member_key === "bob");

    expect(rows).toHaveLength(2);
    expect(alice.total_power).toBe(1000);
    expect(alice.sim_power).toBe(1200);
    expect(bob.total_power).toBe(900);
    expect(bob.sim_power).toBeNull();
  });

  test("prefers greatest values on repeated snapshots", async () => {
    const guildId = "guild-2";
    await store.recordMetrics(guildId, "week-02", [
      { display_name: "Charlie", value: 100, metric: "total" },
    ]);
    await store.recordMetrics(guildId, "week-02", [
      { display_name: "Charlie", value: 150, metric: "total" },
    ]);

    const rows = await store.recomputeLatest(guildId, { snapshotId: "week-02" });
    expect(rows.find((r) => r.member_key === "charlie").total_power).toBe(150);
  });

  test("handles sim-only weeks gracefully", async () => {
    const guildId = "guild-3";
    await store.recordMetrics(guildId, "week-03", [
      { display_name: "Dana", value: 500, metric: "sim" },
    ]);
    const rows = await store.recomputeLatest(guildId, { snapshotId: "week-03" });
    const dana = rows.find((r) => r.member_key === "dana");
    expect(dana.sim_power).toBe(500);
    expect(dana.total_power).toBeNull();
  });
});

describe("club-vision classifyPage", () => {
  test("detects sim from filename hints", () => {
    const res = vision.classifyPage("data:", "sim-power.png");
    expect(res.type).toBe("sim");
  });

  test("detects sim vs total from OCR anchors", () => {
    const simText = "Name Sim Power\nAlice 1200";
    const totalText = "Name Power\nAlice 5000";
    expect(vision.classifyPage(simText, "", { text: simText }).type).toBe("sim");
    expect(vision.classifyPage(totalText, "", { text: totalText }).type).toBe("total");
  });

  test("parseManageMembersImageEnsemble defaults to classified metric", async () => {
    const text = "Name Sim Power\nAlice 1000";
    const res = await vision.parseManageMembersImageEnsemble(text, "auto", { text });
    expect(res.metric).toBe("sim");
  });
});
