-- AlterTable
ALTER TABLE `users` ADD COLUMN `discord_access_token` VARCHAR(191) NULL,
    ADD COLUMN `discord_refresh_token` VARCHAR(191) NULL,
    ADD COLUMN `token_expires_at` DATETIME(3) NULL;
