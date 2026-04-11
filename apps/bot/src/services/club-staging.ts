/**
 * Club Analyze Staging — MySQL repository for /club-analyze edit workflow.
 *
 * This module provides staging persistence for the /club-analyze paginated edit UI.
 * Data flows:
 *   /club-analyze scan → extractRoster() → dedupeRosterRows() → saveStagingRows()
 *   /club-analyze edit → updateStagingRow()
 *   /club-push (future) → reads staging → writes club_latest
 *
 * The staging table holds the FINAL deduped canonical dataset keyed by
 * (guild_id, metric, member_name). sim and total are independent datasets.
 */

import { database } from '../lib/database.js';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StagingRow {
  member_name: string;
  power_value: bigint;
  updated_at: Date;
}

export interface StagingStatus {
  sim: { count: number; updated_at: Date | null };
  total: { count: number; updated_at: Date | null };
}

// ─── Repository Functions ───────────────────────────────────────────────────

/**
 * Clear all staging rows for a guild+metric combination.
 * Called before writing a fresh scan to ensure clean state.
 */
export async function clearStaging(
  guildId: string,
  metric: 'sim' | 'total',
): Promise<void> {
  await database.execute(
    'DELETE FROM club_analyze_staging WHERE guild_id = ? AND metric = ?',
    [guildId, metric],
  );
}

/**
 * Save a complete set of staging rows for a guild+metric.
 * Clears existing rows first (in a transaction), then bulk inserts the new set.
 * If the insert fails, the transaction rolls back and no partial state remains.
 */
export async function saveStagingRows(
  guildId: string,
  metric: 'sim' | 'total',
  userId: string,
  rows: Array<{ member_name: string; power_value: bigint }>,
): Promise<void> {
  if (rows.length === 0) {
    // Nothing to save — still clear any existing rows
    await clearStaging(guildId, metric);
    return;
  }

  const pool = database.getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Clear existing rows for this guild+metric
    await connection.execute(
      'DELETE FROM club_analyze_staging WHERE guild_id = ? AND metric = ?',
      [guildId, metric],
    );

    // Bulk insert new rows
    const values = rows.map(r => [guildId, metric, r.member_name, r.power_value, userId]);
    const placeholders = values.map(() => '(?, ?, ?, ?, ?)').join(', ');
    const flatValues = values.flat();

    await connection.execute(
      `INSERT INTO club_analyze_staging (guild_id, metric, member_name, power_value, created_by)
       VALUES ${placeholders}`,
      flatValues,
    );

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Load all staging rows for a guild+metric combination.
 * Returns rows ordered by member_name for consistent display.
 */
export async function loadStagingRows(
  guildId: string,
  metric: 'sim' | 'total',
): Promise<StagingRow[]> {
  interface RawStagingRow {
    member_name: string;
    power_value: string;
    updated_at: Date;
  }

  const rows = await database.query<RawStagingRow[]>(
    `SELECT member_name, power_value, updated_at
     FROM club_analyze_staging
     WHERE guild_id = ? AND metric = ?
     ORDER BY member_name ASC`,
    [guildId, metric],
  );

  return rows.map(row => ({
    member_name: row.member_name,
    power_value: BigInt(row.power_value),
    updated_at: row.updated_at,
  }));
}

/**
 * Update a single staging row by its unique key (guild_id, metric, original_name).
 * If newName differs from originalName, the unique key constraint must be respected —
 * handled by checking for existing collisions before the update.
 */
export async function updateStagingRow(
  guildId: string,
  metric: 'sim' | 'total',
  originalName: string,
  newName: string,
  newPower: bigint,
): Promise<void> {
  const pool = database.getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    if (newName !== originalName) {
      // Check for name collision with another existing row
      const [rows] = await connection.execute(
        `SELECT COUNT(*) as cnt FROM club_analyze_staging
         WHERE guild_id = ? AND metric = ? AND member_name = ? AND member_name != ?`,
        [guildId, metric, newName, originalName],
      ) as [Array<{ cnt: number }>, unknown];
      if (rows[0].cnt > 0) {
        await connection.rollback();
        throw new Error(`Name "${newName}" already exists in staging for this scan`);
      }
    }

    await connection.execute(
      `UPDATE club_analyze_staging
       SET member_name = ?, power_value = ?
       WHERE guild_id = ? AND metric = ? AND member_name = ?`,
      [newName, newPower.toString(), guildId, metric, originalName],
    );

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Get a summary of staging status for both metrics for a guild.
 * Used by a future /club-status command.
 */
export async function getStagingStatus(
  guildId: string,
): Promise<StagingStatus> {
  interface StatusRow {
    metric: 'sim' | 'total';
    cnt: number;
    latest: Date | null;
  }

  const rows = await database.query<StatusRow[]>(
    `SELECT metric, COUNT(*) as cnt, MAX(updated_at) as latest
     FROM club_analyze_staging
     WHERE guild_id = ?
     GROUP BY metric`,
    [guildId],
  );

  const simRow = rows.find(r => r.metric === 'sim');
  const totalRow = rows.find(r => r.metric === 'total');

  return {
    sim: {
      count: simRow?.cnt ?? 0,
      updated_at: simRow?.latest ?? null,
    },
    total: {
      count: totalRow?.cnt ?? 0,
      updated_at: totalRow?.latest ?? null,
    },
  };
}
