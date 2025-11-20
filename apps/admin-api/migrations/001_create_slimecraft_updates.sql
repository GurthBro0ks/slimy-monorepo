-- Migration: Create slimecraft_updates table
-- Description: Simple updates/notices system for Slime.craft server

CREATE TABLE IF NOT EXISTS slimecraft_updates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(50) NOT NULL DEFAULT 'info' COMMENT 'Type of update: info, warning, outage, etc.',
  title VARCHAR(255) NULL COMMENT 'Optional title for the update',
  body TEXT NOT NULL COMMENT 'Main content of the update',
  pinned BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Whether this update should be pinned to the top',
  created_by VARCHAR(100) NULL COMMENT 'Discord ID or username of creator',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_created_at (created_at),
  INDEX idx_pinned (pinned),
  INDEX idx_type (type),
  INDEX idx_pinned_created_at (pinned, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Slime.craft server updates and notices';
