-- AlterTable
ALTER TABLE "guilds" ADD COLUMN "icon_url" TEXT,
ADD COLUMN "owner_id" TEXT;

-- CreateIndex
CREATE INDEX "guilds_owner_id_idx" ON "guilds"("owner_id");
