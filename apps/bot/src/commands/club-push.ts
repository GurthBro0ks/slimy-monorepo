/**
 * Club Push — Reads club_analyze_staging and writes to club_latest atomically.
 *
 * Command: /club-push [force:boolean] [dry_run:boolean]
 *
 * Behavior:
 *   1. Read staging rows for BOTH metrics (sim + total)
 *   2. Check both datasets exist (unless force=true)
 *   3. Verify member rosters match between metrics (unless force=true)
 *   4. If dry_run=true: print what would be written and exit
 *   5. Otherwise: write to club_latest in a single transaction
 *   6. On success: clear both metric staging rows
 *   7. Reply with ephemeral summary
 */

import {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
  ChatInputCommandInteraction,
} from 'discord.js';
import { database } from '../lib/database.js';

export function canonicalizeAmbiguous(name: string): string {
  const lower = name.toLowerCase();
  return lower
    .replace(/[i1]/g, 'l')
    .replace(/0/g, 'o');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('club-push')
    .setDescription('Push staged club scan data to the live database')
    .addBooleanOption((option) =>
      option
        .setName('force')
        .setDescription('Push even if one metric is missing or rosters differ')
        .setRequired(false),
    )
    .addBooleanOption((option) =>
      option
        .setName('dry_run')
        .setDescription('Preview what would be written without actually writing')
        .setRequired(false),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guildId = interaction.guildId;
    if (!guildId) {
      await interaction.editReply({ content: '❌ This command can only be used in a server.' });
      return;
    }

    const force = interaction.options.getBoolean('force') ?? false;
    const dryRun = interaction.options.getBoolean('dry_run') ?? false;

    try {
      const simRows = await loadStagingForMetric(guildId, 'sim');
      const totalRows = await loadStagingForMetric(guildId, 'total');

      if (simRows.length === 0 && totalRows.length === 0) {
        await interaction.editReply({
          content: '❌ Both SIM and TOTAL staging are empty. Run /club-analyze first.',
        });
        return;
      }

      if (!force) {
        if (simRows.length === 0) {
          await interaction.editReply({
            content: '❌ SIM staging is empty. Run /club-analyze metric:sim first, or use /club-push force:true to push TOTAL only.',
          });
          return;
        }
        if (totalRows.length === 0) {
          await interaction.editReply({
            content: '❌ TOTAL staging is empty. Run /club-analyze metric:total first, or use /club-push force:true to push SIM only.',
          });
          return;
        }
      }

      const simNames = new Set(simRows.map((r) => canonicalizeAmbiguous(r.member_name)));
      const totalNames = new Set(totalRows.map((r) => canonicalizeAmbiguous(r.member_name)));
      const allMemberNames = new Set([...simNames, ...totalNames]);

      if (!force && simRows.length > 0 && totalRows.length > 0) {
        const onlyInSim = [...simNames].filter((n) => !totalNames.has(n));
        const onlyInTotal = [...totalNames].filter((n) => !simNames.has(n));

        if (onlyInSim.length > 0 || onlyInTotal.length > 0) {
          const embed = new EmbedBuilder()
            .setTitle('Member Roster Mismatch')
            .setColor(0xff6b6b);

          if (onlyInSim.length > 0) {
            embed.addFields({
              name: `Only in SIM (${onlyInSim.length})`,
              value: onlyInSim.slice(0, 20).join(', ') + (onlyInSim.length > 20 ? '...' : ''),
              inline: false,
            });
          }
          if (onlyInTotal.length > 0) {
            embed.addFields({
              name: `Only in TOTAL (${onlyInTotal.length})`,
              value: onlyInTotal.slice(0, 20).join(', ') + (onlyInTotal.length > 20 ? '...' : ''),
              inline: false,
            });
          }

          embed.setFooter({ text: 'Use /club-push force:true to push anyway.' });

          await interaction.editReply({ embeds: [embed] });
          return;
        }
      }

      if (dryRun) {
        const rows: Array<{ name: string; sim_power: string | null; total_power: string | null }> = [];
        for (const name of allMemberNames) {
          const sim = simRows.find((r) => canonicalizeAmbiguous(r.member_name) === name);
          const total = totalRows.find((r) => canonicalizeAmbiguous(r.member_name) === name);
          rows.push({
            name: sim?.member_name ?? total?.member_name ?? name,
            sim_power: sim ? BigInt(sim.power_value).toLocaleString() : null,
            total_power: total ? BigInt(total.power_value).toLocaleString() : null,
          });
        }

        const embed = new EmbedBuilder()
          .setTitle(`Dry Run — ${rows.length} members would be written`)
          .setColor(0xfbbf24)
          .setDescription(
            rows
              .slice(0, 25)
              .map(
                (r) =>
                  `**${r.name}** — SIM: ${r.sim_power ?? '∅'} | TOTAL: ${r.total_power ?? '∅'}`,
              )
              .join('\n'),
          )
          .setFooter(rows.length > 25 ? { text: `...and ${rows.length - 25} more` } : null);

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      const pushedCount = await pushStagingToLatest(guildId, simRows, totalRows);

      await clearStagingForGuild(guildId);

      const metricsPushed: string[] = [];
      if (simRows.length > 0) metricsPushed.push('SIM');
      if (totalRows.length > 0) metricsPushed.push('TOTAL');

      await interaction.editReply({
        content: `✅ Pushed **${pushedCount}** members to club_latest. ${metricsPushed.join(' + ')} both updated. Staging cleared.`,
      });
    } catch (err) {
      console.error('[club-push] Failed:', err);
      await interaction.editReply({
        content: `❌ Push failed: ${(err as Error).message}`,
      });
    }
  },
};

interface StagingRow {
  member_name: string;
  power_value: string;
}

async function loadStagingForMetric(
  guildId: string,
  metric: 'sim' | 'total',
): Promise<StagingRow[]> {
  const rows = await database.query<StagingRow[]>(
    `SELECT member_name, power_value
     FROM club_analyze_staging
     WHERE guild_id = ? AND metric = ?
     ORDER BY member_name ASC`,
    [guildId, metric],
  );
  return rows;
}

async function pushStagingToLatest(
  guildId: string,
  simRows: StagingRow[],
  totalRows: StagingRow[],
): Promise<number> {
  const pool = database.getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const allNames = new Map<string, { sim_power: string | null; total_power: string | null; display_name: string }>();
    for (const r of simRows) {
      const key = canonicalizeAmbiguous(r.member_name);
      const existing = allNames.get(key);
      if (existing) {
        existing.sim_power = r.power_value;
      } else {
        allNames.set(key, { sim_power: r.power_value, total_power: null, display_name: r.member_name });
      }
    }
    for (const r of totalRows) {
      const key = canonicalizeAmbiguous(r.member_name);
      const existing = allNames.get(key);
      if (existing) {
        existing.total_power = r.power_value;
        if (!existing.display_name) existing.display_name = r.member_name;
      } else {
        allNames.set(key, { sim_power: null, total_power: r.power_value, display_name: r.member_name });
      }
    }

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    for (const [, entry] of allNames) {
      const [existing] = await connection.execute(
        'SELECT member_id FROM club_latest WHERE guild_id = ? AND name_display = ?',
        [guildId, entry.display_name],
      ) as [Array<{ member_id: number }>, unknown];

      if (existing.length > 0) {
        const updates: string[] = [];
        const values: (string | null)[] = [];

        if (entry.sim_power !== null) {
          updates.push('sim_power = ?');
          values.push(entry.sim_power);
          updates.push('sim_prev = sim_power');
        }
        if (entry.total_power !== null) {
          updates.push('total_power = ?');
          values.push(entry.total_power);
          updates.push('total_prev = total_power');
        }

        if (updates.length > 0) {
          updates.push('latest_at = ?');
          values.push(now);
          values.push(guildId);
          values.push(entry.display_name);

          await connection.execute(
            `UPDATE club_latest SET ${updates.join(', ')} WHERE guild_id = ? AND name_display = ?`,
            values,
          );
        }
      } else {
        const maxRow = await connection.execute(
          'SELECT COALESCE(MAX(member_id), 0) + 1 as next_id FROM club_latest WHERE guild_id = ?',
          [guildId],
        ) as [Array<{ next_id: number }>, unknown];

        const nextId = maxRow[0][0].next_id;

        await connection.execute(
          `INSERT INTO club_latest (guild_id, member_id, name_display, sim_power, total_power, latest_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [guildId, nextId, entry.display_name, entry.sim_power, entry.total_power, now],
        );
      }
    }

    await connection.commit();
    return allNames.size;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

async function clearStagingForGuild(guildId: string): Promise<void> {
  await database.execute(
    'DELETE FROM club_analyze_staging WHERE guild_id = ?',
    [guildId],
  );
}
