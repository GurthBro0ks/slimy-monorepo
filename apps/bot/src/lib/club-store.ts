/**
 * Club data operations — MySQL-based analytics store.
 * Ported from /opt/slimy/app/lib/club-store.js
 */

import { database } from './database.js';

function ensureDatabaseConfigured(): void {
  if (!database.isConfigured()) {
    throw new Error("Club analytics requires a configured database");
  }
}

function toNumber(value: unknown): number | null {
  if (value === null || typeof value === "undefined") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function computePct(current: unknown, previous: unknown): number | null {
  const curr = toNumber(current);
  const prev = toNumber(previous);
  if (curr === null || prev === null || prev === 0) return null;
  const pct = ((curr - prev) / prev) * 100;
  return Number.isFinite(pct) ? Math.round(pct * 100) / 100 : null;
}

export function stripDiscordEmoji(text: string): string {
  return text.replace(/<a?:[^:>]+:\d+>/g, " ");
}

export function stripSquareTags(text: string): string {
  return text.replace(/\[[^\]]+\]/g, " ");
}

export function stripColonedEmoji(text: string): string {
  return text.replace(/:[^:\s]+:/g, " ");
}

function removeEmojiCharacters(text: string): string {
  return text.replace(/[\p{Extended_Pictographic}]/gu, " ");
}

export function canonicalize(name: string): string {
  if (!name) return "";
  let working = String(name).normalize("NFKD");
  working = stripDiscordEmoji(working);
  working = stripSquareTags(working);
  working = stripColonedEmoji(working);
  working = removeEmojiCharacters(working);
  working = working.replace(/[\u0300-\u036f]/g, "");
  working = working.replace(/[^\p{L}\p{N}]+/gu, " ");
  working = working.replace(/\s+/g, " ").trim().toLowerCase();
  return working;
}

interface UpsertMemberRow {
  display?: string;
  canonical?: string;
  name?: string;
  lastSeen?: Date;
}

export async function upsertMembers(guildId: string, rows: UpsertMemberRow[]): Promise<Map<string, number>> {
  ensureDatabaseConfigured();
  if (!guildId) throw new Error("guildId is required");
  if (!Array.isArray(rows) || rows.length === 0) return new Map();

  const memberMap = new Map<string, number>();
  const seenCanonical = new Set<string>();

  for (const row of rows) {
    const display = row?.display ? String(row.display).trim() : "";
    const canonical = row?.canonical
      ? String(row.canonical)
      : canonicalize(display || row?.name || "");
    if (!canonical) continue;
    if (seenCanonical.has(canonical)) continue;
    seenCanonical.add(canonical);

    const lastSeen = row?.lastSeen instanceof Date ? row.lastSeen : new Date();

    try {
      await database.execute(
        `INSERT INTO club_members (guild_id, name_canonical, name_display, last_seen)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name_display = VALUES(name_display), last_seen = VALUES(last_seen)`,
        [guildId, canonical, display || canonical, lastSeen],
      );

      interface IdRow { id: number; }
      const lookup = await database.query<IdRow[]>(
        "SELECT id FROM club_members WHERE guild_id = ? AND name_canonical = ? LIMIT 1",
        [guildId, canonical],
      );
      if (lookup[0]?.id) {
        memberMap.set(canonical, lookup[0].id);
      }
    } catch (err) {
      console.error("[club-store] Failed to upsert member", { guildId, canonical, err: (err as Error).message });
    }
  }

  return memberMap;
}

export async function createSnapshot(guildId: string, createdBy: string, notes: string | null = null, snapshotAt: Date = new Date()): Promise<{ snapshotId: number; snapshotAt: Date }> {
  ensureDatabaseConfigured();
  if (!guildId) throw new Error("guildId is required");
  if (!createdBy) throw new Error("createdBy is required");

  const result = await database.execute(
    `INSERT INTO club_snapshots (guild_id, created_by, snapshot_at, notes) VALUES (?, ?, ?, ?)`,
    [guildId, createdBy, snapshotAt, notes],
  );

  return { snapshotId: result.insertId, snapshotAt };
}

interface MetricEntry {
  memberId: number;
  metric: string;
  value: number | null;
}

export async function insertMetrics(snapshotId: number, entries: MetricEntry[]): Promise<void> {
  ensureDatabaseConfigured();
  if (!snapshotId) throw new Error("snapshotId is required");
  if (!Array.isArray(entries) || entries.length === 0) return;

  const validEntries = entries.filter(e => e?.memberId && e?.metric);
  if (!validEntries.length) return;

  const params: (string | number)[] = [];
  for (const entry of validEntries) {
    params.push(snapshotId, entry.memberId, entry.metric, entry.value ?? 0);
  }
  const placeholders = validEntries.map(() => "(?, ?, ?, ?)").join(", ");

  await database.execute(
    `INSERT INTO club_metrics (snapshot_id, member_id, metric, value)
     VALUES ${placeholders}
     ON DUPLICATE KEY UPDATE value = GREATEST(value, VALUES(value))`,
    params,
  );
}

export async function recomputeLatestForGuild(guildId: string, snapshotAt: Date): Promise<void> {
  ensureDatabaseConfigured();
  if (!guildId) throw new Error("guildId is required");

  interface SnapshotRow { id: number; snapshot_at: Date; }
  const [snapshotRow] = await database.query<SnapshotRow[]>(
    `SELECT id, snapshot_at FROM club_snapshots WHERE guild_id = ? AND snapshot_at = ? ORDER BY id DESC LIMIT 1`,
    [guildId, snapshotAt],
  );

  if (!snapshotRow) return;

  interface PrevSnapshotRow { id: number; snapshot_at: Date; }
  const [prevSnapshot] = await database.query<PrevSnapshotRow[]>(
    `SELECT id, snapshot_at FROM club_snapshots
     WHERE guild_id = ? AND snapshot_at BETWEEN DATE_SUB(?, INTERVAL 8 DAY) AND DATE_SUB(?, INTERVAL 6 DAY)
     ORDER BY snapshot_at DESC LIMIT 1`,
    [guildId, snapshotRow.snapshot_at, snapshotRow.snapshot_at],
  );

  interface CurrentMetricRow { member_id: number; name_display: string; sim_power: number | null; total_power: number | null; }
  const currentMetrics = await database.query<CurrentMetricRow[]>(
    `SELECT m.member_id, cm.name_display,
            MAX(CASE WHEN m.metric = 'sim' THEN m.value END) AS sim_power,
            MAX(CASE WHEN m.metric = 'total' THEN m.value END) AS total_power
     FROM club_metrics m
     JOIN club_members cm ON cm.id = m.member_id
     WHERE m.snapshot_id = ?
     GROUP BY m.member_id, cm.name_display`,
    [snapshotRow.id],
  );

  interface PrevMetricRow { member_id: number; sim_power: number | null; total_power: number | null; }
  const previousMetricsMap = new Map<number, PrevMetricRow>();
  if (prevSnapshot?.id) {
    const previousMetrics = await database.query<PrevMetricRow[]>(
      `SELECT m.member_id,
              MAX(CASE WHEN m.metric = 'sim' THEN m.value END) AS sim_power,
              MAX(CASE WHEN m.metric = 'total' THEN m.value END) AS total_power
       FROM club_metrics m WHERE m.snapshot_id = ? GROUP BY m.member_id`,
      [prevSnapshot.id],
    );
    for (const entry of previousMetrics) {
      previousMetricsMap.set(entry.member_id, entry);
    }
  }

  const payload: (string | number | null)[] = [];
  for (const row of currentMetrics) {
    const prev = previousMetricsMap.get(row.member_id) || {} as PrevMetricRow;
    const simPrev = prev.sim_power ?? null;
    const totalPrev = prev.total_power ?? null;
    payload.push(
      guildId, row.member_id, row.name_display,
      toNumber(row.sim_power), toNumber(row.total_power),
      toNumber(simPrev), toNumber(totalPrev),
      computePct(row.sim_power, simPrev), computePct(row.total_power, totalPrev),
      snapshotRow.snapshot_at.toISOString(),
    );
  }

  if (payload.length === 0) return;

  const placeholders = payload.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
  await database.execute(
    `DELETE FROM club_latest WHERE guild_id = ?`,
    [guildId],
  );
  await database.execute(
    `INSERT INTO club_latest (guild_id, member_id, name_display, sim_power, total_power, sim_prev, total_prev, sim_pct_change, total_pct_change, latest_at)
     VALUES ${placeholders}`,
    payload,
  );
}

export interface LatestMemberRow {
  member_id: number;
  name_canonical: string;
  name_display: string;
  sim_power: number | null;
  total_power: number | null;
  sim_prev: number | null;
  total_prev: number | null;
  sim_pct_change: number | null;
  total_pct_change: number | null;
  latest_at: Date;
}

export async function getLatestForGuild(guildId: string): Promise<LatestMemberRow[]> {
  ensureDatabaseConfigured();
  if (!guildId) throw new Error("guildId is required");
  return database.query<LatestMemberRow[]>(
    `SELECT cl.member_id, cm.name_canonical, cl.name_display,
            cl.sim_power, cl.total_power, cl.sim_prev, cl.total_prev,
            cl.sim_pct_change, cl.total_pct_change, cl.latest_at
     FROM club_latest cl
     JOIN club_members cm ON cm.id = cl.member_id
     WHERE cl.guild_id = ?
     ORDER BY (cl.total_power IS NULL) ASC, cl.total_power DESC, cl.name_display ASC`,
    [guildId],
  );
}

interface TopMoverRow {
  member_id: number;
  name_display: string;
  current_value: number | null;
  previous_value: number | null;
  pct_change: number | null;
}

export async function getTopMovers(guildId: string, metric: string, limit: number): Promise<{ gainers: TopMoverRow[]; losers: TopMoverRow[] }> {
  ensureDatabaseConfigured();
  if (!guildId) throw new Error("guildId is required");
  const safeLimit = Math.max(1, Math.min(Math.floor(Number(limit) || 10), 50));
  const column = metric === "sim" ? "sim_power" : "total_power";
  const prevColumn = metric === "sim" ? "sim_prev" : "total_prev";
  const pctColumn = metric === "sim" ? "sim_pct_change" : "total_pct_change";

  const [gainers, losers] = await Promise.all([
    database.query<TopMoverRow[]>(
      `SELECT member_id, name_display, ${column} AS current_value,
              ${prevColumn} AS previous_value, ${pctColumn} AS pct_change
       FROM club_latest
       WHERE guild_id = ? AND ${column} IS NOT NULL AND ${prevColumn} IS NOT NULL AND ${pctColumn} IS NOT NULL
       ORDER BY ${pctColumn} DESC LIMIT ${safeLimit}`,
      [guildId],
    ),
    database.query<TopMoverRow[]>(
      `SELECT member_id, name_display, ${column} AS current_value,
              ${prevColumn} AS previous_value, ${pctColumn} AS pct_change
       FROM club_latest
       WHERE guild_id = ? AND ${column} IS NOT NULL AND ${prevColumn} IS NOT NULL AND ${pctColumn} IS NOT NULL
       ORDER BY ${pctColumn} ASC LIMIT ${safeLimit}`,
      [guildId],
    ),
  ]);

  return { gainers, losers };
}

export interface Aggregates {
  members: number;
  membersWithTotals: number;
  totalPower: number | null;
  averagePower: number | null;
}

export async function getAggregates(guildId: string): Promise<Aggregates> {
  ensureDatabaseConfigured();
  if (!guildId) throw new Error("guildId is required");

  interface AggRow { member_count: number; members_with_totals: number; total_power: number | null; }
  const [row] = await database.query<AggRow[]>(
    `SELECT COUNT(*) AS member_count,
            SUM(CASE WHEN total_power IS NOT NULL THEN 1 ELSE 0 END) AS members_with_totals,
            SUM(COALESCE(total_power, 0)) AS total_power
     FROM club_latest WHERE guild_id = ?`,
    [guildId],
  );

  const members = Number(row?.member_count || 0);
  const membersWithTotals = Number(row?.members_with_totals || 0);
  const totalPower = toNumber(row?.total_power);
  const averagePower = membersWithTotals > 0 && totalPower !== null ? totalPower / membersWithTotals : null;

  return { members, membersWithTotals, totalPower, averagePower };
}

export async function getLastWeekCanonicalNames(guildId: string): Promise<Set<string>> {
  ensureDatabaseConfigured();
  if (!guildId) throw new Error("guildId is required");
  interface NameRow { name_canonical: string; }
  const rows = await database.query<NameRow[]>(
    `SELECT cm.name_canonical FROM club_latest cl JOIN club_members cm ON cm.id = cl.member_id WHERE cl.guild_id = ?`,
    [guildId],
  );
  return new Set(rows.map(r => r.name_canonical));
}

export async function findLikelyMemberId(guildId: string, canonicalOrAlias: string): Promise<number | null> {
  ensureDatabaseConfigured();
  if (!guildId) throw new Error("guildId is required");
  const canonical = canonicalize(canonicalOrAlias);
  if (!canonical) return null;

  interface IdRow { id: number; }
  const [direct] = await database.query<IdRow[]>(
    "SELECT id FROM club_members WHERE guild_id = ? AND name_canonical = ? LIMIT 1",
    [guildId, canonical],
  );
  if (direct?.id) return direct.id;

  const [alias] = await database.query<{ member_id: number }[]>(
    "SELECT member_id FROM club_aliases WHERE guild_id = ? AND alias_canonical = ? LIMIT 1",
    [guildId, canonical],
  );
  if (alias?.member_id) return alias.member_id;

  const fuzzyPattern = `%${canonical.replace(/\s+/g, "%")}%`;
  const [fuzzy] = await database.query<IdRow[]>(
    "SELECT id FROM club_members WHERE guild_id = ? AND name_canonical LIKE ? ORDER BY last_seen DESC LIMIT 1",
    [guildId, fuzzyPattern],
  );

  return fuzzy?.id || null;
}

export async function addAlias(guildId: string, memberId: number, aliasCanonical: string): Promise<void> {
  ensureDatabaseConfigured();
  if (!guildId || !memberId || !aliasCanonical) return;
  await database.execute(
    `INSERT INTO club_aliases (guild_id, member_id, alias_canonical) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE member_id = VALUES(member_id)`,
    [guildId, memberId, aliasCanonical],
  );
}

// ─── Schema Initialization ─────────────────────────────────────────────────────

/**
 * Create club_* tables if they don't exist.
 * Called automatically on module init.
 */
export async function ensureClubTables(): Promise<void> {
  if (!database.isConfigured()) return;

  const pool = database.getPool();

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS club_members (
      id INT AUTO_INCREMENT PRIMARY KEY,
      guild_id VARCHAR(20) NOT NULL,
      name_canonical VARCHAR(120) NOT NULL,
      name_display VARCHAR(120) NOT NULL,
      last_seen DATETIME NOT NULL,
      UNIQUE KEY uniq_member (guild_id, name_canonical)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS club_snapshots (
      id INT AUTO_INCREMENT PRIMARY KEY,
      guild_id VARCHAR(20) NOT NULL,
      created_by VARCHAR(20) NOT NULL,
      snapshot_at DATETIME NOT NULL,
      notes VARCHAR(255) NULL,
      KEY guild_time (guild_id, snapshot_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS club_metrics (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      snapshot_id INT NOT NULL,
      member_id INT NOT NULL,
      metric ENUM('sim','total') NOT NULL,
      value BIGINT NOT NULL,
      FOREIGN KEY (snapshot_id) REFERENCES club_snapshots(id) ON DELETE CASCADE,
      FOREIGN KEY (member_id) REFERENCES club_members(id) ON DELETE CASCADE,
      KEY member_metric (member_id, metric)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS club_latest (
      guild_id VARCHAR(20) NOT NULL,
      member_id INT NOT NULL,
      name_display VARCHAR(120) NOT NULL,
      sim_power BIGINT DEFAULT NULL,
      total_power BIGINT DEFAULT NULL,
      sim_prev BIGINT DEFAULT NULL,
      total_prev BIGINT DEFAULT NULL,
      sim_pct_change DECIMAL(7,2) DEFAULT NULL,
      total_pct_change DECIMAL(7,2) DEFAULT NULL,
      latest_at DATETIME NOT NULL,
      PRIMARY KEY (guild_id, member_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS club_aliases (
      id INT AUTO_INCREMENT PRIMARY KEY,
      guild_id VARCHAR(20) NOT NULL,
      member_id INT NOT NULL,
      alias_canonical VARCHAR(120) NOT NULL,
      UNIQUE KEY uniq_alias (guild_id, alias_canonical),
      FOREIGN KEY (member_id) REFERENCES club_members(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

// Auto-init on module load
ensureClubTables().catch((err) => {
  console.warn("[club-store] Failed to ensure club tables:", (err as Error).message);
});
