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
  AttachmentBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';
import { database } from '../lib/database.js';
import { canonicalize } from '../lib/club-store.js';
import { requireAdminRole } from '../utils/admin-role.js';

export function canonicalizeAmbiguous(name: string): string {
  const lower = name.toLowerCase();
  return lower
    .replace(/[i1]/g, 'l')
    .replace(/0/g, 'o');
}

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i - 1][j - 1], dp[i][j - 1]);
      }
    }
  }
  return dp[m][n];
}

function fuzzyMatchSets(
  simNames: Set<string>,
  totalNames: Set<string>,
): { onlyInSim: string[]; onlyInTotal: string[] } {
  const matchedSim = new Set<string>();
  const matchedTotal = new Set<string>();

  for (const s of simNames) {
    for (const t of totalNames) {
      if (s === t || levenshteinDistance(s, t) <= 1) {
        matchedSim.add(s);
        matchedTotal.add(t);
        break;
      }
    }
  }

  return {
    onlyInSim: [...simNames].filter((n) => !matchedSim.has(n)),
    onlyInTotal: [...totalNames].filter((n) => !matchedTotal.has(n)),
  };
}

function findFuzzyKey(
  map: Map<string, unknown>,
  key: string,
): string | null {
  if (map.has(key)) return key;
  for (const existingKey of map.keys()) {
    if (levenshteinDistance(key, existingKey) <= 1) return existingKey;
  }
  return null;
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
    if (!(await requireAdminRole(interaction, '/club-push'))) return;

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
        const { onlyInSim, onlyInTotal } = fuzzyMatchSets(simNames, totalNames);

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

      const { pushedCount, removedCount } = await pushStagingToLatest(guildId, simRows, totalRows);

      await clearStagingForGuild(guildId);

      const metricsPushed: string[] = [];
      if (simRows.length > 0) metricsPushed.push('SIM');
      if (totalRows.length > 0) metricsPushed.push('TOTAL');

      const removedMsg = removedCount > 0 ? ` Removed **${removedCount}** former member${removedCount !== 1 ? 's' : ''}.` : '';
      await interaction.editReply({
        content: `✅ Pushed **${pushedCount}** members to club_latest.${removedMsg} ${metricsPushed.join(' + ')} updated. Staging cleared.`,
      });

      try {
        const XLSX = await import('xlsx');
        const rows = await database.query<Array<{
          name_display: string;
          sim_power: number | null;
          total_power: number | null;
          sim_prev: number | null;
          total_prev: number | null;
          latest_at: string;
        }>>(
          `SELECT name_display, sim_power, total_power, sim_prev, total_prev, latest_at
           FROM club_latest WHERE guild_id = ?
           ORDER BY sim_power IS NULL, sim_power DESC`,
          [guildId],
        );

        const worksheetData = rows.map((m, i) => ({
          'Rank': i + 1,
          'Name': m.name_display,
          'SIM Power': m.sim_power != null ? Number(m.sim_power) : '',
          'Total Power': m.total_power != null ? Number(m.total_power) : '',
          'Previous SIM': m.sim_prev != null ? Number(m.sim_prev) : '',
          'WoW Change': m.sim_prev != null && m.sim_power != null ? Number(m.sim_power) - Number(m.sim_prev) : '',
          'Last Seen': m.latest_at,
        }));

        if (worksheetData.length > 0) {
          const wb = XLSX.utils.book_new();
          const ws = XLSX.utils.json_to_sheet(worksheetData);

          const colWidths = Object.keys(worksheetData[0]).map((key) => ({
            wch: Math.max(
              key.length,
              ...worksheetData.map((r) => String(r[key as keyof typeof r]).length),
            ) + 2,
          }));
          ws['!cols'] = colWidths;

          XLSX.utils.book_append_sheet(wb, ws, 'Club Roster');
          const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

          const timestamp = new Date().toISOString().split('T')[0];
          const filename = `club-roster-${timestamp}.xlsx`;
          const attachment = new AttachmentBuilder(Buffer.from(buffer), { name: filename });

          await interaction.followUp({
            content: `Club roster exported (${worksheetData.length} members)`,
            files: [attachment],
          });
        }
      } catch (xlsxErr) {
        console.error('[club-push] XLSX export failed (push succeeded):', xlsxErr);
      }
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
): Promise<{ pushedCount: number; removedCount: number }> {
  const pool = database.getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [aliasRows] = await connection.execute(
      `SELECT ca.alias_canonical, cm.name_display AS canonical_display
       FROM club_aliases ca
       JOIN club_members cm ON cm.id = ca.member_id
       WHERE ca.guild_id = ?`,
      [guildId],
    ) as [Array<{ alias_canonical: string; canonical_display: string }>, unknown];

    const aliasMap = new Map<string, string>();
    for (const row of aliasRows) {
      aliasMap.set(row.alias_canonical, row.canonical_display);
    }

    const allNames = new Map<string, { sim_power: string | null; total_power: string | null; display_name: string }>();
    for (const r of simRows) {
      const key = canonicalizeAmbiguous(r.member_name);
      const fuzzyKey = findFuzzyKey(allNames, key);
      if (fuzzyKey) {
        allNames.get(fuzzyKey)!.sim_power = r.power_value;
      } else {
        allNames.set(key, { sim_power: r.power_value, total_power: null, display_name: r.member_name });
      }
    }
    for (const r of totalRows) {
      const key = canonicalizeAmbiguous(r.member_name);
      const fuzzyKey = findFuzzyKey(allNames, key);
      const existing = fuzzyKey ? allNames.get(fuzzyKey)! : null;
      if (existing) {
        existing.total_power = r.power_value;
        if (!existing.display_name) existing.display_name = r.member_name;
      } else {
        allNames.set(key, { sim_power: null, total_power: r.power_value, display_name: r.member_name });
      }
    }

    const pushedDisplayNames: string[] = [];
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    for (const [, entry] of allNames) {
      const canonicalName = canonicalize(entry.display_name);
      if (aliasMap.has(canonicalName)) {
        const resolvedName = aliasMap.get(canonicalName)!;
        console.log(`[club-push] Alias resolved: "${entry.display_name}" → "${resolvedName}"`);
        entry.display_name = resolvedName;
      }

      pushedDisplayNames.push(entry.display_name);

      const [existing] = await connection.execute(
        'SELECT member_id FROM club_latest WHERE guild_id = ? AND name_display = ?',
        [guildId, entry.display_name],
      ) as [Array<{ member_id: number }>, unknown];

      if (existing.length > 0) {
        const updates: string[] = [];
        const values: (string | null)[] = [];

        if (entry.sim_power !== null) {
          updates.push('sim_prev = sim_power');
          updates.push('sim_power = ?');
          values.push(entry.sim_power);
        }
        if (entry.total_power !== null) {
          updates.push('total_prev = total_power');
          updates.push('total_power = ?');
          values.push(entry.total_power);
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

    let removedCount = 0;
    if (pushedDisplayNames.length > 0) {
      const placeholders = pushedDisplayNames.map(() => '?').join(',');
      const [result] = await connection.execute(
        `DELETE FROM club_latest WHERE guild_id = ? AND name_display NOT IN (${placeholders})`,
        [guildId, ...pushedDisplayNames],
      ) as [import('mysql2').ResultSetHeader, unknown];
      removedCount = result.affectedRows;
    }

    if (removedCount > 0) {
      console.log(`[club-push] Removed ${removedCount} stale member(s) from guild ${guildId}`);
    }

    await connection.commit();
    return { pushedCount: allNames.size, removedCount };
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
