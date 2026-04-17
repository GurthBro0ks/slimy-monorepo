/**
 * Club Analyze — Context Menu Command ("Analyze Club Roster")
 *
 * Message context menu command that reads all image attachments from a
 * single message. Mobile-friendly alternative to the slash command's
 * per-slot attachment picker.
 *
 * Discord's mobile UI opens the file picker ONCE PER SLOT for slash command
 * attachment options, making 10-screenshot batches painful. The context menu
 * workaround: user sends one message with up to 10 images attached, then
 * long-presses that message → Apps → "Analyze Club Roster".
 *
 * Flow:
 *   1. User sends a message with 1-10 screenshots
 *   2. Long-press message → Apps → "Analyze Club Roster"
 *   3. Bot shows ephemeral metric selection buttons (Sim Power / Total Power)
 *   4. User selects metric → OCR runs → paginated edit UI follows up
 *   5. Pagination buttons use "club-analyze:" prefix → routed to slash command handler
 *
 * Button routing:
 *   Metric buttons:   "Analyze Club Roster:metric:${metric}:${pendingId}"
 *     → routed to this command's handleButton (via command name lookup)
 *   Pagination buttons: "club-analyze:prev/next/edit/save/cancel:${sessionId}"
 *     → routed to club-analyze command's handleButton
 */

import {
  ContextMenuCommandBuilder,
  ApplicationCommandType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  MessageContextMenuCommandInteraction,
  ButtonInteraction,
} from 'discord.js';
import { v4 as uuidv4 } from 'uuid';
import {
  cleanExpiredSessions,
  storePendingContext,
  getPendingContextSession,
  deletePendingContextSession,
  runClubAnalyze,
  getSession,
  buildPageEmbed,
  buildNavigationRow,
  CONTEXT_BUTTON_PREFIX,
} from '../services/club-analyze-flow.js';

module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName('Analyze Club Roster')
    .setType(ApplicationCommandType.Message),

  // ─── Execute ──────────────────────────────────────────────────────────────

  async execute(interaction: MessageContextMenuCommandInteraction): Promise<void> {
    await interaction.deferReply();
    cleanExpiredSessions();

    const targetMessage = interaction.targetMessage;

    // Collect image attachments from the target message
    const imageAttachments = [...targetMessage.attachments.values()].filter((a) => {
      const ct = a.contentType || '';
      return ct.startsWith('image/') || ct === '';
    });

    if (imageAttachments.length === 0) {
      await interaction.editReply({
        content: '❌ No image attachments found on that message. Attach 1-10 screenshots and try again.',
      });
      return;
    }

    if (imageAttachments.length > 10) {
      await interaction.editReply({
        content: `❌ Too many attachments (${imageAttachments.length}). Maximum 10 images.`,
      });
      return;
    }

    // Store pending context session for metric button handler
    const pendingId = uuidv4();
    storePendingContext({
      id: pendingId,
      guildId: interaction.guildId ?? 'dm',
      userId: interaction.user.id,
      username: interaction.user.username,
      attachments: imageAttachments.map((a) => ({ url: a.url, name: a.name })),
      createdAt: Date.now(),
    });

    // Show metric selection buttons
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`${CONTEXT_BUTTON_PREFIX}:metric:sim:${pendingId}`)
        .setLabel('⚡ Sim Power')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`${CONTEXT_BUTTON_PREFIX}:metric:total:${pendingId}`)
        .setLabel('💪 Total Power')
        .setStyle(ButtonStyle.Primary),
    );

    await interaction.editReply({
      content: `Found **${imageAttachments.length}** screenshot${imageAttachments.length === 1 ? '' : 's'}. Which metric are these showing?`,
      components: [row],
    });
  },

  // ─── Button Handler ───────────────────────────────────────────────────────
  //
  // Handles metric selection buttons: "Analyze Club Roster:metric:sim:${pendingId}"
  // Pagination buttons use "club-analyze:" prefix and are handled by the slash command.
  //

  async handleButton(interaction: ButtonInteraction): Promise<boolean> {
    const parts = String(interaction.customId || '').split(':');
    if (parts[0] !== CONTEXT_BUTTON_PREFIX || parts.length < 4) return false;

    const [, action] = parts;
    if (action !== 'metric') return false;

    const metric = parts[2] as 'sim' | 'total';
    const pendingId = parts[3];
    const pending = getPendingContextSession(pendingId);

    if (!pending) {
      await interaction.reply({
        content: '❌ Session expired. Please try again.',
        flags: MessageFlags.Ephemeral,
      });
      return true;
    }

    if (interaction.user.id !== pending.userId) {
      await interaction.reply({
        content: '❌ Only the person who started this scan can select a metric.',
        flags: MessageFlags.Ephemeral,
      });
      return true;
    }

    await interaction.update({
      content: `⏳ Processing **${metric === 'sim' ? 'Sim Power' : 'Total Power'}** screenshots...`,
      components: [],
    });

    try {
      let lastProgressUpdate = 0;
      const sessionId = await runClubAnalyze({
        metric,
        attachments: pending.attachments,
        guildId: pending.guildId,
        userId: pending.userId,
        username: pending.username,
        onProgress: (completed, total, imageName) => {
          const now = Date.now();
          if (now - lastProgressUpdate >= 8_000 || completed === total) {
            lastProgressUpdate = now;
            const pct = Math.round((completed / total) * 100);
            interaction
              .editReply({
                content: `⏳ Processing screenshot ${completed}/${total} (${pct}%) — ${imageName}...`,
              })
              .catch(() => {
                /* ignore edit failures */
              });
          }
        },
      });

      const session = getSession(sessionId);
      if (!session) {
        await interaction.followUp({
          content: '❌ Session creation failed.',
        });
        return true;
      }

      const embed = buildPageEmbed(session);
      const components = buildNavigationRow(session, sessionId);

      await interaction.editReply({
        content: `✅ Scanned ${pending.attachments.length} screenshot(s), found ${session.canonicalMerged.length} members. Review below:`,
      });

      await interaction.followUp({
        content: '',
        embeds: [embed],
        components,
      });
    } catch (err) {
      console.error('[club-analyze-context] OCR failed:', err);
      await interaction.followUp({
        content: `❌ Scan failed: ${(err as Error).message}`,
      });
    }

    deletePendingContextSession(pendingId);
    return true;
  },
};
