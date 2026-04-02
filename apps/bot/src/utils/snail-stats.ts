/**
 * Snail stats helper — shared logic for snail stats display.
 * Ported from /opt/slimy/app/commands/helpers/snail-stats.js
 */

import { EmbedBuilder } from "discord.js";
import { database } from "../lib/database.js";
import { metrics } from "../lib/metrics.js";

interface RequiredType {
  type: string;
  label: string;
  why: string;
}

const REQUIRED_TYPES: RequiredType[] = [
  { type: "STATS_MAIN", label: "Stats Main", why: "Core stats (HP, ATK, DEF, etc.)" },
  { type: "LOADOUT_GEAR", label: "Loadout/Gear", why: "Equipped gear and loadout" },
  { type: "COMPASS_RELICS", label: "Compass/Relics", why: "Relics and compass data" },
];

const TYPE_LABELS: Record<string, string> = {
  STATS_MAIN: "Stats Main",
  LOADOUT_GEAR: "Loadout/Gear",
  COMPASS_RELICS: "Compass/Relics",
};

const WHY_NEEDED: Record<string, string> = {
  STATS_MAIN: "Core stats (HP, ATK, DEF, etc.)",
  LOADOUT_GEAR: "Equipped gear and loadout",
  COMPASS_RELICS: "Relics and compass data",
};

const FOOTER = "Use /snail analyze to capture screenshots → /snail stats to save";

function formatStatsBlock(stats: Record<string, unknown> | null): string {
  if (!stats) return "No stats available";
  return [
    `HP: ${stats.hp ?? "?"} | ATK: ${stats.atk ?? "?"} | DEF: ${stats.def ?? "?"}`,
    `Rush: ${stats.rush ?? "?"} | Fame: ${stats.fame ?? "?"}`,
  ].join("\n");
}

async function findActiveSnapshot(
  userId: string,
  guildId: string | null,
): Promise<number | null> {
  if (!database.isConfigured()) return null;
  try {
    const pool = database.getPool();
    const [rows] = await pool.query(
      `SELECT id FROM snapshot_parts WHERE user_id = ? AND guild_id <=> ? AND finalized = 0 ORDER BY created_at DESC LIMIT 1`,
      [userId, guildId || null],
    );
    const rowsArr = rows as Array<{ id: number }>;
    return rowsArr?.[0]?.id ?? null;
  } catch {
    return null;
  }
}

async function getSnapshotParts(
  snapshotId: number,
): Promise<Array<{ part_type: string; fields: Record<string, unknown>; image_url?: string }>> {
  if (!database.isConfigured()) return [];
  try {
    const pool = database.getPool();
    const [rows] = await pool.query(
      `SELECT part_type, fields_json, image_url FROM snapshot_parts WHERE snapshot_id = ?`,
      [snapshotId],
    );
    const rowsArr = rows as Array<{ part_type: string; fields_json?: string; image_url?: string }>;
    return (rowsArr || []).map((row) => ({
      part_type: row.part_type,
      fields: row.fields_json ? JSON.parse(row.fields_json) : {},
      image_url: row.image_url,
    }));
  } catch {
    return [];
  }
}

async function finalizeSnapshot(snapshotId: number): Promise<void> {
  if (!database.isConfigured()) return;
  try {
    const pool = database.getPool();
    await pool.query(
      `UPDATE snapshot_parts SET finalized = 1 WHERE snapshot_id = ?`,
      [snapshotId],
    );
  } catch {
    // ignore
  }
}

async function runSnailStats(interaction: {
  deferReply: (opts: { ephemeral: boolean }) => Promise<void>;
  editReply: (opts: { embeds?: EmbedBuilder[]; content?: string }) => Promise<void>;
  user: { id: string; username: string };
  guildId: string | null;
  guild: { name: string } | null;
}): Promise<void> {
  const startTime = Date.now();
  await interaction.deferReply({ ephemeral: true });

  const userId = interaction.user.id;
  const guildId = interaction.guildId || null;
  const username = interaction.user.username;
  const guildName = interaction.guild?.name || "Unknown";

  try {
    const snapshotId = await findActiveSnapshot(userId, guildId);

    if (snapshotId) {
      const parts = await getSnapshotParts(snapshotId);

      if (!parts.length) {
        metrics.trackCommand("snail-stats", Date.now() - startTime, false);
        await interaction.editReply({
          content:
            "📸 No saved screenshot data yet. Use `/snail analyze` to capture each required screen.",
        });
        return;
      }

      const capturedTypes = new Set(parts.map((p) => p.part_type));
      const missingTypes = REQUIRED_TYPES.filter(
        (t) => !capturedTypes.has(t.type),
      );

      if (missingTypes.length) {
        const lines = [
          `Progress: ${capturedTypes.size}/${REQUIRED_TYPES.length} screenshots saved.`,
          "",
          "Still needed:",
          ...missingTypes.map(
            (type) => `• **${TYPE_LABELS[type.type]}** — ${WHY_NEEDED[type.type]}`,
          ),
          "",
          "Upload the missing screenshots with `/snail analyze`, then click **Save Screenshot Data** on each preview.",
        ];

        metrics.trackCommand("snail-stats", Date.now() - startTime, true);
        await interaction.editReply({ content: lines.join("\n") });
        return;
      }

      const statsPart = parts.find((p) => p.part_type === "STATS_MAIN");
      const radar = (statsPart?.fields?.radar || null) as Record<string, unknown> | null;

      const summaryLines = [
        formatStatsBlock(null),
        "",
        FOOTER,
      ];

      const analysisText = summaryLines.join("\n");

      const snailStatId = await database.saveSnailStat({
        userId,
        guildId: guildId ?? undefined,
        username,
        guildName,
        screenshotUrl: statsPart?.image_url || undefined,
        stats: {
          fame: radar?.FAME as number | undefined,
          tech: radar?.TECH as number | undefined,
          art: radar?.ART as number | undefined,
          civ: radar?.CIV as number | undefined,
          fth: radar?.FTH as number | undefined,
        },
        analysisText,
        savedToSheet: false,
      });

      await finalizeSnapshot(snapshotId);

      const lines = [
        analysisText,
        "",
        `📦 Saved entry #${snailStatId}. Use \`/snail sheet\` to review history.`,
      ];

      metrics.trackCommand("snail-stats", Date.now() - startTime, true);
      await interaction.editReply({ content: lines.join("\n") });
      return;
    }

    const recent = await database.getRecentSnailStats(userId, guildId, 1);
    if (recent && recent.length > 0) {
      const latest = recent[0] as Record<string, unknown>;
      const timestamp = latest.createdAt
        ? new Date(latest.createdAt as string).toISOString()
        : "unknown time";
      const lines = [
        `📊 Last saved Super Snail stats (recorded ${timestamp})`,
        "",
        (latest.analysisText as string) || formatStatsBlock(latest.stats as Record<string, unknown>),
        "",
        FOOTER,
      ];

      const embed = new EmbedBuilder()
        .setColor(0x00ae86)
        .setTitle("🐌 Latest Stored Analysis")
        .setDescription(lines.join("\n").slice(0, 4000));

      metrics.trackCommand("snail-stats", Date.now() - startTime, true);
      await interaction.editReply({
        content: lines.join("\n"),
        embeds: [embed],
      });
      return;
    }

    metrics.trackCommand("snail-stats", Date.now() - startTime, false);
    await interaction.editReply({
      content:
        "📊 No saved stats found yet. Use `/snail analyze` followed by `/snail stats` after capturing all required screenshots.",
    });
  } catch (err) {
    metrics.trackCommand("snail-stats", Date.now() - startTime, false);
    metrics.trackError("snail_stats", (err as Error).message);
    console.error("[snail] stats error:", err);
    await interaction.editReply({
      content: `❌ Failed to build stats: ${(err as Error).message}`,
    });
  }
}

export { runSnailStats };
