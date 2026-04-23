import {
  SlashCommandBuilder,
  AttachmentBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
} from 'discord.js';
import { database } from '../lib/database.js';
import { trackCommand } from '../lib/metrics.js';

function checkPermission(member: unknown): boolean {
  if (!member) return false;
  const m = member as { permissions: { has: (flag: bigint) => boolean }; roles: { cache: { has: (id: string) => boolean } } };
  if (m.permissions?.has(PermissionFlagsBits.Administrator)) return true;
  if (m.permissions?.has(PermissionFlagsBits.ManageGuild)) return true;
  const roleId = process.env.CLUB_ROLE_ID;
  if (roleId && m.roles?.cache?.has(roleId)) return true;
  return false;
}

interface ClubLatestRow {
  name_display: string;
  sim_power: number | null;
  total_power: number | null;
  sim_prev: number | null;
  total_prev: number | null;
  sim_pct_change: number | null;
  total_pct_change: number | null;
  latest_at: string;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('club-export')
    .setDescription('Export club roster as a CSV file attachment'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guildId) {
      await interaction.reply({ content: '❌ This command can only be used in a server.', ephemeral: true });
      return;
    }

    if (!checkPermission(interaction.member)) {
      await interaction.reply({ content: '❌ You need Administrator or Manage Server permission to use this command.', ephemeral: true });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const rows = await database.query<ClubLatestRow[]>(
        `SELECT name_display, sim_power, total_power, sim_prev, total_prev,
                sim_pct_change, total_pct_change, latest_at
         FROM club_latest
         WHERE guild_id = ?
         ORDER BY total_power IS NULL ASC, total_power DESC, name_display ASC`,
        [interaction.guildId],
      );

      if (!rows.length) {
        await interaction.editReply({ content: '❌ No club data to export. Run /club-analyze and /club-push first.' });
        return;
      }

      const header = 'Name,SimPower,TotalPower,SimPrev,TotalPrev,SimChange%,TotalChange%';
      const csvRows = rows.map((r) => [
        `"${r.name_display.replace(/"/g, '""')}"`,
        r.sim_power ?? '',
        r.total_power ?? '',
        r.sim_prev ?? '',
        r.total_prev ?? '',
        r.sim_pct_change ?? '',
        r.total_pct_change ?? '',
      ].join(','));

      const csv = [header, ...csvRows].join('\n');
      const timestamp = new Date().toISOString().split('T')[0];
      const attachment = new AttachmentBuilder(Buffer.from(csv, 'utf8'), {
        name: `club-export-${timestamp}.csv`,
      });

      trackCommand('club-export', Date.now() - Date.now(), true);
      await interaction.editReply({
        content: `Club roster exported — **${rows.length} members**`,
        files: [attachment],
      });
    } catch (err) {
      console.error('[club-export] Failed:', err);
      trackCommand('club-export', 0, false);
      await interaction.editReply({ content: `❌ Export failed: ${(err as Error).message}` });
    }
  },
};
