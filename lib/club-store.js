"use strict";

const path = require("path");
const { format } = require("date-fns");

// Lazy-load database only if needed to avoid failing in test sandboxes.
let db = null;
function getDb() {
  if (process.env.CLUB_STORE_MODE === "memory") return null;
  if (db) return db;
  try {
    // Reuse admin-api database helper to keep one connection pool.
    // eslint-disable-next-line import/no-dynamic-require, global-require
    db = require("../apps/admin-api/lib/database");
    return db;
  } catch (_err) {
    return null;
  }
}

/**
 * Normalize a member display name into a member_key.
 * - Lowercase
 * - Strip emojis/non-word characters
 * - Collapse whitespace to single hyphen
 */
function canonicalize(input) {
  if (!input) return null;
  const stripped = stripEmojis(String(input)).toLowerCase();
  const cleaned = stripped.replace(/[^a-z0-9\s-]/g, " ");
  const parts = cleaned.trim().split(/\s+/).filter(Boolean);
  return parts.join("-") || null;
}

function stripEmojis(str) {
  return str.replace(
    // Basic emoji + symbols range; intentionally conservative.
    /[\u{1F300}-\u{1FAFF}\u{1F000}-\u{1F6FF}\u{2600}-\u{27BF}]/gu,
    "",
  );
}

const memory = {
  metrics: new Map(), // guildId -> Array<{snapshotId, member_key, display_name, metric, value, recorded_at}>
  latest: new Map(), // guildId -> Map<member_key, row>
};

function resetMemory() {
  memory.metrics.clear();
  memory.latest.clear();
}

async function ensureSchema() {
  const database = getDb();
  if (!database) return false;

  const ddl = [
    `CREATE TABLE IF NOT EXISTS club_latest (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      guild_id VARCHAR(64) NOT NULL,
      member_key VARCHAR(120) NOT NULL,
      display_name VARCHAR(120) NULL,
      total_power BIGINT NULL,
      sim_power BIGINT NULL,
      latest_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_guild_member (guild_id, member_key),
      KEY idx_guild (guild_id)
    )`,
    `CREATE TABLE IF NOT EXISTS club_metrics (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      guild_id VARCHAR(64) NOT NULL,
      snapshot_id VARCHAR(64) NOT NULL,
      member_key VARCHAR(120) NOT NULL,
      display_name VARCHAR(120) NULL,
      metric ENUM('sim','total') NOT NULL,
      value BIGINT NOT NULL,
      recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_metric (guild_id, snapshot_id, member_key, metric),
      KEY idx_guild (guild_id),
      KEY idx_snapshot (snapshot_id)
    )`,
    `ALTER TABLE club_latest ADD COLUMN IF NOT EXISTS member_key VARCHAR(120) NOT NULL`,
    `ALTER TABLE club_latest ADD UNIQUE KEY IF NOT EXISTS uniq_guild_member (guild_id, member_key)`,
    `ALTER TABLE club_metrics ADD COLUMN IF NOT EXISTS member_key VARCHAR(120) NULL`,
    `ALTER TABLE club_metrics ADD UNIQUE KEY IF NOT EXISTS uniq_metric (guild_id, snapshot_id, member_key, metric)`,
  ];

  for (const stmt of ddl) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await database.query(stmt);
    } catch (err) {
      // Older MySQL versions might not support IF NOT EXISTS on some clauses; ignore benign errors.
      if (!/ER_DUP_KEYNAME|exists/i.test(String(err?.message || ""))) {
        throw err;
      }
    }
  }
  return true;
}

/**
 * Record metric rows for a guild/snapshot.
 * Each entry: { member_key?, display_name?, value, metric }
 */
async function recordMetrics(guildId, snapshotId, entries = []) {
  const normalizedSnapshot = snapshotId || deriveSnapshotId();
  const prepared = entries
    .map((row) => {
      const member_key = row.member_key || canonicalize(row.display_name || row.name);
      if (!member_key || !row.metric) return null;
      const metric = row.metric === "sim" ? "sim" : "total";
      const value = Number(row.value);
      if (!Number.isFinite(value)) return null;
      return {
        guild_id: guildId,
        snapshot_id: normalizedSnapshot,
        member_key,
        display_name: row.display_name || row.name || member_key,
        metric,
        value,
      };
    })
    .filter(Boolean);

  if (!prepared.length) return [];

  const database = getDb();
  if (!database) {
    upsertMemory(prepared);
    return prepared;
  }

  await ensureSchema();

  const sql =
    "INSERT INTO club_metrics (guild_id, snapshot_id, member_key, display_name, metric, value) VALUES ?";
  const values = prepared.map((row) => [
    row.guild_id,
    row.snapshot_id,
    row.member_key,
    row.display_name,
    row.metric,
    row.value,
  ]);

  await database.query(sql, [values]);

  // Apply GREATEST on conflict by re-upserting.
  const conflictSql = `
    INSERT INTO club_metrics (guild_id, snapshot_id, member_key, display_name, metric, value)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      value = GREATEST(value, VALUES(value)),
      display_name = COALESCE(VALUES(display_name), display_name)
  `;
  for (const row of prepared) {
    // eslint-disable-next-line no-await-in-loop
    await database.query(conflictSql, [
      row.guild_id,
      row.snapshot_id,
      row.member_key,
      row.display_name,
      row.metric,
      row.value,
    ]);
  }

  return prepared;
}

function upsertMemory(rows) {
  for (const row of rows) {
    if (!memory.metrics.has(row.guild_id)) {
      memory.metrics.set(row.guild_id, []);
    }
    const list = memory.metrics.get(row.guild_id);
    const existing = list.find(
      (r) =>
        r.snapshot_id === row.snapshot_id &&
        r.member_key === row.member_key &&
        r.metric === row.metric,
    );
    if (existing) {
      existing.value = Math.max(existing.value, row.value);
      existing.display_name = row.display_name || existing.display_name;
    } else {
      list.push({ ...row, recorded_at: new Date() });
    }
  }
}

/**
 * Recompute club_latest from club_metrics, returning updated rows.
 */
async function recomputeLatest(guildId, { snapshotId = null } = {}) {
  const database = getDb();
  if (!database) {
    return recomputeLatestMemory(guildId, { snapshotId });
  }

  await ensureSchema();
  const where = ["guild_id = ?"];
  const params = [guildId];
  if (snapshotId) {
    where.push("snapshot_id = ?");
    params.push(snapshotId);
  }

  const rows = await database.query(
    `
    SELECT member_key,
      MAX(CASE WHEN metric = 'total' THEN value END) AS total_power,
      MAX(CASE WHEN metric = 'sim' THEN value END) AS sim_power,
      MAX(display_name) AS display_name
    FROM club_metrics
    WHERE ${where.join(" AND ")}
    GROUP BY member_key
  `,
    params,
  );

  for (const row of rows) {
    await database.query(
      `
      INSERT INTO club_latest (guild_id, member_key, display_name, total_power, sim_power, latest_at)
      VALUES (?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        display_name = COALESCE(VALUES(display_name), display_name),
        total_power = GREATEST(IFNULL(total_power, 0), VALUES(total_power)),
        sim_power = GREATEST(IFNULL(sim_power, 0), VALUES(sim_power)),
        latest_at = NOW()
    `,
      [guildId, row.member_key, row.display_name, row.total_power || null, row.sim_power || null],
    );
  }

  return rows;
}

function recomputeLatestMemory(guildId, { snapshotId = null } = {}) {
  const list = memory.metrics.get(guildId) || [];
  const filtered = snapshotId ? list.filter((r) => r.snapshot_id === snapshotId) : list;
  const grouped = new Map();

  for (const row of filtered) {
    if (!grouped.has(row.member_key)) {
      grouped.set(row.member_key, {
        guild_id: guildId,
        member_key: row.member_key,
        display_name: row.display_name,
        total_power: null,
        sim_power: null,
        latest_at: new Date(),
      });
    }
    const agg = grouped.get(row.member_key);
    if (row.metric === "total") {
      agg.total_power = Math.max(agg.total_power || 0, row.value);
    } else if (row.metric === "sim") {
      agg.sim_power = Math.max(agg.sim_power || 0, row.value);
    }
    if (!agg.display_name && row.display_name) {
      agg.display_name = row.display_name;
    }
  }

  memory.latest.set(
    guildId,
    new Map([...grouped.entries()].map(([k, v]) => [k, v])),
  );

  return [...grouped.values()];
}

async function getLatest(guildId) {
  const database = getDb();
  if (!database) {
    const map = memory.latest.get(guildId);
    return map ? [...map.values()] : [];
  }
  await ensureSchema();
  return database.query(
    `SELECT guild_id, member_key, display_name, sim_power, total_power, latest_at
     FROM club_latest WHERE guild_id = ? ORDER BY total_power DESC`,
    [guildId],
  );
}

function deriveSnapshotId() {
  return format(new Date(), "'week'II-yyyy");
}

module.exports = {
  canonicalize,
  recordMetrics,
  recomputeLatest,
  getLatest,
  ensureSchema,
  __memory: { reset: resetMemory, store: memory },
};
