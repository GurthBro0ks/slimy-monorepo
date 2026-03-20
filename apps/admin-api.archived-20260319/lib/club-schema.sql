-- club-schema.sql
-- DDL for club analytics tables
-- Stores member metrics over time and latest aggregated view

-- Table: club_metrics
-- Stores historical member power metrics from OCR parsing
CREATE TABLE IF NOT EXISTS club_metrics (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  guild_id VARCHAR(64) NOT NULL,
  member_key VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  sim_power BIGINT NULL,
  total_power BIGINT NULL,
  observed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_guild_member (guild_id, member_key),
  INDEX idx_observed_at (observed_at),

  UNIQUE KEY unique_guild_member_observed (guild_id, member_key, observed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: club_latest
-- Stores the latest/current metrics per member (aggregated view)
CREATE TABLE IF NOT EXISTS club_latest (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  guild_id VARCHAR(64) NOT NULL,
  member_key VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  sim_power BIGINT NULL,
  total_power BIGINT NULL,
  last_seen_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY unique_guild_member (guild_id, member_key),
  INDEX idx_guild_id (guild_id),
  INDEX idx_total_power (total_power)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add member_key column to existing tables if needed (migration safety)
-- These are safe to run even if columns already exist

-- For club_metrics table
ALTER TABLE club_metrics
  ADD COLUMN IF NOT EXISTS member_key VARCHAR(255) NOT NULL AFTER guild_id;

-- For club_latest table
ALTER TABLE club_latest
  ADD COLUMN IF NOT EXISTS member_key VARCHAR(255) NOT NULL AFTER guild_id;

-- Add indexes if they don't exist (MySQL will ignore if they already exist)
ALTER TABLE club_metrics
  ADD INDEX IF NOT EXISTS idx_guild_member (guild_id, member_key),
  ADD UNIQUE KEY IF NOT EXISTS unique_guild_member_observed (guild_id, member_key, observed_at);

ALTER TABLE club_latest
  ADD UNIQUE KEY IF NOT EXISTS unique_guild_member (guild_id, member_key);
