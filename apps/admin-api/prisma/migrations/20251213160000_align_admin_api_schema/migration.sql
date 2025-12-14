-- Align DB schema with current Prisma datamodel expectations used by admin-api.
-- This migration is intended to be safe and idempotent when applied via `prisma migrate deploy`
-- on environments that are already at the previous migration baseline.

-- Add User.last_active_guild_id used by Prisma model `User.lastActiveGuildId`
ALTER TABLE `users`
  ADD COLUMN `last_active_guild_id` VARCHAR(191) NULL;

CREATE INDEX `users_last_active_guild_id_idx` ON `users`(`last_active_guild_id`);

ALTER TABLE `users`
  ADD CONSTRAINT `users_last_active_guild_id_fkey`
  FOREIGN KEY (`last_active_guild_id`) REFERENCES `guilds`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Add Guild.icon + Guild.owner_id expected by current Prisma model `Guild`
ALTER TABLE `guilds`
  ADD COLUMN `icon` VARCHAR(191) NULL,
  ADD COLUMN `owner_id` VARCHAR(191) NULL;

CREATE INDEX `guilds_owner_id_idx` ON `guilds`(`owner_id`);

-- Legacy column from earlier schema; make it nullable so admin-api can insert rows without it.
ALTER TABLE `guilds`
  MODIFY COLUMN `discord_id` VARCHAR(191) NULL;

