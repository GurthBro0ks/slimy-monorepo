/**
 * Sim Wars Troop data storage — MySQL-backed latest state + import log.
 *
 * Tables:
 *   sim_wars_troop_latest   — upsert-by (guild_id, player_name_canonical)
 *   sim_wars_troop_import_log — append-only audit log
 */

import { database } from './database.js';
import type { TroopStats } from './sim-wars-troop-ocr.js';
import { createLogger } from './logger.js';

const logger = createLogger({ context: 'sim-wars-troop-store' });

function canonicalizePlayerName(name: string): string {
  return String(name).trim().toLowerCase().replace(/\s+/g, '');
}

function toNumber(value: unknown): number | null {
  if (value === null || typeof value === 'undefined') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export interface SaveTroopResult {
  inserted: boolean;
  updated: boolean;
}

export async function upsertTroopLatest(
  guildId: string,
  playerName: string,
  stats: TroopStats,
  rawDetails?: Record<string, unknown>,
): Promise<SaveTroopResult> {
  if (!database.isConfigured()) throw new Error('Database not configured');

  const playerNameCanonical = canonicalizePlayerName(playerName);
  if (!playerNameCanonical) throw new Error('Player name cannot be empty');

  const details = rawDetails ? JSON.stringify(rawDetails) : null;

  const result = await database.execute(
    `INSERT INTO sim_wars_troop_latest (
      guild_id, player_name, player_name_canonical,
      troop_power, troop_hp, troop_attack, troop_defense, troop_rush,
      troop_leadership_current, troop_leadership_max,
      troop_crit_dmg_reduc_pct,
      troop_fire_dmg, troop_water_dmg, troop_earth_dmg, troop_wind_dmg, troop_poison_dmg,
      details, latest_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      player_name = VALUES(player_name),
      troop_power = VALUES(troop_power),
      troop_hp = VALUES(troop_hp),
      troop_attack = VALUES(troop_attack),
      troop_defense = VALUES(troop_defense),
      troop_rush = VALUES(troop_rush),
      troop_leadership_current = VALUES(troop_leadership_current),
      troop_leadership_max = VALUES(troop_leadership_max),
      troop_crit_dmg_reduc_pct = VALUES(troop_crit_dmg_reduc_pct),
      troop_fire_dmg = VALUES(troop_fire_dmg),
      troop_water_dmg = VALUES(troop_water_dmg),
      troop_earth_dmg = VALUES(troop_earth_dmg),
      troop_wind_dmg = VALUES(troop_wind_dmg),
      troop_poison_dmg = VALUES(troop_poison_dmg),
      details = VALUES(details),
      latest_at = NOW()`,
    [
      guildId, playerName, playerNameCanonical,
      toNumber(stats.troop_power),
      toNumber(stats.troop_hp),
      toNumber(stats.troop_attack),
      toNumber(stats.troop_defense),
      toNumber(stats.troop_rush),
      toNumber(stats.troop_leadership_current),
      toNumber(stats.troop_leadership_max),
      stats.troop_crit_dmg_reduc_pct !== null ? stats.troop_crit_dmg_reduc_pct : null,
      toNumber(stats.troop_fire_dmg),
      toNumber(stats.troop_water_dmg),
      toNumber(stats.troop_earth_dmg),
      toNumber(stats.troop_wind_dmg),
      toNumber(stats.troop_poison_dmg),
      details,
    ],
  );

  const inserted = result.affectedRows === 1;
  const updated = result.affectedRows === 2;

  logger.info('Upserted troop latest', { guildId, playerName, playerNameCanonical, inserted, updated });

  return { inserted, updated };
}

export async function logTroopImport(
  guildId: string,
  playerName: string,
  action: string,
  details?: Record<string, unknown>,
): Promise<void> {
  if (!database.isConfigured()) return;

  try {
    await database.execute(
      `INSERT INTO sim_wars_troop_import_log (guild_id, player_name, action, details, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [guildId, playerName, action, details ? JSON.stringify(details) : null],
    );
  } catch (err) {
    logger.error('Failed to log troop import', err as Error, { guildId, playerName, action });
  }
}

export async function getTroopLatest(
  guildId: string,
  playerName: string,
): Promise<Record<string, unknown> | null> {
  if (!database.isConfigured()) return null;

  const playerNameCanonical = canonicalizePlayerName(playerName);
  const rows = await database.query<Array<Record<string, unknown>>>(
    `SELECT * FROM sim_wars_troop_latest WHERE guild_id = ? AND player_name_canonical = ?`,
    [guildId, playerNameCanonical],
  );

  return rows[0] || null;
}

export async function getAllTroopsForGuild(
  guildId: string,
): Promise<Array<Record<string, unknown>>> {
  if (!database.isConfigured()) return [];

  return database.query<Array<Record<string, unknown>>>(
    `SELECT * FROM sim_wars_troop_latest WHERE guild_id = ? ORDER BY player_name_canonical`,
    [guildId],
  );
}

export async function deleteTroopForGuild(
  guildId: string,
  playerName: string,
): Promise<boolean> {
  if (!database.isConfigured()) return false;

  const playerNameCanonical = canonicalizePlayerName(playerName);
  const result = await database.execute(
    `DELETE FROM sim_wars_troop_latest WHERE guild_id = ? AND player_name_canonical = ?`,
    [guildId, playerNameCanonical],
  );

  return result.affectedRows > 0;
}

export function buildTroopCsv(
  rows: Array<Record<string, unknown>>,
): string {
  const headers = [
    'player_name', 'troop_power', 'troop_hp', 'troop_attack', 'troop_defense',
    'troop_rush', 'troop_leadership_current', 'troop_leadership_max',
    'troop_crit_dmg_reduc_pct', 'troop_fire_dmg', 'troop_water_dmg',
    'troop_earth_dmg', 'troop_wind_dmg', 'troop_poison_dmg', 'latest_at',
  ];

  const lines: string[] = [headers.join(',')];

  for (const row of rows) {
    const vals = headers.map(h => {
      const v = row[h];
      if (v === null || v === undefined) return '';
      const s = String(v);
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    });
    lines.push(vals.join(','));
  }

  return lines.join('\n');
}

export type TroopSortField =
  | 'power' | 'hp' | 'attack' | 'defense' | 'rush'
  | 'leadership' | 'crit' | 'fire' | 'water' | 'earth' | 'wind' | 'poison'
  | 'updated';

const SORT_COLUMN_MAP: Record<TroopSortField, string> = {
  power: 'troop_power',
  hp: 'troop_hp',
  attack: 'troop_attack',
  defense: 'troop_defense',
  rush: 'troop_rush',
  leadership: 'troop_leadership_current',
  crit: 'troop_crit_dmg_reduc_pct',
  fire: 'troop_fire_dmg',
  water: 'troop_water_dmg',
  earth: 'troop_earth_dmg',
  wind: 'troop_wind_dmg',
  poison: 'troop_poison_dmg',
  updated: 'latest_at',
};

export async function listTroopsSorted(
  guildId: string,
  sortField: TroopSortField = 'power',
  limit?: number,
): Promise<Array<Record<string, unknown>>> {
  if (!database.isConfigured()) return [];

  const column = SORT_COLUMN_MAP[sortField] ?? 'troop_power';
  const limitClause = limit && limit > 0 ? `LIMIT ${Math.min(limit, 100)}` : '';

  return database.query<Array<Record<string, unknown>>>(
    `SELECT * FROM sim_wars_troop_latest WHERE guild_id = ? ORDER BY ${column} DESC ${limitClause}`,
    [guildId],
  );
}
