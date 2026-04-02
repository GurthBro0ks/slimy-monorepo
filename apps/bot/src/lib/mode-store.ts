/**
 * Channel mode persistence store — set/view/list/clear modes in DB.
 * Ported from /opt/slimy/app/lib/mode-store.js
 */

import { database } from "./database.js";
import { emptyState } from "./modes.js";

interface ModeRecord {
  guildId: string;
  targetId: string;
  targetType: "category" | "channel" | "thread";
  modes: Record<string, boolean>;
  updatedAt: number;
}

function formatModeState(modes: Record<string, boolean>): string {
  const active = Object.entries(modes)
    .filter(([, v]) => v)
    .map(([k]) => k);
  return active.length === 0 ? "(none)" : active.join(" + ");
}

async function setModes({
  guildId,
  targetId,
  targetType,
  modes: modeList,
  operation = "replace",
  actorHasManageGuild,
}: {
  guildId: string;
  targetId: string;
  targetType: string;
  modes: string[];
  operation?: string;
  actorHasManageGuild?: boolean;
}): Promise<void> {
  if (!database.isConfigured()) return;

  const state: Record<string, boolean> = { ...emptyState() };

  if (operation === "clear") {
    // Delete the record
    try {
      const pool = database.getPool();
      await pool.query(
        `DELETE FROM mode_configs WHERE guild_id = ? AND target_id = ? AND target_type = ?`,
        [guildId, targetId, targetType],
      );
    } catch {
      // ignore
    }
    return;
  }

  if (operation === "remove") {
    // Load existing and only disable specified modes
    try {
      const [rows] = await database.getPool().query(
        `SELECT modes_json FROM mode_configs WHERE guild_id = ? AND target_id = ? AND target_type = ?`,
        [guildId, targetId, targetType],
      );
      const rowsArr = rows as Array<{ modes_json?: string }>;
      if (rowsArr?.[0]?.modes_json) {
        const existing = JSON.parse(rowsArr[0].modes_json);
        Object.assign(state, existing);
      }
    } catch {
      // ignore
    }
    for (const m of modeList) state[m] = false;
  } else {
    // replace or merge
    for (const m of modeList) state[m] = true;
  }

  try {
    const pool = database.getPool();
    await pool.query(
      `INSERT INTO mode_configs (guild_id, target_id, target_type, modes_json, updated_at)
       VALUES (?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE modes_json = VALUES(modes_json), updated_at = NOW()`,
      [guildId, targetId, targetType, JSON.stringify(state)],
    );
  } catch {
    // ignore
  }
}

async function viewModes({
  guildId,
  targetId,
  targetType,
  parents,
}: {
  guildId: string;
  targetId: string;
  targetType: string;
  parents?: Array<{ targetId: string; targetType: string }>;
}): Promise<{
  direct: { modes: Record<string, boolean> };
  inherited: Array<{ label: string; modes: Record<string, boolean> }>;
  effective: { modes: Record<string, boolean> };
}> {
  const direct: Record<string, boolean> = { ...emptyState() };
  const inherited: Array<{ label: string; modes: Record<string, boolean> }> = [];

  // Load direct
  if (database.isConfigured()) {
    try {
      const [rows] = await database.getPool().query(
        `SELECT modes_json FROM mode_configs WHERE guild_id = ? AND target_id = ? AND target_type = ?`,
        [guildId, targetId, targetType],
      );
      const rowsArr = rows as Array<{ modes_json?: string }>;
      if (rowsArr?.[0]?.modes_json) {
        Object.assign(direct, JSON.parse(rowsArr[0].modes_json));
      }
    } catch {
      // ignore
    }
  }

  // Load inherited
  if (parents) {
    for (const parent of parents) {
      if (database.isConfigured()) {
        try {
          const [rows] = await database.getPool().query(
            `SELECT modes_json FROM mode_configs WHERE guild_id = ? AND target_id = ? AND target_type = ?`,
            [guildId, parent.targetId, parent.targetType],
          );
          const rowsArr = rows as Array<{ modes_json?: string }>;
          if (rowsArr?.[0]?.modes_json) {
            inherited.push({
              label: `${parent.targetType}:${parent.targetId}`,
              modes: JSON.parse(rowsArr[0].modes_json),
            });
          }
        } catch {
          // ignore
        }
      }
    }
  }

  // Compute effective
  const effective: Record<string, boolean> = { ...emptyState() };
  for (const entry of inherited) {
    for (const [k, v] of Object.entries(entry.modes)) {
      if (v) effective[k] = true;
    }
  }
  for (const [k, v] of Object.entries(direct)) {
    if (v) effective[k] = true;
  }

  return {
    direct: { modes: direct },
    inherited,
    effective: { modes: effective },
  };
}

async function listModes({
  guildId,
  scope = "guild",
  presenceMode,
  presenceFilter,
}: {
  guildId: string;
  scope?: string;
  presenceMode?: string | null;
  presenceFilter?: string | null;
}): Promise<Array<{ label: string; modes: Record<string, boolean> }>> {
  if (!database.isConfigured()) return [];

  try {
    const [rows] = await database.getPool().query(
      `SELECT target_id, target_type, modes_json FROM mode_configs WHERE guild_id = ?`,
      [guildId],
    );
    const rowsArr = rows as Array<{
      target_id: string;
      target_type: string;
      modes_json?: string;
    }>;

    return (rowsArr || [])
      .map((row) => {
        const modes: Record<string, boolean> = JSON.parse(row.modes_json || "{}");
        return {
          label: `${row.target_type}:${row.target_id}`,
          modes: { ...emptyState(), ...modes },
        };
      })
      .filter((entry) => {
        if (!presenceMode && !presenceFilter) return true;
        if (presenceMode) {
          const has =
            presenceFilter === "has"
              ? entry.modes[presenceMode]
              : !entry.modes[presenceMode];
          return has;
        }
        return true;
      });
  } catch {
    return [];
  }
}

export { setModes, viewModes, listModes, formatModeState };
