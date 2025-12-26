-- Add memory records table (structured state/summaries; no raw chat logs by default)

-- CreateTable
CREATE TABLE `memory_records` (
    `id` VARCHAR(191) NOT NULL,
    `scope_type` VARCHAR(16) NOT NULL,
    `scope_id` VARCHAR(191) NOT NULL,
    `kind` VARCHAR(64) NOT NULL,
    `source` VARCHAR(32) NOT NULL,
    `content` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `memory_records_scope_type_scope_id_idx` ON `memory_records`(`scope_type`, `scope_id`);

-- CreateIndex
CREATE INDEX `memory_records_scope_type_scope_id_kind_idx` ON `memory_records`(`scope_type`, `scope_id`, `kind`);

