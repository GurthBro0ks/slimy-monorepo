/**
 * Club Analyze — Paginated edit UI for roster OCR with staging persistence.
 *
 * Architecture:
 *   /club-analyze → extractRoster() → dedupeRosterRows() → saveStagingRows()
 *   Edit UI (paginated) → updateStagingRow() → saveStagingRows()
 *   /club-push (future) → reads staging → writes club_latest
 *
 * Command: /club-analyze metric:<sim|total> image1:... image2:... ... image10:...
 * Flow: Scan → Paginated Edit → Save to Staging
 */

import {
  SlashCommandBuilder,
  EmbedBuilder,
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
import { v4 as uuidv4 } from 'uuid';
import { extractRoster } from '../services/roster-ocr.js';
import { dedupeRosterRows, RawRosterRow } from '../services/roster-ocr.js';
import {
  clearStaging,
  saveStagingRows,
} from '../services/club-staging.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_IMAGES = 10;
const BUTTON_PREFIX = 'club-analyze';
const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour

// ─── Types ───────────────────────────────────────────────────────────────────

interface PageRow {
  name: string;
  power: bigint;
  edited: boolean;
}

interface Page {
  screenshotFilename: string;
  rows: PageRow[];
}

interface ScanSession {
  interactionId: string;
  guildId: string;
  userId: string;
  username: string;
  metric: 'sim' | 'total';
  currentPage: number;
  pages: Page[];
  canonicalMerged: Array<{ name: string; power: bigint }>;
  dirty: boolean;
  createdAt: number;
}

// ─── Session Store ───────────────────────────────────────────────────────────

const sessions = new Map<string, ScanSession>();

function cleanExpiredSessions(): void {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      sessions.delete(id);
    }
  }
}

function getSession(interactionId: string): ScanSession | null {
  const session = sessions.get(interactionId);
  if (!session) return null;
  if (Date.now() - session.createdAt > SESSION_TTL_MS) {
    sessions.delete(interactionId);
    return null;
  }
  return session;
}

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
    await interaction.deferReply({ ephemeral: true });

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
      const ocrResults = await extractRoster(
        imageAttachments.map((att) => ({ url: att.url, name: att.name || 'image' })),
        {
          metric,
          skipLiveOcr: process.env.SKIP_LIVE_OCR === '1',
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
        },
      );

      // Build pages from OCR results
      const pages: Page[] = ocrResults.map((result) => ({
        screenshotFilename: imageAttachments[result.imageIndex]?.name || `screenshot_${result.imageIndex + 1}`,
        rows: result.rows.map((row) => ({
          name: row.name,
          power: row.power,
          edited: false,
        })),
      }));

      // Compute canonical merged result
      const allRawRows: RawRosterRow[] = [];
      for (let i = 0; i < ocrResults.length; i++) {
        for (const row of ocrResults[i].rows) {
          allRawRows.push({ name: row.name, power: row.power, source_screenshot: i });
        }
      }
      const canonicalMerged = dedupeRosterRows(allRawRows);

      const sessionId = uuidv4();
      const session: ScanSession = {
        interactionId: sessionId,
        guildId,
        userId,
        username: interaction.user.username,
        metric,
        currentPage: 0,
        pages,
        canonicalMerged,
        dirty: false,
        createdAt: Date.now(),
      };
      sessions.set(sessionId, session);

      await interaction.editReply({
        content: `✅ Scanned ${imageAttachments.length} screenshot(s), found ${canonicalMerged.length} members. Review below:`,
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

  const replyFn = async (content: string, embeds?: EmbedBuilder[], components?: ActionRowBuilder<ButtonBuilder>[]) => {
    if (interaction.isButton() || interaction.isModalSubmit()) {
      await interaction.update({ content, embeds, components } as Record<string, unknown>);
    } else {
      await interaction.editReply({ content, embeds, components });
    }
  };

  const page = session.pages[session.currentPage];
  const metricLabel = session.metric === 'sim' ? 'SIM' : 'TOTAL';
  const totalPages = session.pages.length;
  const currentPageNum = session.currentPage + 1;

  const embed = new EmbedBuilder()
    .setTitle(`Club Analyze — ${metricLabel} Power — Screenshot ${currentPageNum}/${totalPages}`)
    .setDescription(`\`${page.screenshotFilename}\``)
    .setColor(0x3b82f6);

  for (let i = 0; i < page.rows.length; i++) {
    const row = page.rows[i];
    const editedFlag = row.edited ? ' ✏️' : '';
    embed.addFields({
      name: `${i + 1}. ${row.name}${editedFlag}`,
      value: `Power: **${row.power.toLocaleString()}**`,
      inline: false,
    });
  }

  const dirtyCount = session.pages.reduce(
    (sum, p) => sum + p.rows.filter((r) => r.edited).length,
    0,
  );
  const dirtyText = dirtyCount > 0 ? ` • ${dirtyCount} unsaved edit${dirtyCount === 1 ? '' : 's'}` : ' • no pending edits';

  embed.setFooter({
    text: `Page ${currentPageNum} of ${totalPages}${dirtyText}`,
  });

  const components = buildNavigationRow(session, sessionId);

  await replyFn('', [embed], components);
}

async function renderPage(
  interaction: ButtonInteraction,
  session: ScanSession,
): Promise<void> {
  const page = session.pages[session.currentPage];
  const metricLabel = session.metric === 'sim' ? 'SIM' : 'TOTAL';
  const totalPages = session.pages.length;
  const currentPageNum = session.currentPage + 1;

  const embed = new EmbedBuilder()
    .setTitle(`Club Analyze — ${metricLabel} Power — Screenshot ${currentPageNum}/${totalPages}`)
    .setDescription(`\`${page.screenshotFilename}\``)
    .setColor(0x3b82f6);

  for (let i = 0; i < page.rows.length; i++) {
    const row = page.rows[i];
    const editedFlag = row.edited ? ' ✏️' : '';
    embed.addFields({
      name: `${i + 1}. ${row.name}${editedFlag}`,
      value: `Power: **${row.power.toLocaleString()}**`,
      inline: false,
    });
  }

  const dirtyCount = session.pages.reduce(
    (sum, p) => sum + p.rows.filter((r) => r.edited).length,
    0,
  );
  const dirtyText = dirtyCount > 0 ? ` • ${dirtyCount} unsaved edit${dirtyCount === 1 ? '' : 's'}` : ' • no pending edits';

  embed.setFooter({
    text: `Page ${currentPageNum} of ${totalPages}${dirtyText}`,
  });

  const components = buildNavigationRow(session, session.interactionId);

  await interaction.update({
    content: '',
    embeds: [embed],
    components,
  } as Record<string, unknown>);
}

function buildNavigationRow(
  session: ScanSession,
  sessionId: string,
): ActionRowBuilder<ButtonBuilder>[] {
  const isFirstPage = session.currentPage === 0;
  const isLastPage = session.currentPage === session.pages.length - 1;
  const dirtyCount = session.pages.reduce(
    (sum, p) => sum + p.rows.filter((r) => r.edited).length,
    0,
  );

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`${BUTTON_PREFIX}:prev:${sessionId}`)
      .setLabel('⬅ Prev')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(isFirstPage),
    new ButtonBuilder()
      .setCustomId(`${BUTTON_PREFIX}:edit:${sessionId}`)
      .setLabel('✏️ Edit Row')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`${BUTTON_PREFIX}:save:${sessionId}`)
      .setLabel(dirtyCount > 0 ? `💾 Save All (${dirtyCount})` : '💾 Save All')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`${BUTTON_PREFIX}:next:${sessionId}`)
      .setLabel('Next ➡')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(isLastPage),
  );

  const cancelRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`${BUTTON_PREFIX}:cancel:${sessionId}`)
      .setLabel('❌ Cancel')
      .setStyle(ButtonStyle.Danger),
  );

  return [row, cancelRow];
}

// ─── Edit Modal ─────────────────────────────────────────────────────────────

async function sendEditModal(
  interaction: ButtonInteraction,
  session: ScanSession,
): Promise<void> {
  const sessionId = session.interactionId;
  const page = session.pages[session.currentPage];

  // Show a modal with row number (1-indexed), name, and power
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
      flags: MessageFlags.Ephemeral,
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
