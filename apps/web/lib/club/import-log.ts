import { getPool } from "@slimy/db";
import { isClubConfigured } from "../club-db";

type ActionType = "screenshot_scan" | "screenshot_push" | "xlsx_import" | "sheet_upload";

interface ImportLogEntry {
  guild_id: string;
  action_type: ActionType;
  user_email: string;
  user_role: string;
  member_count: number;
  members_json: string;
  provider: string;
  source_info: string;
  errors_json: string;
}

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS club_import_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    guild_id VARCHAR(20),
    action_type ENUM('screenshot_scan', 'screenshot_push', 'xlsx_import', 'sheet_upload'),
    user_email VARCHAR(255),
    user_role VARCHAR(50),
    member_count INT,
    members_json TEXT,
    provider VARCHAR(50),
    source_info VARCHAR(255),
    errors_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`;

function getImportPool() {
  if (!isClubConfigured()) return null;
  return getPool("CLUB_MYSQL");
}

export async function insertImportLog(entry: ImportLogEntry): Promise<void> {
  const pool = getImportPool();
  if (!pool) return;
  try {
    await pool.query(CREATE_TABLE_SQL);
    await pool.query(
      `INSERT INTO club_import_log (guild_id, action_type, user_email, user_role, member_count, members_json, provider, source_info, errors_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.guild_id,
        entry.action_type,
        entry.user_email,
        entry.user_role,
        entry.member_count,
        entry.members_json,
        entry.provider,
        entry.source_info,
        entry.errors_json,
      ]
    );
  } catch (err) {
    console.error("[import-log] Failed to log:", err);
  }
}

export async function getImportLog(guildId: string, limit = 50): Promise<any[]> {
  const pool = getImportPool();
  if (!pool) return [];
  try {
    await pool.query(CREATE_TABLE_SQL);
    const [rows] = await pool.query(
      `SELECT * FROM club_import_log WHERE guild_id = ? ORDER BY created_at DESC LIMIT ?`,
      [guildId, limit]
    );
    return rows as any[];
  } catch (err) {
    console.error("[import-log] Failed to fetch:", err);
    return [];
  }
}
