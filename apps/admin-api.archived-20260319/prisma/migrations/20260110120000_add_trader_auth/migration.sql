-- Add isolated trader auth tables used by the trader web app.
-- This migration is non-destructive: it only creates new tables + indexes + FKs.

-- CreateTable
CREATE TABLE `trader_users` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `disabled` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `trader_users_username_key`(`username`),
    INDEX `trader_users_username_idx`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trader_invites` (
    `id` VARCHAR(191) NOT NULL,
    `code_hash` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expires_at` DATETIME(3) NULL,
    `max_uses` INTEGER NOT NULL DEFAULT 1,
    `use_count` INTEGER NOT NULL DEFAULT 0,
    `used_at` DATETIME(3) NULL,
    `used_by_id` VARCHAR(191) NULL,
    `note` VARCHAR(255) NULL,

    UNIQUE INDEX `trader_invites_code_hash_key`(`code_hash`),
    UNIQUE INDEX `trader_invites_used_by_id_key`(`used_by_id`),
    INDEX `trader_invites_code_hash_idx`(`code_hash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trader_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `last_seen_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `trader_sessions_token_hash_key`(`token_hash`),
    INDEX `trader_sessions_token_hash_idx`(`token_hash`),
    INDEX `trader_sessions_user_id_idx`(`user_id`),
    INDEX `trader_sessions_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trader_login_attempts` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `ip_address` VARCHAR(45) NOT NULL,
    `success` BOOLEAN NOT NULL DEFAULT false,
    `attempted_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `trader_login_attempts_username_attempted_at_idx`(`username`, `attempted_at`),
    INDEX `trader_login_attempts_ip_address_attempted_at_idx`(`ip_address`, `attempted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `trader_invites` ADD CONSTRAINT `trader_invites_used_by_id_fkey` FOREIGN KEY (`used_by_id`) REFERENCES `trader_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trader_sessions` ADD CONSTRAINT `trader_sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `trader_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

