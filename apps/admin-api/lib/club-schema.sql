-- Club analytics schema extensions (SIM vs TOTAL + member_key normalization)
-- This file is additive and safe to run multiple times; ALTER statements may no-op if columns already exist.

CREATE TABLE IF NOT EXISTS club_latest (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  guild_id VARCHAR(64) NOT NULL,
  member_key VARCHAR(120) NOT NULL,
  display_name VARCHAR(120) NULL,
  total_power BIGINT NULL,
  sim_power BIGINT NULL,
  latest_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_guild_member (guild_id, member_key),
  KEY idx_guild (guild_id)
);

CREATE TABLE IF NOT EXISTS club_metrics (
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
);

-- Backfill/guardrails for existing installs (will no-op if columns/indexes already exist).
ALTER TABLE club_latest ADD COLUMN IF NOT EXISTS member_key VARCHAR(120) NOT NULL;
ALTER TABLE club_latest ADD UNIQUE KEY IF NOT EXISTS uniq_guild_member (guild_id, member_key);
ALTER TABLE club_metrics ADD COLUMN IF NOT EXISTS member_key VARCHAR(120) NULL;
ALTER TABLE club_metrics ADD UNIQUE KEY IF NOT EXISTS uniq_metric (guild_id, snapshot_id, member_key, metric);
