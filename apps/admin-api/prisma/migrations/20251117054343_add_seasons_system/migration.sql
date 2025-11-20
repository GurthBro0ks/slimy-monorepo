-- CreateTable
CREATE TABLE "seasons" (
    "id" SERIAL NOT NULL,
    "guild_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "season_member_stats" (
    "id" SERIAL NOT NULL,
    "season_id" INTEGER NOT NULL,
    "member_key" TEXT NOT NULL,
    "total_power_gain" BIGINT NOT NULL DEFAULT 0,
    "best_tier" TEXT,
    "participation_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "season_member_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "seasons_guild_id_idx" ON "seasons"("guild_id");

-- CreateIndex
CREATE INDEX "seasons_is_active_idx" ON "seasons"("is_active");

-- CreateIndex
CREATE INDEX "seasons_start_date_idx" ON "seasons"("start_date");

-- CreateIndex
CREATE INDEX "seasons_end_date_idx" ON "seasons"("end_date");

-- CreateIndex
CREATE INDEX "seasons_guild_id_is_active_idx" ON "seasons"("guild_id", "is_active");

-- CreateIndex
CREATE INDEX "seasons_guild_id_start_date_idx" ON "seasons"("guild_id", "start_date");

-- CreateIndex
CREATE INDEX "season_member_stats_season_id_idx" ON "season_member_stats"("season_id");

-- CreateIndex
CREATE INDEX "season_member_stats_member_key_idx" ON "season_member_stats"("member_key");

-- CreateIndex
CREATE INDEX "season_member_stats_season_id_member_key_idx" ON "season_member_stats"("season_id", "member_key");

-- CreateIndex
CREATE INDEX "season_member_stats_season_id_total_power_gain_idx" ON "season_member_stats"("season_id", "total_power_gain");

-- CreateIndex
CREATE UNIQUE INDEX "season_member_stats_season_id_member_key_key" ON "season_member_stats"("season_id", "member_key");

-- AddForeignKey
ALTER TABLE "season_member_stats" ADD CONSTRAINT "season_member_stats_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
