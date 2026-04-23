import {
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
} from 'discord.js';
import { getAlertStatus, runAlertCheck } from '../utils/club-alerts.js';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('club-alerts')
    .setDescription('Club member change alerts (owner/admin only)')
    .addSubcommand((sub) =>
      sub.setName('status').setDescription('Show alert system status'),
    )
    .addSubcommand((sub) =>
      sub.setName('check').setDescription('Force an immediate alert check'),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guildId) {
      await interaction.reply({ content: '❌ This command can only be used in a server.', flags: MessageFlags.Ephemeral });
      return;
    }

    const ownerId = process.env.BOT_OWNER_ID;
    if (ownerId && interaction.user.id !== ownerId) {
      await interaction.reply({ content: '❌ Owner only.', flags: MessageFlags.Ephemeral });
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'status') {
      const status = getAlertStatus();
      const embed = new EmbedBuilder()
        .setTitle('Club Alerts Status')
        .setColor(status.running ? 0x57f287 : 0xed4245)
        .addFields(
          { name: 'Running', value: status.running ? 'Yes' : 'No', inline: true },
          { name: 'Alert Channel', value: process.env.CLUB_ALERT_CHANNEL_ID ? `<#${process.env.CLUB_ALERT_CHANNEL_ID}>` : 'Not configured', inline: true },
          { name: 'Tracked Members', value: String(status.memberCount), inline: true },
          { name: 'Last Check', value: status.lastCheck ? `<t:${Math.floor(status.lastCheck.getTime() / 1000)}:R>` : 'Never', inline: true },
        );

      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      return;
    }

    if (subcommand === 'check') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const channelId = process.env.CLUB_ALERT_CHANNEL_ID;
      if (!channelId) {
        await interaction.editReply('❌ CLUB_ALERT_CHANNEL_ID is not configured. Set it in .env and restart the bot.');
        return;
      }

      try {
        const result = await runAlertCheck(interaction.guildId, channelId, true);
        await interaction.editReply(
          result.posted
            ? `✅ Alert posted to <#${channelId}> — ${result.changes} change(s) detected.`
            : result.changes === 0
              ? 'No changes detected since last check.'
              : `${result.changes} change(s) detected but alert was not posted (check channel permissions).`,
        );
      } catch (err) {
        await interaction.editReply(`❌ Check failed: ${(err as Error).message}`);
      }
    }
  },
};
