-- Add central settings tables (JSON-based)

-- CreateTable
CREATE TABLE `user_settings` (
    `user_id` VARCHAR(191) NOT NULL,
    `data` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `guild_settings_central` (
    `guild_id` VARCHAR(191) NOT NULL,
    `data` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`guild_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_settings`
  ADD CONSTRAINT `user_settings_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `users`(`discord_id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `guild_settings_central`
  ADD CONSTRAINT `guild_settings_central_guild_id_fkey`
  FOREIGN KEY (`guild_id`) REFERENCES `guilds`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
