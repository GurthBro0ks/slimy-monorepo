/**
 * Club Admin — Club management panel (aliases, stats, corrections, settings).
 * Ported from /opt/slimy/app/commands/club-admin.js
 */

import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  AttachmentBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';
import { database } from '../lib/database.js';
import { trackCommand } from '../lib/metrics.js';
import { normalizeSheetInput } from '../lib/guild-settings.js';
import {
  getLatestForGuild,
  recomputeLatestForGuild,
  canonicalize,
} from '../lib/club-store.js';
import { addCorrection } from '../lib/club-corrections.js';
import { getWeekId } from '../lib/week-anchor.js';

function ensureDatabase(): void {
  if (!database.isConfigured()) {
    throw new Error("Database not configured for club admin.");
  }
}

function checkPermissions(member: unknown): boolean {
  if (!member) return false;
  const m = member as { permissions: { has: (flag: bigint) => boolean }; roles: { cache: { has: (id: string) => boolean } } };
  if (m.permissions?.has(PermissionFlagsBits.Administrator)) return true;
  const roleId = process.env.CLUB_ROLE_ID;
  if (roleId && m.roles?.cache?.has(roleId)) return true;
  return false;
}

function checkManagePermission(member: unknown): boolean {
  return checkPermissions(member);
}

async function handleAliases(interaction: ChatInputCommandInteraction): Promise<unknown> {
  ensureDatabase();

  const action = interaction.options.getString("action") || "view";

  if (action === "view") {
    interface AliasRow {
      alias_canonical: string;
      name_display: string;
      name_canonical: string;
      total_power: number | null;
      sim_power: number | null;
    }
    const aliases = await database.query<AliasRow[]>(
      `SELECT ca.alias_canonical, cm.name_display, cm.name_canonical, cl.total_power, cl.sim_power
       FROM club_aliases ca
       JOIN club_members cm ON cm.id = ca.member_id
       LEFT JOIN club_latest cl ON cl.member_id = ca.member_id AND cl.guild_id = ca.guild_id
       WHERE ca.guild_id = ?
       ORDER BY cm.name_display, ca.alias_canonical`,
      [interaction.guildId],
    );

    if (!aliases.length) {
      return interaction.reply({ content: "No aliases configured for this guild.", ephemeral: true });
    }

    const formatAlias = (alias: string) =>
      alias.split(" ").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");

    const embed = new EmbedBuilder()
      .setTitle("Club Member Aliases")
      .setColor(0x6366f1)
      .setDescription(`Found ${aliases.length} alias${aliases.length === 1 ? "" : "es"}`);

    const grouped = new Map<string, { display: string; aliases: string[]; totalPower: number | null; simPower: number | null }>();
    for (const alias of aliases) {
      const key = alias.name_canonical;
      if (!grouped.has(key)) {
        grouped.set(key, { display: alias.name_display, aliases: [], totalPower: alias.total_power, simPower: alias.sim_power });
      }
      grouped.get(key)!.aliases.push(alias.alias_canonical);
    }

    const entries = Array.from(grouped.entries()).sort((a, b) => a[1].display.localeCompare(b[1].display));
    const fields = entries.slice(0, 10).map(([canonical, data]) => {
      const metricParts: string[] = [];
      if (data.totalPower !== null && data.totalPower !== undefined) metricParts.push(`Total ${Number(data.totalPower).toLocaleString()}`);
      if (data.simPower !== null && data.simPower !== undefined) metricParts.push(`Sim ${Number(data.simPower).toLocaleString()}`);
      const aliasLines = data.aliases.slice(0, 10).map((alias) => `• ${formatAlias(alias)} (\`${alias}\`)`);
      if (data.aliases.length > aliasLines.length) aliasLines.push(`… +${data.aliases.length - aliasLines.length} more`);
      return {
        name: `${data.display} (${canonical}) — ${metricParts.join(" • ")}`,
        value: aliasLines.join("\n") || "`(no aliases recorded)`",
      };
    });

    for (const field of fields) embed.addFields(field);
    if (entries.length > fields.length) embed.setFooter({ text: `Showing ${fields.length} of ${entries.length} members with aliases` });

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  return interaction.reply({ content: "Only 'view' action is currently implemented.", ephemeral: true });
}

async function handleStats(interaction: ChatInputCommandInteraction): Promise<unknown> {
  ensureDatabase();

  const urlOption = interaction.options.getString("url");
  const clearOption = interaction.options.getBoolean("clear") || false;
  const hasManagePermission = checkManagePermission(interaction.member);

  if ((urlOption || clearOption) && !hasManagePermission) {
    return interaction.reply({ content: "Only administrators or the configured club role can update settings.", ephemeral: true });
  }

  if (clearOption) {
    await database.execute("DELETE FROM guild_settings WHERE guild_id = ? AND key_name IN ('club_sheet_url', 'club_sheet_id')", [interaction.guildId]);
    return interaction.reply({ content: "🧹 Cleared stored settings.", ephemeral: true });
  }

  if (urlOption) {
    const normalized = normalizeSheetInput(urlOption);
    await database.ensureGuildRecord(interaction.guildId!, interaction.guild?.name || null);
    await database.execute(
      `INSERT INTO guild_settings (guild_id, key_name, value) VALUES (?, 'club_sheet_url', ?)
       ON DUPLICATE KEY UPDATE value = VALUES(value)`,
      [interaction.guildId, normalized.url || ""],
    );
    if (normalized.sheetId) {
      await database.execute(
        `INSERT INTO guild_settings (guild_id, key_name, value) VALUES (?, 'club_sheet_id', ?)
         ON DUPLICATE KEY UPDATE value = VALUES(value)`,
        [interaction.guildId, normalized.sheetId],
      );
    }
    return interaction.reply({ content: "✅ Settings updated for this server.", ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: false });
  const latest = await getLatestForGuild(interaction.guildId!);

  if (!latest.length) {
    const embed = new EmbedBuilder()
      .setTitle("📊 Club Stats")
      .setColor(0x6366f1)
      .setDescription("No club data available yet.\n\nRun `/club-analyze` with Manage Members screenshots to generate your first snapshot.")
      .setFooter({ text: "Run /club-analyze to get started" });
    return interaction.editReply({ embeds: [embed] });
  }

  const totalMembers = latest.length;
  const byTotal = [...latest].filter((r) => r.total_power != null).sort((a, b) => Number(b.total_power) - Number(a.total_power)).slice(0, 5);
  const bySim = [...latest].filter((r) => r.sim_power != null).sort((a, b) => Number(b.sim_power) - Number(a.sim_power)).slice(0, 5);
  const latestAt = latest.map((r) => r.latest_at).filter(Boolean).sort().at(-1);
  const lastUpdated = latestAt ? new Date(latestAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Unknown";
  const fmt = (n: number | null) => n == null ? "—" : Number(n).toLocaleString("en-US");

  const embed = new EmbedBuilder()
    .setTitle("📊 Club Stats")
    .setColor(0x3b82f6)
    .addFields(
      { name: "Total Members", value: String(totalMembers), inline: true },
      { name: "Last Updated", value: lastUpdated, inline: true },
      {
        name: "Top 5 by Total Power",
        value: byTotal.length ? byTotal.map((r, i) => `${i + 1}. **${r.name_display}** — ${fmt(r.total_power)}`).join("\n") : "—",
        inline: false,
      },
      {
        name: "Top 5 by SIM Power",
        value: bySim.length ? bySim.map((r, i) => `${i + 1}. **${r.name_display}** — ${fmt(r.sim_power)}`).join("\n") : "—",
        inline: false,
      },
    )
    .setFooter({ text: "Run /club-analyze to update" });

  return interaction.editReply({ embeds: [embed] });
}

async function handleRollback(interaction: ChatInputCommandInteraction): Promise<unknown> {
  ensureDatabase();
  await interaction.deferReply({ ephemeral: true });

  interface SnapshotRow { id: number; snapshot_at: Date; }
  const [lastSnapshot] = await database.query<SnapshotRow[]>(
    `SELECT s.id, s.snapshot_at FROM club_snapshots s WHERE s.guild_id = ? ORDER BY s.snapshot_at DESC LIMIT 1`,
    [interaction.guildId],
  );

  if (!lastSnapshot) return interaction.editReply({ content: "❌ No snapshots found to rollback." });

  const [prevSnapshot] = await database.query<SnapshotRow[]>(
    `SELECT s.id, s.snapshot_at FROM club_snapshots s WHERE s.guild_id = ? AND s.snapshot_at < ? ORDER BY s.snapshot_at DESC LIMIT 1`,
    [interaction.guildId, lastSnapshot.snapshot_at],
  );

  if (!prevSnapshot) return interaction.editReply({ content: "❌ Cannot rollback: only one snapshot exists." });

  await database.execute(`DELETE FROM club_snapshots WHERE id = ?`, [lastSnapshot.id]);
  await recomputeLatestForGuild(interaction.guildId!, prevSnapshot.snapshot_at);

  const embed = new EmbedBuilder()
    .setTitle("✅ Rollback Successful")
    .setColor(0x22c55e)
    .setDescription(`Deleted snapshot #${lastSnapshot.id}\nRestored state from snapshot #${prevSnapshot.id}`)
    .setTimestamp();

  return interaction.editReply({ embeds: [embed] });
}

async function handleExport(interaction: ChatInputCommandInteraction): Promise<unknown> {
  ensureDatabase();
  await interaction.deferReply({ ephemeral: true });

  const latest = await getLatestForGuild(interaction.guildId!);
  if (!latest.length) return interaction.editReply({ content: "❌ No data to export." });

  const header = "Name,Canonical,SimPower,TotalPower,SimPrev,TotalPrev,SimChange%,TotalChange%";
  const rows = latest.map((row) => [
    `"${row.name_display.replace(/"/g, '""')}"`,
    `"${row.name_canonical.replace(/"/g, '""')}"`,
    row.sim_power ?? "",
    row.total_power ?? "",
    row.sim_prev ?? "",
    row.total_prev ?? "",
    row.sim_pct_change ?? "",
    row.total_pct_change ?? "",
  ].join(","));

  const csv = [header, ...rows].join("\n");
  const attachment = new AttachmentBuilder(Buffer.from(csv, "utf8"), {
    name: `club-data-${interaction.guildId}-${Date.now()}.csv`,
  });

  return interaction.editReply({ content: `Exported ${latest.length} member(s) to CSV.`, files: [attachment] });
}

async function handleCorrect(interaction: ChatInputCommandInteraction): Promise<unknown> {
  ensureDatabase();

  const memberInput = interaction.options.getString("member") || "";
  const metric = interaction.options.getString("metric") || "total";
  const valueInput = interaction.options.getString("value") || "";
  const weekInput = interaction.options.getString("week") || "auto";
  const reason = interaction.options.getString("reason");

  await interaction.deferReply({ ephemeral: true });

  const weekId = weekInput === "auto" ? getWeekId() : weekInput;
  const mentionMatch = memberInput.match(/^<@!?(\d+)>$/);
  let memberKey: string;
  let displayName: string = memberInput;

  if (mentionMatch) {
    try {
      const user = await interaction.client.users.fetch(mentionMatch[1]);
      displayName = user.username;
      memberKey = canonicalize(displayName);
    } catch {
      memberKey = canonicalize(memberInput);
    }
  } else {
    memberKey = canonicalize(memberInput);
    displayName = memberInput;
  }

  if (!memberKey) return interaction.editReply({ content: `❌ Could not normalize member name: ${memberInput}` });

  try {
    const result = await addCorrection({
      guildId: interaction.guildId!,
      weekId,
      memberKey,
      displayName,
      metric: metric as 'total' | 'sim',
      value: valueInput,
      reason: reason || undefined,
      source: 'command',
      createdBy: interaction.user.id,
    });

    const embed = new EmbedBuilder()
      .setTitle("✅ Correction Added")
      .setColor(0x22c55e)
      .addFields(
        { name: "Member", value: displayName, inline: true },
        { name: "Metric", value: metric, inline: true },
        { name: "Week", value: weekId, inline: true },
        { name: "Value", value: result.replaced ? `${valueInput} (updated)` : valueInput },
      );

    return interaction.editReply({ embeds: [embed] });
  } catch (err) {
    return interaction.editReply({ content: `❌ Failed to add correction: ${(err as Error).message}` });
  }
}

export default {
  data: new SlashCommandBuilder()
    .setName("club-admin")
    .setDescription("Club admin panel — aliases, stats, corrections, and settings")
    .addSubcommand((sub) =>
      sub
        .setName("aliases")
        .setDescription("View club member aliases")
        .addStringOption((opt) =>
          opt.setName("action").setDescription("Action").setRequired(false)
            .addChoices({ name: "View", value: "view" }),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("stats")
        .setDescription("Show club stats summary")
        .addStringOption((opt) => opt.setName("url").setDescription("Google Sheets URL").setRequired(false))
        .addBooleanOption((opt) => opt.setName("clear").setDescription("Clear settings").setRequired(false)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("correct")
        .setDescription("Add a manual power correction")
        .addStringOption((opt) => opt.setName("member").setDescription("Member name or @mention").setRequired(true))
        .addStringOption((opt) =>
          opt.setName("metric").setDescription("Metric").setRequired(true)
            .addChoices({ name: "Total Power", value: "total" }, { name: "Sim Power", value: "sim" }),
        )
        .addStringOption((opt) => opt.setName("value").setDescription("Power value (e.g. 1.5M)").setRequired(true))
        .addStringOption((opt) => opt.setName("week").setDescription("Week ID (auto for current)").setRequired(false))
        .addStringOption((opt) => opt.setName("reason").setDescription("Reason for correction").setRequired(false)),
    )
    .addSubcommand((sub) =>
      sub.setName("rollback").setDescription("Rollback to previous snapshot"),
    )
    .addSubcommand((sub) =>
      sub.setName("export").setDescription("Export club data to CSV"),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const startTime = Date.now();
    try {
      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
        case "aliases":
          trackCommand("club-admin-aliases", Date.now() - startTime, true);
          return handleAliases(interaction);
        case "stats":
          trackCommand("club-admin-stats", Date.now() - startTime, true);
          return handleStats(interaction);
        case "correct":
          trackCommand("club-admin-correct", Date.now() - startTime, true);
          return handleCorrect(interaction);
        case "rollback":
          trackCommand("club-admin-rollback", Date.now() - startTime, true);
          return handleRollback(interaction);
        case "export":
          trackCommand("club-admin-export", Date.now() - startTime, true);
          return handleExport(interaction);
        default:
          return interaction.reply({ content: "❌ Unknown subcommand.", ephemeral: true });
      }
    } catch (err) {
      const error = err as Error;
      console.error("[club-admin] Failed", { error: error.message });
      trackCommand("club-admin", Date.now() - startTime, false);
      return interaction.reply({ content: `❌ ${error.message}`, ephemeral: true });
    }
  },
};
