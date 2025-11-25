-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `discord_id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NULL,
    `global_name` VARCHAR(191) NULL,
    `avatar` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_discord_id_key`(`discord_id`),
    INDEX `users_created_at_idx`(`created_at`),
    INDEX `users_updated_at_idx`(`updated_at`),
    INDEX `users_discord_id_created_at_idx`(`discord_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `sessions_token_key`(`token`),
    INDEX `sessions_user_id_idx`(`user_id`),
    INDEX `sessions_expires_at_idx`(`expires_at`),
    INDEX `sessions_token_idx`(`token`),
    INDEX `sessions_user_id_expires_at_idx`(`user_id`, `expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `guilds` (
    `id` VARCHAR(191) NOT NULL,
    `discord_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `settings` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `guilds_discord_id_key`(`discord_id`),
    INDEX `guilds_created_at_idx`(`created_at`),
    INDEX `guilds_updated_at_idx`(`updated_at`),
    INDEX `guilds_discord_id_created_at_idx`(`discord_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_guilds` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `guild_id` VARCHAR(191) NOT NULL,
    `roles` JSON NULL,

    INDEX `user_guilds_user_id_idx`(`user_id`),
    INDEX `user_guilds_guild_id_idx`(`guild_id`),
    INDEX `user_guilds_user_id_guild_id_idx`(`user_id`, `guild_id`),
    UNIQUE INDEX `user_guilds_user_id_guild_id_key`(`user_id`, `guild_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `conversations` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chat_messages` (
    `id` VARCHAR(191) NOT NULL,
    `conversation_id` VARCHAR(191) NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `guild_id` VARCHAR(191) NULL,
    `text` VARCHAR(191) NOT NULL,
    `admin_only` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `chat_messages_user_id_idx`(`user_id`),
    INDEX `chat_messages_guild_id_idx`(`guild_id`),
    INDEX `chat_messages_conversation_id_idx`(`conversation_id`),
    INDEX `chat_messages_created_at_idx`(`created_at`),
    INDEX `chat_messages_user_id_created_at_idx`(`user_id`, `created_at`),
    INDEX `chat_messages_guild_id_created_at_idx`(`guild_id`, `created_at`),
    INDEX `chat_messages_conversation_id_created_at_idx`(`conversation_id`, `created_at`),
    INDEX `chat_messages_admin_only_created_at_idx`(`admin_only`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stats` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NULL,
    `guild_id` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL,
    `value` JSON NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `stats_user_id_idx`(`user_id`),
    INDEX `stats_guild_id_idx`(`guild_id`),
    INDEX `stats_type_idx`(`type`),
    INDEX `stats_timestamp_idx`(`timestamp`),
    INDEX `stats_user_id_timestamp_idx`(`user_id`, `timestamp`),
    INDEX `stats_guild_id_timestamp_idx`(`guild_id`, `timestamp`),
    INDEX `stats_type_timestamp_idx`(`type`, `timestamp`),
    INDEX `stats_user_id_type_timestamp_idx`(`user_id`, `type`, `timestamp`),
    INDEX `stats_guild_id_type_timestamp_idx`(`guild_id`, `type`, `timestamp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `club_analyses` (
    `id` VARCHAR(191) NOT NULL,
    `guild_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `summary` VARCHAR(191) NOT NULL,
    `confidence` DOUBLE NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `club_analyses_guild_id_idx`(`guild_id`),
    INDEX `club_analyses_user_id_idx`(`user_id`),
    INDEX `club_analyses_created_at_idx`(`created_at`),
    INDEX `club_analyses_updated_at_idx`(`updated_at`),
    INDEX `club_analyses_confidence_idx`(`confidence`),
    INDEX `club_analyses_guild_id_created_at_idx`(`guild_id`, `created_at`),
    INDEX `club_analyses_user_id_created_at_idx`(`user_id`, `created_at`),
    INDEX `club_analyses_guild_id_confidence_idx`(`guild_id`, `confidence`),
    INDEX `club_analyses_user_id_confidence_idx`(`user_id`, `confidence`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `club_analysis_images` (
    `id` VARCHAR(191) NOT NULL,
    `analysis_id` VARCHAR(191) NOT NULL,
    `image_url` VARCHAR(191) NOT NULL,
    `original_name` VARCHAR(191) NOT NULL,
    `file_size` INTEGER NOT NULL,
    `uploaded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `club_analysis_images_analysis_id_idx`(`analysis_id`),
    INDEX `club_analysis_images_uploaded_at_idx`(`uploaded_at`),
    INDEX `club_analysis_images_file_size_idx`(`file_size`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `club_metrics` (
    `id` VARCHAR(191) NOT NULL,
    `analysis_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `value` JSON NOT NULL,
    `unit` VARCHAR(191) NULL,
    `category` VARCHAR(191) NOT NULL,

    INDEX `club_metrics_analysis_id_idx`(`analysis_id`),
    INDEX `club_metrics_name_idx`(`name`),
    INDEX `club_metrics_category_idx`(`category`),
    INDEX `club_metrics_analysis_id_name_idx`(`analysis_id`, `name`),
    INDEX `club_metrics_analysis_id_category_idx`(`analysis_id`, `category`),
    INDEX `club_metrics_category_name_idx`(`category`, `name`),
    UNIQUE INDEX `club_metrics_analysis_id_name_key`(`analysis_id`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `screenshot_analyses` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `screenshot_type` VARCHAR(191) NOT NULL,
    `image_url` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `summary` VARCHAR(191) NOT NULL,
    `confidence` DOUBLE NOT NULL,
    `processing_time` INTEGER NOT NULL,
    `model_used` VARCHAR(191) NOT NULL,
    `raw_response` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `screenshot_analyses_user_id_idx`(`user_id`),
    INDEX `screenshot_analyses_screenshot_type_idx`(`screenshot_type`),
    INDEX `screenshot_analyses_created_at_idx`(`created_at`),
    INDEX `screenshot_analyses_confidence_idx`(`confidence`),
    INDEX `screenshot_analyses_user_id_screenshot_type_idx`(`user_id`, `screenshot_type`),
    INDEX `screenshot_analyses_user_id_created_at_idx`(`user_id`, `created_at`),
    INDEX `screenshot_analyses_screenshot_type_created_at_idx`(`screenshot_type`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `screenshot_data` (
    `id` VARCHAR(191) NOT NULL,
    `analysis_id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` JSON NOT NULL,
    `data_type` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `confidence` DOUBLE NULL,

    INDEX `screenshot_data_analysis_id_idx`(`analysis_id`),
    INDEX `screenshot_data_key_idx`(`key`),
    INDEX `screenshot_data_category_idx`(`category`),
    INDEX `screenshot_data_analysis_id_key_idx`(`analysis_id`, `key`),
    INDEX `screenshot_data_analysis_id_category_idx`(`analysis_id`, `category`),
    INDEX `screenshot_data_category_key_idx`(`category`, `key`),
    UNIQUE INDEX `screenshot_data_analysis_id_key_key`(`analysis_id`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `screenshot_tags` (
    `id` VARCHAR(191) NOT NULL,
    `analysis_id` VARCHAR(191) NOT NULL,
    `tag` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NULL,

    INDEX `screenshot_tags_analysis_id_idx`(`analysis_id`),
    INDEX `screenshot_tags_tag_idx`(`tag`),
    INDEX `screenshot_tags_category_idx`(`category`),
    INDEX `screenshot_tags_analysis_id_tag_idx`(`analysis_id`, `tag`),
    INDEX `screenshot_tags_category_tag_idx`(`category`, `tag`),
    UNIQUE INDEX `screenshot_tags_analysis_id_tag_key`(`analysis_id`, `tag`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `screenshot_comparisons` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `analysis_id_1` VARCHAR(191) NOT NULL,
    `analysis_id_2` VARCHAR(191) NOT NULL,
    `comparison_type` VARCHAR(191) NOT NULL,
    `summary` VARCHAR(191) NOT NULL,
    `trend` VARCHAR(191) NOT NULL,
    `differences` JSON NOT NULL,
    `insights` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `screenshot_comparisons_user_id_idx`(`user_id`),
    INDEX `screenshot_comparisons_analysis_id_1_idx`(`analysis_id_1`),
    INDEX `screenshot_comparisons_analysis_id_2_idx`(`analysis_id_2`),
    INDEX `screenshot_comparisons_comparison_type_idx`(`comparison_type`),
    INDEX `screenshot_comparisons_created_at_idx`(`created_at`),
    INDEX `screenshot_comparisons_user_id_created_at_idx`(`user_id`, `created_at`),
    UNIQUE INDEX `screenshot_comparisons_analysis_id_1_analysis_id_2_compariso_key`(`analysis_id_1`, `analysis_id_2`, `comparison_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `screenshot_insights` (
    `id` VARCHAR(191) NOT NULL,
    `analysis_id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `priority` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `confidence` DOUBLE NOT NULL,
    `actionable` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `screenshot_insights_analysis_id_idx`(`analysis_id`),
    INDEX `screenshot_insights_type_idx`(`type`),
    INDEX `screenshot_insights_priority_idx`(`priority`),
    INDEX `screenshot_insights_actionable_idx`(`actionable`),
    INDEX `screenshot_insights_analysis_id_type_idx`(`analysis_id`, `type`),
    INDEX `screenshot_insights_analysis_id_priority_idx`(`analysis_id`, `priority`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `screenshot_recommendations` (
    `id` VARCHAR(191) NOT NULL,
    `analysis_id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `priority` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `impact` VARCHAR(191) NOT NULL,
    `effort` VARCHAR(191) NOT NULL,
    `actionable` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `screenshot_recommendations_analysis_id_idx`(`analysis_id`),
    INDEX `screenshot_recommendations_type_idx`(`type`),
    INDEX `screenshot_recommendations_priority_idx`(`priority`),
    INDEX `screenshot_recommendations_impact_idx`(`impact`),
    INDEX `screenshot_recommendations_effort_idx`(`effort`),
    INDEX `screenshot_recommendations_analysis_id_priority_idx`(`analysis_id`, `priority`),
    INDEX `screenshot_recommendations_analysis_id_type_idx`(`analysis_id`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `resource_type` VARCHAR(191) NOT NULL,
    `resource_id` VARCHAR(191) NOT NULL,
    `details` JSON NULL,
    `ip_address` VARCHAR(191) NULL,
    `user_agent` VARCHAR(191) NULL,
    `session_id` VARCHAR(191) NULL,
    `request_id` VARCHAR(191) NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `success` BOOLEAN NOT NULL DEFAULT true,
    `error_message` VARCHAR(191) NULL,

    INDEX `audit_logs_user_id_idx`(`user_id`),
    INDEX `audit_logs_action_idx`(`action`),
    INDEX `audit_logs_resource_type_idx`(`resource_type`),
    INDEX `audit_logs_resource_id_idx`(`resource_id`),
    INDEX `audit_logs_timestamp_idx`(`timestamp`),
    INDEX `audit_logs_success_idx`(`success`),
    INDEX `audit_logs_user_id_timestamp_idx`(`user_id`, `timestamp`),
    INDEX `audit_logs_action_timestamp_idx`(`action`, `timestamp`),
    INDEX `audit_logs_resource_type_timestamp_idx`(`resource_type`, `timestamp`),
    INDEX `audit_logs_user_id_action_timestamp_idx`(`user_id`, `action`, `timestamp`),
    INDEX `audit_logs_resource_type_resource_id_idx`(`resource_type`, `resource_id`),
    INDEX `audit_logs_request_id_idx`(`request_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_guilds` ADD CONSTRAINT `user_guilds_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_guilds` ADD CONSTRAINT `user_guilds_guild_id_fkey` FOREIGN KEY (`guild_id`) REFERENCES `guilds`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_messages` ADD CONSTRAINT `chat_messages_conversation_id_fkey` FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_messages` ADD CONSTRAINT `chat_messages_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_messages` ADD CONSTRAINT `chat_messages_guild_id_fkey` FOREIGN KEY (`guild_id`) REFERENCES `guilds`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stats` ADD CONSTRAINT `stats_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stats` ADD CONSTRAINT `stats_guild_id_fkey` FOREIGN KEY (`guild_id`) REFERENCES `guilds`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `club_analyses` ADD CONSTRAINT `club_analyses_guild_id_fkey` FOREIGN KEY (`guild_id`) REFERENCES `guilds`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `club_analyses` ADD CONSTRAINT `club_analyses_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `club_analysis_images` ADD CONSTRAINT `club_analysis_images_analysis_id_fkey` FOREIGN KEY (`analysis_id`) REFERENCES `club_analyses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `club_metrics` ADD CONSTRAINT `club_metrics_analysis_id_fkey` FOREIGN KEY (`analysis_id`) REFERENCES `club_analyses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `screenshot_analyses` ADD CONSTRAINT `screenshot_analyses_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `screenshot_data` ADD CONSTRAINT `screenshot_data_analysis_id_fkey` FOREIGN KEY (`analysis_id`) REFERENCES `screenshot_analyses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `screenshot_tags` ADD CONSTRAINT `screenshot_tags_analysis_id_fkey` FOREIGN KEY (`analysis_id`) REFERENCES `screenshot_analyses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `screenshot_comparisons` ADD CONSTRAINT `screenshot_comparisons_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `screenshot_comparisons` ADD CONSTRAINT `screenshot_comparisons_analysis_id_1_fkey` FOREIGN KEY (`analysis_id_1`) REFERENCES `screenshot_analyses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `screenshot_comparisons` ADD CONSTRAINT `screenshot_comparisons_analysis_id_2_fkey` FOREIGN KEY (`analysis_id_2`) REFERENCES `screenshot_analyses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `screenshot_insights` ADD CONSTRAINT `screenshot_insights_analysis_id_fkey` FOREIGN KEY (`analysis_id`) REFERENCES `screenshot_analyses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `screenshot_recommendations` ADD CONSTRAINT `screenshot_recommendations_analysis_id_fkey` FOREIGN KEY (`analysis_id`) REFERENCES `screenshot_analyses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
