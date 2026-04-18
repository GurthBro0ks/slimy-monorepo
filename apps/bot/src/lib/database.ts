/**
 * Database module — MySQL connection pool, schema initialization, query helpers.
 * Ported from /opt/slimy/app/lib/database.js
 */

import mysql, { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface SnailStatEntry {
  userId: string;
  username?: string;
  guildId?: string;
  guildName?: string;
  screenshotUrl?: string;
  wikiEnrichment?: Record<string, unknown>;
  stats?: {
    hp?: number;
    atk?: number;
    def?: number;
    rush?: number;
    fame?: number;
    tech?: number;
    art?: number;
    civ?: number;
    fth?: number;
  };
  confidence?: Record<string, number>;
  analysisText?: string;
  savedToSheet?: boolean;
  activeLoadout?: string;
  loadoutSnapshotId?: string;
}

export interface MemoryEntry {
  id: string;
  userId: string;
  guildId: string | null;
  note: string;
  tags: string[];
  context: Record<string, unknown>;
  createdAt: string;
}

export interface ImageStats {
  total: number;
  successful: number;
  unique_styles: number;
}

export interface PersonalityMetric {
  userId: string;
  guildId?: string | null;
  metricType: string;
  metricValue: Record<string, unknown>;
}

// ─── Database Class ───────────────────────────────────────────────────────────

class Database {
  private pool: Pool | null = null;

  // ─── Pool Management ────────────────────────────────────────────────────────

  isConfigured(): boolean {
    return Boolean(
      process.env.DB_HOST &&
        process.env.DB_USER &&
        process.env.DB_PASSWORD &&
        process.env.DB_NAME,
    );
  }

  getPool(): Pool {
    if (this.pool) return this.pool;
    if (!this.isConfigured()) {
      throw new Error(
        'Database not configured. Set DB_HOST, DB_USER, DB_PASSWORD, DB_NAME',
      );
    }

    this.pool = mysql.createPool({
      host: process.env.DB_HOST!,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      database: process.env.DB_NAME!,
      waitForConnections: true,
      connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      connectTimeout: 10000,
      multipleStatements: false, // Security: prevent SQL injection
    });

    console.log('[database] Connection pool initialized');
    return this.pool;
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  async initialize(): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('[database] Skipping initialization: missing DB configuration.');
      return false;
    }

    try {
      this.getPool();
      await this.createTables();
      return true;
    } catch (err) {
      console.error('[database] Initialization failed:', (err as Error).message || err);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    const pool = this.getPool();
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return true;
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  // ─── Query Helpers ──────────────────────────────────────────────────────────

  async query<T>(sql: string, params: any[] = []): Promise<T> {
    const pool = this.getPool();
    try {
      const [rows] = await pool.execute(sql, params);
      return rows as T;
    } catch (err) {
      console.error('[database] Query failed:', (err as Error).message);
      console.error('[database] SQL:', sql);
      throw err;
    }
  }

  async execute(sql: string, params: any[] = []): Promise<ResultSetHeader> {
    const pool = this.getPool();
    try {
      const [result] = await pool.execute<ResultSetHeader>(sql, params);
      return result;
    } catch (err) {
      console.error('[database] Execute failed:', (err as Error).message);
      console.error('[database] SQL:', sql);
      throw err;
    }
  }

  // ─── Guild / User Records ───────────────────────────────────────────────────

  async ensureGuildRecord(guildId: string, guildName: string | null = null): Promise<void> {
    if (!guildId) return;
    await this.execute(
      `INSERT INTO guilds (guild_id, guild_name)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE guild_name = VALUES(guild_name)`,
      [guildId, guildName],
    );
  }

  async ensureUserRecord(userId: string, username: string | null = null): Promise<void> {
    if (!userId) return;
    await this.execute(
      `INSERT INTO users (user_id, username)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE username = VALUES(username)`,
      [userId, username],
    );
  }

  // ─── Consent ────────────────────────────────────────────────────────────────

  async getUserConsent(userId: string, _guildId?: string | null): Promise<boolean> {
    const rows = await this.query<RowDataPacket[]>(
      'SELECT global_consent FROM users WHERE user_id = ?',
      [userId],
    );
    return Boolean(rows[0]?.global_consent);
  }

  async setUserConsent(userId: string, guildIdOrConsent: boolean, maybeConsent?: boolean): Promise<void> {
    const consent = typeof maybeConsent === 'undefined' ? guildIdOrConsent : maybeConsent;
    await this.execute(
      `INSERT INTO users (user_id, global_consent, consent_granted_at)
       VALUES (?, ?, IF(? = TRUE, NOW(), NULL))
       ON DUPLICATE KEY UPDATE
         global_consent = VALUES(global_consent),
         consent_granted_at = IF(VALUES(global_consent) = TRUE, NOW(), consent_granted_at),
         updated_at = NOW()`,
      [userId, consent ? 1 : 0, consent ? 1 : 0],
    );
  }

  async getSheetsConsent(userId: string, guildId: string): Promise<{ sheets_consent: boolean; sheet_id: string | null }> {
    const rows = await this.query<RowDataPacket[]>(
      `SELECT sheets_consent, sheet_id
       FROM user_guilds
       WHERE user_id = ? AND guild_id = ?`,
      [userId, guildId],
    );

    if (rows.length === 0) {
      return { sheets_consent: false, sheet_id: null };
    }

    return {
      sheets_consent: Boolean(rows[0].sheets_consent),
      sheet_id: rows[0].sheet_id,
    };
  }

  async setSheetsConsent(userId: string, guildId: string, consent: boolean, sheetId: string | null = null): Promise<void> {
    await this.ensureUserRecord(userId);
    await this.ensureGuildRecord(guildId);

    await this.execute(
      `INSERT INTO user_guilds (user_id, guild_id, sheets_consent, sheet_id)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         sheets_consent = VALUES(sheets_consent),
         sheet_id = VALUES(sheet_id)`,
      [userId, guildId, consent ? 1 : 0, sheetId],
    );
  }

  // ─── Memories ────────────────────────────────────────────────────────────────

  async saveMemory(
    userId: string,
    guildId: string | null,
    note: string,
    tags: string[] = [],
    context: Record<string, unknown> = {},
  ): Promise<MemoryEntry> {
    await this.ensureUserRecord(userId);
    if (guildId) await this.ensureGuildRecord(guildId);

    const id = uuidv4();
    await this.execute(
      `INSERT INTO memories (id, user_id, guild_id, note, tags, context)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, userId, guildId, note, JSON.stringify(tags), JSON.stringify(context)],
    );

    return {
      id,
      userId,
      guildId,
      note,
      tags,
      context,
      createdAt: new Date().toISOString(),
    };
  }

  async getMemories(userId: string, guildId: string | null, limit = 25): Promise<MemoryEntry[]> {
    const safeLimit = Number.isFinite(Number(limit))
      ? Math.max(1, Math.min(500, Number(limit)))
      : 25;

    const rows = await this.query<RowDataPacket[]>(
      `SELECT id, note, tags, context, created_at
       FROM memories
       WHERE user_id = ? AND guild_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [userId, guildId, safeLimit],
    );

    return rows.map((row) => ({
      id: row.id as string,
      userId,
      guildId,
      note: row.note as string,
      tags: Array.isArray(row.tags)
        ? row.tags as string[]
        : row.tags
          ? JSON.parse(row.tags as string)
          : [],
      context:
        typeof row.context === 'object' && row.context !== null
          ? row.context as Record<string, unknown>
          : row.context
            ? JSON.parse(row.context as string)
            : {},
      createdAt: row.created_at as string,
    }));
  }

  async deleteMemory(userId: string, guildId: string | null, memoryId: string): Promise<boolean> {
    const result = await this.execute(
      `DELETE FROM memories WHERE id = ? AND user_id = ? AND guild_id = ?`,
      [memoryId, userId, guildId],
    );
    return result.affectedRows > 0;
  }

  async deleteAllMemories(userId: string, guildId: string | null): Promise<number> {
    const result = await this.execute(
      `DELETE FROM memories WHERE user_id = ? AND guild_id = ?`,
      [userId, guildId],
    );
    return result.affectedRows;
  }

  // ─── Image Generation ───────────────────────────────────────────────────────

  async logImageGeneration({
    userId,
    guildId = null,
    channelId = null,
    prompt,
    enhancedPrompt = null,
    style = 'standard',
    rating = 'default',
    quality = 'standard',
    model = 'dall-e-3',
    success = true,
    errorMessage = null,
    imageUrl = null,
  }: {
    userId: string;
    guildId?: string | null;
    channelId?: string | null;
    prompt: string;
    enhancedPrompt?: string | null;
    style?: string;
    rating?: string;
    quality?: string;
    model?: string;
    success?: boolean;
    errorMessage?: string | null;
    imageUrl?: string | null;
  }): Promise<void> {
    await this.ensureUserRecord(userId);
    if (guildId) await this.ensureGuildRecord(guildId);

    await this.execute(
      `INSERT INTO image_generation_log
       (user_id, guild_id, channel_id, prompt, enhanced_prompt, style, rating, quality, model, success, error_message, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        guildId,
        channelId,
        prompt,
        enhancedPrompt,
        style,
        rating,
        quality,
        model,
        success ? 1 : 0,
        errorMessage,
        imageUrl,
      ],
    );
  }

  async getImageStats(userId: string): Promise<ImageStats> {
    const [totals] = await this.query<(RowDataPacket & ImageStats)[]>(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) AS successful,
         COUNT(DISTINCT style) AS unique_styles
       FROM image_generation_log
       WHERE user_id = ?`,
      [userId],
    );

    return {
      total: totals?.total || 0,
      successful: totals?.successful || 0,
      unique_styles: totals?.unique_styles || 0,
    };
  }

  // ─── Snail Stats ───────────────────────────────────────────────────────────

  parseJSON<T>(value: unknown, fallback: T): T {
    if (value === null || typeof value === 'undefined') return fallback;
    if (typeof value === 'object') return value as T;
    try {
      return JSON.parse(value as string);
    } catch {
      return fallback;
    }
  }

  async saveSnailStat(entry: SnailStatEntry): Promise<number> {
    await this.ensureUserRecord(entry.userId, entry.username);
    if (entry.guildId) await this.ensureGuildRecord(entry.guildId, entry.guildName);

    const result = await this.execute(
      `INSERT INTO snail_stats
       (user_id, guild_id, screenshot_url, wiki_enrichment, hp, atk, def, rush, fame, tech, art, civ, fth, confidence, analysis_text, saved_to_sheet, active_loadout, loadout_snapshot_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.userId,
        entry.guildId || null,
        entry.screenshotUrl || null,
        entry.wikiEnrichment ? JSON.stringify(entry.wikiEnrichment) : null,
        entry.stats?.hp ?? null,
        entry.stats?.atk ?? null,
        entry.stats?.def ?? null,
        entry.stats?.rush ?? null,
        entry.stats?.fame ?? null,
        entry.stats?.tech ?? null,
        entry.stats?.art ?? null,
        entry.stats?.civ ?? null,
        entry.stats?.fth ?? null,
        JSON.stringify(entry.confidence || {}),
        entry.analysisText || null,
        entry.savedToSheet ? 1 : 0,
        entry.activeLoadout || null,
        entry.loadoutSnapshotId || null,
      ],
    );

    return result.insertId;
  }

  async saveSnailRecommendation(statId: number, userId: string, enrichment: Record<string, unknown>): Promise<void> {
    const payload = {
      enrichment: enrichment || {},
      next_steps: Array.isArray(enrichment?.nextSteps)
        ? enrichment.nextSteps
        : [],
    };

    await this.execute(
      `INSERT INTO snail_recommendations (snail_stat_id, user_id, enrichment, next_steps)
       VALUES (?, ?, ?, ?)`,
      [statId, userId, JSON.stringify(payload.enrichment), JSON.stringify(payload.next_steps)],
    );
  }

  async getRecentSnailStats(userId: string, guildId: string | null, limit = 5): Promise<RowDataPacket[]> {
    const safeLimit = Number.isFinite(Number(limit))
      ? Math.max(1, Math.min(50, Number(limit)))
      : 5;

    return this.query<RowDataPacket[]>(
      `SELECT * FROM snail_stats
       WHERE user_id = ? AND (? IS NULL OR guild_id = ?)
       ORDER BY created_at DESC
       LIMIT ?`,
      [userId, guildId, guildId, safeLimit],
    );
  }

  async markSnailStatSaved(statId: number): Promise<void> {
    await this.execute(`UPDATE snail_stats SET saved_to_sheet = 1 WHERE id = ?`, [statId]);
  }

  async getSnailLeaderboard(guildId: string, limit = 10): Promise<RowDataPacket[]> {
    const safeLimit = Number.isFinite(Number(limit))
      ? Math.max(1, Math.min(50, Number(limit)))
      : 10;

    return this.query<RowDataPacket[]>(
      `SELECT user_id AS userId, COUNT(*) AS analysis_count, MAX(created_at) AS last_analysis
       FROM snail_stats
       WHERE guild_id = ?
       GROUP BY user_id
       ORDER BY analysis_count DESC
       LIMIT ${safeLimit}`,
      [guildId],
    );
  }

  // ─── Personality ───────────────────────────────────────────────────────────

  async recordPersonalityMetric({
    userId,
    guildId = null,
    metricType,
    metricValue,
  }: PersonalityMetric): Promise<void> {
    await this.ensureUserRecord(userId);
    if (guildId) await this.ensureGuildRecord(guildId);

    await this.execute(
      `INSERT INTO personality_metrics (user_id, guild_id, metric_type, metric_value)
       VALUES (?, ?, ?, ?)`,
      [userId, guildId, metricType, JSON.stringify(metricValue || {})],
    );
  }

  async trackPersonalityUsage(userId: string, mode: string, catchphrase?: string | null): Promise<void> {
    await this.recordPersonalityMetric({
      userId,
      metricType: 'response',
      metricValue: { mode, catchphrase },
    });
  }

  // ─── Schema Initialization ─────────────────────────────────────────────────

  async createTables(): Promise<void> {
    const pool = this.getPool();

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        user_id VARCHAR(20) PRIMARY KEY,
        username VARCHAR(100),
        global_consent TINYINT(1) DEFAULT 0,
        consent_granted_at DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS guilds (
        guild_id VARCHAR(20) PRIMARY KEY,
        guild_name VARCHAR(100),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS guild_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        guild_id VARCHAR(20) NOT NULL,
        key_name VARCHAR(64) NOT NULL,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_guild_setting (guild_id, key_name),
        CONSTRAINT fk_guild_settings_guild FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS user_guilds (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(20) NOT NULL,
        guild_id VARCHAR(20) NOT NULL,
        sheets_consent TINYINT(1) DEFAULT 0,
        sheet_id VARCHAR(100),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_guild (user_id, guild_id),
        CONSTRAINT fk_user_guild_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        CONSTRAINT fk_user_guild_guild FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS memories (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(20) NOT NULL,
        guild_id VARCHAR(20),
        note TEXT NOT NULL,
        tags JSON,
        context JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_memories_user_guild (user_id, guild_id),
        INDEX idx_memories_created (created_at),
        CONSTRAINT fk_memories_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        CONSTRAINT fk_memories_guild FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS mode_configs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        guild_id VARCHAR(20),
        channel_id VARCHAR(20),
        category_id VARCHAR(20),
        thread_id VARCHAR(20),
        config JSON NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_location (guild_id, channel_id, category_id, thread_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS snail_stats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(20) NOT NULL,
        guild_id VARCHAR(20),
        screenshot_url VARCHAR(500),
        hp INT,
        atk INT,
        def INT,
        rush INT,
        fame INT,
        tech INT,
        art INT,
        civ INT,
        fth INT,
        confidence JSON,
        analysis_text TEXT,
        saved_to_sheet TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_snail_user (user_id),
        INDEX idx_snail_guild (guild_id),
        CONSTRAINT fk_snail_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        CONSTRAINT fk_snail_guild FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS snail_recommendations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        snail_stat_id INT NOT NULL,
        user_id VARCHAR(20) NOT NULL,
        enrichment JSON,
        next_steps JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_snail_rec_stat (snail_stat_id),
        INDEX idx_snail_rec_user (user_id),
        CONSTRAINT fk_snail_rec_stat FOREIGN KEY (snail_stat_id) REFERENCES snail_stats(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS personality_metrics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(20),
        guild_id VARCHAR(20),
        metric_type VARCHAR(50),
        metric_value JSON,
        recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_personality_user (user_id),
        CONSTRAINT fk_personality_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        CONSTRAINT fk_personality_guild FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS image_generation_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(20) NOT NULL,
        guild_id VARCHAR(20),
        channel_id VARCHAR(20),
        prompt TEXT NOT NULL,
        enhanced_prompt TEXT,
        style VARCHAR(50),
        rating VARCHAR(20),
        quality VARCHAR(20) DEFAULT 'standard',
        model VARCHAR(50) DEFAULT 'dall-e-3',
        success TINYINT(1) DEFAULT 1,
        error_message TEXT,
        image_url VARCHAR(500),
        generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_image_user (user_id),
        INDEX idx_image_guild (guild_id),
        INDEX idx_image_success (success),
        INDEX idx_image_created (created_at),
        CONSTRAINT fk_image_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        CONSTRAINT fk_image_guild FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS guild_personality (
        guild_id VARCHAR(32) NOT NULL PRIMARY KEY,
        profile_json JSON NOT NULL,
        updated_by VARCHAR(32) NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS channel_settings (
        guild_id VARCHAR(32) NOT NULL,
        channel_id VARCHAR(32) NOT NULL,
        channel_name VARCHAR(120) NULL,
        modes_json JSON NOT NULL,
        allowlist_json JSON NOT NULL,
        updated_by VARCHAR(32) NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (guild_id, channel_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS admin_audit_log (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        admin_id VARCHAR(32) NULL,
        guild_id VARCHAR(32) NULL,
        action VARCHAR(120) NOT NULL,
        payload JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY idx_admin (admin_id),
        KEY idx_guild (guild_id),
        KEY idx_action (action)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS admin_sessions (
        session_id CHAR(36) NOT NULL PRIMARY KEY,
        admin_id VARCHAR(32) NOT NULL,
        csrf_token CHAR(64) NOT NULL,
        ip_address VARCHAR(64) NULL,
        user_agent VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NULL,
        KEY idx_admin (admin_id),
        KEY idx_expires (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  }

  // Alias for backward compatibility with test suite
  async ensureSchema(): Promise<void> {
    return this.createTables();
  }
}

// ─── Singleton Export ─────────────────────────────────────────────────────────

export const database = new Database();
export default database;
