-- CreateTable guild_settings
CREATE TABLE "guild_settings" (
    "id" TEXT NOT NULL,
    "guild_id" TEXT NOT NULL,
    "sheet_id" TEXT,
    "sheet_tab" TEXT,
    "view_mode" TEXT NOT NULL DEFAULT 'baseline',
    "allow_public" BOOLEAN NOT NULL DEFAULT false,
    "screenshot_channel_id" TEXT,
    "uploads_enabled" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guild_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable guild_personalities
CREATE TABLE "guild_personalities" (
    "id" TEXT NOT NULL,
    "guild_id" TEXT NOT NULL,
    "system_prompt" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "top_p" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "tone" TEXT NOT NULL DEFAULT 'neutral',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guild_personalities_pkey" PRIMARY KEY ("id")
);

-- CreateTable corrections
CREATE TABLE "corrections" (
    "id" TEXT NOT NULL,
    "guild_id" TEXT NOT NULL,
    "week_id" TEXT NOT NULL,
    "member_key" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "reason" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "corrections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guild_settings_guild_id_key" ON "guild_settings"("guild_id");

-- CreateIndex
CREATE INDEX "guild_settings_guild_id_idx" ON "guild_settings"("guild_id");

-- CreateIndex
CREATE INDEX "guild_settings_updated_at_idx" ON "guild_settings"("updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "guild_personalities_guild_id_key" ON "guild_personalities"("guild_id");

-- CreateIndex
CREATE INDEX "guild_personalities_guild_id_idx" ON "guild_personalities"("guild_id");

-- CreateIndex
CREATE INDEX "guild_personalities_updated_at_idx" ON "guild_personalities"("updated_at");

-- CreateIndex
CREATE INDEX "corrections_guild_id_idx" ON "corrections"("guild_id");

-- CreateIndex
CREATE INDEX "corrections_week_id_idx" ON "corrections"("week_id");

-- CreateIndex
CREATE INDEX "corrections_member_key_idx" ON "corrections"("member_key");

-- CreateIndex
CREATE INDEX "corrections_metric_idx" ON "corrections"("metric");

-- CreateIndex
CREATE INDEX "corrections_created_at_idx" ON "corrections"("created_at");

-- CreateIndex
CREATE INDEX "corrections_guild_id_week_id_idx" ON "corrections"("guild_id", "week_id");

-- CreateIndex
CREATE INDEX "corrections_guild_id_member_key_idx" ON "corrections"("guild_id", "member_key");

-- CreateIndex
CREATE UNIQUE INDEX "corrections_guild_id_week_id_member_key_metric_key" ON "corrections"("guild_id", "week_id", "member_key", "metric");

-- AddForeignKey
ALTER TABLE "guild_settings" ADD CONSTRAINT "guild_settings_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "guilds"("discord_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guild_personalities" ADD CONSTRAINT "guild_personalities_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "guilds"("discord_id") ON DELETE CASCADE ON UPDATE CASCADE;
