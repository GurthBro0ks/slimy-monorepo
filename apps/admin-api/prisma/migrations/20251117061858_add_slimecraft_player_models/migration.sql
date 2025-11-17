-- CreateTable
CREATE TABLE "slimecraft_players" (
    "id" SERIAL NOT NULL,
    "minecraft_name" TEXT NOT NULL,
    "discord_id" TEXT,
    "discord_tag" TEXT,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slimecraft_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slimecraft_player_stats" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "snapshot_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "play_time" INTEGER,
    "deaths" INTEGER,
    "mobs_killed" INTEGER,
    "blocks_broken" INTEGER,
    "blocks_placed" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slimecraft_player_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "slimecraft_players_minecraft_name_key" ON "slimecraft_players"("minecraft_name");

-- CreateIndex
CREATE INDEX "slimecraft_players_minecraft_name_idx" ON "slimecraft_players"("minecraft_name");

-- CreateIndex
CREATE INDEX "slimecraft_players_discord_id_idx" ON "slimecraft_players"("discord_id");

-- CreateIndex
CREATE INDEX "slimecraft_players_is_active_idx" ON "slimecraft_players"("is_active");

-- CreateIndex
CREATE INDEX "slimecraft_players_joined_at_idx" ON "slimecraft_players"("joined_at");

-- CreateIndex
CREATE INDEX "slimecraft_players_created_at_idx" ON "slimecraft_players"("created_at");

-- CreateIndex
CREATE INDEX "slimecraft_player_stats_player_id_idx" ON "slimecraft_player_stats"("player_id");

-- CreateIndex
CREATE INDEX "slimecraft_player_stats_snapshot_date_idx" ON "slimecraft_player_stats"("snapshot_date");

-- CreateIndex
CREATE INDEX "slimecraft_player_stats_player_id_snapshot_date_idx" ON "slimecraft_player_stats"("player_id", "snapshot_date");

-- CreateIndex
CREATE INDEX "slimecraft_player_stats_created_at_idx" ON "slimecraft_player_stats"("created_at");

-- AddForeignKey
ALTER TABLE "slimecraft_player_stats" ADD CONSTRAINT "slimecraft_player_stats_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "slimecraft_players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
