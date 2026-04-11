-- Migration: 0001_club_analyze_staging
-- Creates the club_analyze_staging table for /club-analyze edit UI workflow.
-- sim_power and total_power columns in club_latest are checked before altering.

-- Only add sim_power/total_power to club_latest if they don't already exist
-- (they were added in a prior migration but we check defensively)
-- ALTER TABLE club_latest
--   ADD COLUMN sim_power BIGINT UNSIGNED NULL DEFAULT NULL AFTER name_display,
--   ADD COLUMN total_power BIGINT UNSIGNED NULL DEFAULT NULL AFTER sim_power;

-- Create the staging table for /club-analyze scan results.
-- This holds the FINAL deduped canonical dataset (not raw per-page rows).
-- Keyed by (guild_id, metric, member_name) — unique constraint prevents duplicates.
CREATE TABLE IF NOT EXISTS club_analyze_staging (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  guild_id VARCHAR(32) NOT NULL,
  metric ENUM('sim', 'total') NOT NULL,
  member_name VARCHAR(64) NOT NULL,
  power_value BIGINT UNSIGNED NOT NULL,
  created_by VARCHAR(32) NOT NULL COMMENT 'Discord user ID who ran club-analyze',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_staging_row (guild_id, metric, member_name),
  INDEX idx_guild_metric (guild_id, metric)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
