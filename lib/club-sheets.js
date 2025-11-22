"use strict";

const { getLatest } = require("./club-store");

async function pushLatest(guildId, options = {}) {
  const rows = await getLatest(guildId);
  const sorted = [...rows].sort((a, b) => (b.total_power || 0) - (a.total_power || 0));

  const sheetRows = sorted.map((row) => [
    row.display_name || row.member_key,
    row.sim_power == null ? "" : row.sim_power,
    row.total_power == null ? "" : row.total_power,
    "", // Change % placeholder
  ]);

  const payload = {
    title: "Club Latest",
    header: ["Name", "SIM Power", "Total Power", "Change %"],
    rows: sheetRows,
    options,
  };

  // In production this would call Google Sheets API. For now return payload for tests.
  return { guildId, pushed: true, payload };
}

async function testSheetAccess(sheetId) {
  // Stubbed responder for tests; returns metadata for callers to check.
  return { sheetId, ok: true, title: "Club Latest" };
}

module.exports = {
  pushLatest,
  testSheetAccess,
};
