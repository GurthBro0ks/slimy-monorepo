/**
 * Club Analyze — Paginated edit UI for roster OCR with staging persistence.
 *
 * Architecture:
 *   /club-analyze → runClubAnalyze() → sendPage()
 *   Edit UI (paginated) → updateStagingRow() → saveStagingRows()
 *   /club-push → reads staging → writes club_latest
 *
 * Command: /club-analyze metric:<sim|total> image1:... image2:... ... image10:...
 * Flow: Scan → Paginated Edit → Save to Staging
 */

import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  Attachment,
  ChatInputCommandInteraction,
  ButtonInteraction,
  ModalSubmitInteraction,
  MessageFlags,
} from 'discord.js';
import {
  sessions,
  cleanExpiredSessions,
  getSession,
  runClubAnalyze,
  buildPageEmbed,
  buildNavigationRow,
  BUTTON_PREFIX,
  MAX_IMAGES,
} from '../services/club-analyze-flow.js';
import type { ScanSession } from '../services/club-analyze-flow.js';
import { dedupeRosterRows } from '../services/roster-ocr.js';
import type { RawRosterRow } from '../services/roster-ocr.js';
import {
  clearStaging,
  saveStagingRows,
} from '../services/club-staging.js';
import { requireAdminRole } from '../utils/admin-role.js';

// ─── Slash Command Definition ────────────────────────────────────────────────

module.exports = {
  data: new SlashCommandBuilder()
    .setName('club-analyze')
    .setDescription('Scan Super Snail club roster screenshots and review extracted data before pushing to database')
    .addStringOption((option) =>
      option
        .setName('metric')
        .setDescription('Power metric to scan')
        .setRequired(true)
        .addChoices(
          { name: 'Sim Power', value: 'sim' },
          { name: 'Total Power', value: 'total' },
        ),
    )
    .addAttachmentOption((option) =>
      option.setName('image_1').setDescription('Manage Members screenshot (page 1)').setRequired(true),
    )
    .addAttachmentOption((option) =>
      option.setName('image_2').setDescription('Manage Members screenshot (page 2)').setRequired(false),
    )
    .addAttachmentOption((option) =>
      option.setName('image_3').setDescription('Manage Members screenshot (page 3)').setRequired(false),
    )
    .addAttachmentOption((option) =>
      option.setName('image_4').setDescription('Manage Members screenshot (page 4)').setRequired(false),
    )
    .addAttachmentOption((option) =>
      option.setName('image_5').setDescription('Manage Members screenshot (page 5)').setRequired(false),
    )
    .addAttachmentOption((option) =>
      option.setName('image_6').setDescription('Manage Members screenshot (page 6)').setRequired(false),
    )
    .addAttachmentOption((option) =>
      option.setName('image_7').setDescription('Manage Members screenshot (page 7)').setRequired(false),
    )
    .addAttachmentOption((option) =>
      option.setName('image_8').setDescription('Manage Members screenshot (page 8)').setRequired(false),
    )
    .addAttachmentOption((option) =>
      option.setName('image_9').setDescription('Manage Members screenshot (page 9)').setRequired(false),
    )
    .addAttachmentOption((option) =>
      option.setName('image_10').setDescription('Manage Members screenshot (page 10)').setRequired(false),
    ),

  // ─── Main Execute ─────────────────────────────────────────────────────────

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!(await requireAdminRole(interaction, '/club-analyze'))) return;

    await interaction.deferReply();

    cleanExpiredSessions();

    const metric = (interaction.options.getString('metric') ?? 'sim') as 'sim' | 'total';
    const guildId = interaction.guildId ?? 'dm';
    const userId = interaction.user.id;

    // Collect attachments
    const attachmentNames = Array.from({ length: MAX_IMAGES }, (_, i) => `image_${i + 1}`);
    const attachments = attachmentNames
      .map((name) => interaction.options.getAttachment(name))
      .filter((att): att is Attachment => att !== null);

    if (!attachments.length) {
      await interaction.editReply({ content: '❌ No images attached. Provide 1-10 Manage Members screenshots.' });
      return;
    }

    const imageAttachments = attachments.filter((att) => {
      const mime = att.contentType || '';
      return mime.startsWith('image/') || mime === '';
    });

    if (!imageAttachments.length) {
      await interaction.editReply({ content: '❌ None of the attachments appear to be images.' });
      return;
    }

    if (imageAttachments.length > MAX_IMAGES) {
      await interaction.editReply({ content: `❌ Maximum ${MAX_IMAGES} images per scan.` });
      return;
    }

    try {
      let lastProgressUpdate = 0;
      const sessionId = await runClubAnalyze({
        metric,
        attachments: imageAttachments.map((att) => ({ url: att.url, name: att.name || 'image' })),
        guildId,
        userId,
        username: interaction.user.username,
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
      await interaction.editReply({
        content: `✅ Scanned ${imageAttachments.length} screenshot(s), found ${session!.canonicalMerged.length} members. Review below:`,
      });

      await sendPage(interaction, sessionId);
    } catch (err) {
      console.error('[club-analyze] Scan failed:', err);
      await interaction.editReply({
        content: `❌ Scan failed: ${(err as Error).message}`,
      });
    }
  },

  // ─── Button Handler ────────────────────────────────────────────────────────

  async handleButton(interaction: ButtonInteraction): Promise<void> {
    const parts = String(interaction.customId || '').split(':');
    if (parts[0] !== BUTTON_PREFIX || parts.length < 3) return;

    const [, action, sessionId] = parts;
    const session = getSession(sessionId);

    if (!session) {
      await interaction.reply({
        content: '❌ Session expired. Run /club-analyze again.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Refresh TTL on activity
    session.createdAt = Date.now();

    switch (action) {
      case 'prev':
        session.currentPage = Math.max(0, session.currentPage - 1);
        await renderPage(interaction, session);
        break;

      case 'next':
        session.currentPage = Math.min(session.pages.length - 1, session.currentPage + 1);
        await renderPage(interaction, session);
        break;

      case 'edit':
        await sendEditModal(interaction, session);
        break;

      case 'save':
        await handleSave(interaction, session);
        break;

      case 'cancel_confirm':
        await handleCancelConfirm(interaction, session);
        break;

      case 'cancel':
        await interaction.reply({
          content: '⚠️ Discard all edits and unsaved data?',
          components: [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setCustomId(`${BUTTON_PREFIX}:cancel_confirm:${sessionId}`)
                .setLabel('Yes, discard everything')
                .setStyle(ButtonStyle.Danger),
              new ButtonBuilder()
                .setCustomId(`${BUTTON_PREFIX}:page:${sessionId}`)
                .setLabel('Keep editing')
                .setStyle(ButtonStyle.Secondary),
            ),
          ],
          flags: MessageFlags.Ephemeral,
        });
        break;

      case 'page':
        // Keep editing — just re-render current page
        await renderPage(interaction, session);
        break;

      default:
        await interaction.reply({ content: 'Unknown action.', flags: MessageFlags.Ephemeral });
    }
  },

  // ─── Modal Submit Handler ──────────────────────────────────────────────────

  async handleModal(interaction: ModalSubmitInteraction): Promise<void> {
    const parts = String(interaction.customId || '').split(':');
    if (parts[0] !== BUTTON_PREFIX || parts[2] !== 'edit_row') return;

    const [, sessionId] = parts;
    const session = getSession(sessionId);

    if (!session) {
      await interaction.reply({
        content: '❌ Session expired. Run /club-analyze again.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    session.createdAt = Date.now();

    const rowNumStr = interaction.fields.getTextInputValue('row_select');
    const nameInput = interaction.fields.getTextInputValue('name_input');
    const powerInput = interaction.fields.getTextInputValue('power_input');

    const rowIndex = parseInt(rowNumStr, 10) - 1; // Convert to 0-indexed

    if (
      isNaN(rowIndex) ||
      rowIndex < 0 ||
      rowIndex >= session.pages[session.currentPage].rows.length
    ) {
      await interaction.reply({
        content: `❌ Invalid row number. Must be between 1 and ${session.pages[session.currentPage].rows.length}.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const powerNum = Number(powerInput);
    if (!Number.isFinite(powerNum) || powerNum < 0) {
      await interaction.reply({
        content: '❌ Power must be a non-negative integer.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const trimmedName = nameInput.trim().slice(0, 64);
    if (!trimmedName) {
      await interaction.reply({
        content: '❌ Name cannot be empty.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Apply edit
    session.pages[session.currentPage].rows[rowIndex].name = trimmedName;
    session.pages[session.currentPage].rows[rowIndex].power = BigInt(Math.floor(powerNum));
    session.pages[session.currentPage].rows[rowIndex].edited = true;
    session.dirty = true;

    await interaction.reply({
      content: `✅ Row ${rowIndex + 1} updated: **${trimmedName}** — ${BigInt(Math.floor(powerNum)).toLocaleString()}`,
      flags: MessageFlags.Ephemeral,
    });

    await renderPage(interaction as unknown as ButtonInteraction, session);
  },
};

// ─── Render Helpers ──────────────────────────────────────────────────────────

async function sendPage(
  interaction: ChatInputCommandInteraction | ButtonInteraction,
  sessionId: string,
): Promise<void> {
  const session = getSession(sessionId);
  if (!session) return;

  const embed = buildPageEmbed(session);
  const components = buildNavigationRow(session, sessionId);

  if (interaction.isButton() || interaction.isModalSubmit()) {
    await interaction.update({ content: '', embeds: [embed], components } as Record<string, unknown>);
  } else {
    await interaction.editReply({ content: '', embeds: [embed], components });
  }
}

async function renderPage(
  interaction: ButtonInteraction,
  session: ScanSession,
): Promise<void> {
  const embed = buildPageEmbed(session);
  const components = buildNavigationRow(session, session.interactionId);

  await interaction.update({
    content: '',
    embeds: [embed],
    components,
  } as Record<string, unknown>);
}

// ─── Edit Modal ─────────────────────────────────────────────────────────────

async function sendEditModal(
  interaction: ButtonInteraction,
  session: ScanSession,
): Promise<void> {
  const sessionId = session.interactionId;
  const page = session.pages[session.currentPage];

  const modal = new ModalBuilder()
    .setCustomId(`${BUTTON_PREFIX}:edit_row:${sessionId}`)
    .setTitle(`Edit Row — ${session.metric.toUpperCase()} Power`);

  const rowNumberField = new TextInputBuilder()
    .setCustomId('row_select')
    // eslint-disable-next-line deprecation/deprecation
    .setLabel(`Row number (1-${page.rows.length})`)
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Enter row number to edit')
    .setRequired(true)
    .setValue('1');

  const nameField = new TextInputBuilder()
    .setCustomId('name_input')
    // eslint-disable-next-line deprecation/deprecation
    .setLabel('Member name')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Enter corrected name')
    .setRequired(true)
    .setMaxLength(64);

  const powerField = new TextInputBuilder()
    .setCustomId('power_input')
    // eslint-disable-next-line deprecation/deprecation
    .setLabel('Power (integer)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Enter power value')
    .setRequired(true);

  // eslint-disable-next-line deprecation/deprecation
  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(rowNumberField),
    new ActionRowBuilder<TextInputBuilder>().addComponents(nameField),
    new ActionRowBuilder<TextInputBuilder>().addComponents(powerField),
  );

  await interaction.showModal(modal);
}

async function handleSave(
  interaction: ButtonInteraction,
  session: ScanSession,
): Promise<void> {
  const { guildId, userId, metric } = session;

  if (interaction.user.id !== userId) {
    await interaction.reply({
      content: `Only ${session.username} can edit this scan`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  try {
    const allRawRows: RawRosterRow[] = [];
    for (let i = 0; i < session.pages.length; i++) {
      for (const row of session.pages[i].rows) {
        allRawRows.push({ name: row.name, power: row.power, source_screenshot: i });
      }
    }

    const canonicalMerged = dedupeRosterRows(allRawRows);
    session.canonicalMerged = canonicalMerged;

    await saveStagingRows(
      guildId,
      metric,
      userId,
      canonicalMerged.map((r) => ({ member_name: r.name, power_value: r.power })),
    );

    for (const page of session.pages) {
      for (const row of page.rows) {
        row.edited = false;
      }
    }
    session.dirty = false;

    await interaction.update({
      content: `💾 Saved **${canonicalMerged.length}** members to **${metric.toUpperCase()}** staging.`,
      embeds: [],
      components: [],
    });

    await interaction.followUp({
      content: `Saved **${canonicalMerged.length}** members to **${metric.toUpperCase()}** staging. Run /club-push when ready to commit both metrics to the database.`,
    });
  } catch (err) {
    console.error('[club-analyze] Save failed:', err);
    try {
      await interaction.reply({
        content: `❌ Save failed: ${(err as Error).message}`,
        flags: MessageFlags.Ephemeral,
      });
    } catch {
      // interaction may have expired — swallow to avoid unhandled rejection
    }
  }
}

async function handleCancelConfirm(
  interaction: ButtonInteraction,
  session: ScanSession,
): Promise<void> {
  const { guildId, metric } = session;

  try {
    await clearStaging(guildId, metric);
  } catch {
    /* ignore clear errors on cancel */
  }

  sessions.delete(session.interactionId);

  await interaction.update({
    content: '🛑 Scan discarded. Run /club-analyze to start fresh.',
    embeds: [],
    components: [],
  } as Record<string, unknown>);
}
