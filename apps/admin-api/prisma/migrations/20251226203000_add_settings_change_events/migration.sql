-- Add settings change events table (durable cursor + audit trail for settings writes)

-- CreateTable
CREATE TABLE `settings_change_events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `scope_type` VARCHAR(16) NOT NULL,
    `scope_id` VARCHAR(191) NOT NULL,
    `kind` VARCHAR(64) NOT NULL,
    `actor_user_id` VARCHAR(191) NOT NULL,
    `actor_is_admin` BOOLEAN NOT NULL DEFAULT false,
    `source` VARCHAR(32) NULL,
    `changed_keys` JSON NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `settings_change_events_scope_type_scope_id_id_idx` ON `settings_change_events`(`scope_type`, `scope_id`, `id`);

-- CreateIndex
CREATE INDEX `settings_change_events_created_at_idx` ON `settings_change_events`(`created_at`);

