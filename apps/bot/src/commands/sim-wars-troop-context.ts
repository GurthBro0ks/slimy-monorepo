/**
 * Sim Wars Troop Analysis — Context Menu Command ("Analyze Individual Troop")
 *
 * Message context menu command that reads 2 image attachments from a message,
 * shows a modal asking for player name, then runs OCR and shows review embed.
 *
 * Flow:
 *   1. User sends message with 2 Sim Wars screenshots
 *   2. Long-press → Apps → "Analyze Individual Troop"
 *   3. Bot shows modal asking for player name
 *   4. User submits player name
 *   5. Bot runs OCR on both images
 *   6. Bot shows review embed with extracted stats
 *   7. User can click Export CSV button
 *
 * Custom ID scheme:
 *   Modal:      "Analyze Individual Troop:modal:<pendingId>"
 *   Export:     "Analyze Individual Troop:export:<guildId>:<playerNameCanonical>"
 */

import {
  ContextMenuCommandBuilder,
  ApplicationCommandType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  MessageFlags,
  MessageContextMenuCommandInteraction,
  ButtonInteraction,
  ModalSubmitInteraction,
} from 'discord.js';
import { v4 as uuidv4 } from 'uuid';
import { extractTroopStats } from '../lib/sim-wars-troop-ocr.js';
import { upsertTroopLatest, logTroopImport, getAllTroopsForGuild, buildTroopCsv } from '../lib/sim-wars-troop-store.js';
import { createLogger } from '../lib/logger.js';

const logger = createLogger({ context: 'sim-wars-troop-context' });

const CONTEXT_PREFIX = 'Analyze Individual Troop';

interface PendingTroopSession {
  id: string;
  guildId: string;
  userId: string;
  username: string;
  attachments: Array<{ url: string; name?: string }>;
  createdAt: number;
}

const pendingSessions = new Map<string, PendingTroopSession>();

const SESSION_TTL_MS = 5 * 60 * 1000;

function cleanExpiredSessions(): void {
  const now = Date.now();
  for (const [key, session] of pendingSessions) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      pendingSessions.delete(key);
    }
  }
}

function formatNumber(value: unknown): string {
  if (value === null || value === undefined) return '*(missing)*';
  const num = Number(value);
  if (!Number.isFinite(num)) return '*(missing)*';
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  if (Number.isInteger(num)) return num.toLocaleString();
  return num.toFixed(2);
}

function formatPercent(value: unknown): string {
  if (value === null || value === undefined) return '*(missing)*';
  const num = Number(value);
  if (!Number.isFinite(num)) return '*(missing)*';
  if (Number.isInteger(num)) return `${num}%`;
  return `${num.toFixed(1)}%`;
}

function formatLeadership(current: unknown, max: unknown): string {
  const cur = current !== null && current !== undefined ? Number(current) : null;
  const mx = max !== null && max !== undefined ? Number(max) : null;
  const curOk = cur !== null && Number.isFinite(cur);
  const mxOk = mx !== null && Number.isFinite(mx);
  if (curOk && mxOk) return `${Math.floor(cur).toLocaleString()}/${Math.floor(mx).toLocaleString()}`;
  if (curOk) return `${Math.floor(cur).toLocaleString()}/—`;
  if (mxOk) return `—/${Math.floor(mx).toLocaleString()}`;
  return '*(missing)*';
}

function buildTroopEmbed(playerName: string, stats: Record<string, unknown>, confidence: Record<string, string>, notes: string[]): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`Sim Wars Troop Analysis — ${playerName}`)
    .setColor(0x00ff88)
    .setTimestamp();

  const deployFields: string[] = [];
  const fieldDefs = [
    ['Power', stats.troop_power],
    ['HP', stats.troop_hp],
    ['Attack', stats.troop_attack],
    ['Defense', stats.troop_defense],
    ['Rush', stats.troop_rush],
  ];

  for (const [label, value] of fieldDefs) {
    deployFields.push(`**${label}:** ${formatNumber(value)}`);
  }

  embed.addFields({
    name: 'Deploy Screen Stats',
    value: deployFields.join('\n'),
    inline: true,
  });

  const leadership = formatLeadership(stats.troop_leadership_current, stats.troop_leadership_max);
  embed.addFields({
    name: 'Leadership',
    value: leadership,
    inline: true,
  });

  const elementFields: string[] = [];
  const elementDefs = [
    ['Fire', stats.troop_fire_dmg],
    ['Water', stats.troop_water_dmg],
    ['Earth', stats.troop_earth_dmg],
    ['Wind', stats.troop_wind_dmg],
    ['Poison', stats.troop_poison_dmg],
  ];

  for (const [label, value] of elementDefs) {
    elementFields.push(`**${label}:** ${formatNumber(value)}`);
  }

  embed.addFields({
    name: 'Element Damage',
    value: elementFields.join('\n'),
    inline: true,
  });

  const critValue = stats.troop_crit_dmg_reduc_pct;
  embed.addFields({
    name: 'CRIT DMG REDUC',
    value: formatPercent(critValue),
    inline: true,
  });

  const confDeploy = confidence.deploy || 'missing';
  const confPopup = confidence.popup || 'missing';
  const confEmoji = (c: string) => c === 'high' ? '✅' : c === 'low' ? '⚠️' : '❌';

  let footer = `Source: player name manually entered | Deploy: ${confEmoji(confDeploy)} Popup: ${confEmoji(confPopup)}`;
  if (notes.length > 0) footer += ` | ${notes.join(', ')}`;
  embed.setFooter({ text: footer });

  return embed;
}

module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName('Analyze Individual Troop')
    .setType(ApplicationCommandType.Message),

  async execute(interaction: MessageContextMenuCommandInteraction): Promise<void> {
    cleanExpiredSessions();

    const targetMessage = interaction.targetMessage;

    const imageAttachments = [...targetMessage.attachments.values()].filter((a) => {
      const ct = a.contentType || '';
      return ct.startsWith('image/') || ct === '';
    });

    if (imageAttachments.length === 0) {
      await interaction.reply({
        content: 'No image attachments found on that message. Attach 2 Sim Wars screenshots and try again.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (imageAttachments.length < 2) {
      await interaction.reply({
        content: `Found ${imageAttachments.length} image(s). For best results, attach both the deploy screen and troop stats popup screenshots in one message.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (imageAttachments.length > 10) {
      await interaction.reply({
        content: `Too many attachments (${imageAttachments.length}). Maximum 10 images.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const pendingId = uuidv4();
    pendingSessions.set(pendingId, {
      id: pendingId,
      guildId: interaction.guildId ?? 'dm',
      userId: interaction.user.id,
      username: interaction.user.username,
      attachments: imageAttachments.map((a) => ({ url: a.url, name: a.name })),
      createdAt: Date.now(),
    });

    const modal = new ModalBuilder()
      .setCustomId(`${CONTEXT_PREFIX}:modal:${pendingId}`)
      .setTitle('Sim Wars Troop Analysis');

    const nameInput = new TextInputBuilder()
      .setCustomId('player_name')
      .setLabel('Player name')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Enter the player name for this troop')
      .setRequired(true)
      .setMaxLength(120);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
    );

    await interaction.showModal(modal);
  },

  async handleModal(interaction: ModalSubmitInteraction): Promise<void> {
    const parts = String(interaction.customId || '').split(':');
    if (parts[0] !== CONTEXT_PREFIX || parts.length < 3) return;
    if (parts[1] !== 'modal') return;

    const pendingId = parts[2];
    const pending = pendingSessions.get(pendingId);

    if (!pending) {
      await interaction.reply({
        content: 'Session expired. Please try again from the message context menu.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (interaction.user.id !== pending.userId) {
      await interaction.reply({
        content: 'Only the person who started this analysis can submit the player name.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const playerName = interaction.fields.getTextInputValue('player_name').trim();
    if (!playerName) {
      await interaction.reply({
        content: 'Player name cannot be empty.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply();

    try {
      const result = await extractTroopStats(pending.attachments);

      const embed = buildTroopEmbed(playerName, result.stats as unknown as Record<string, unknown>, result.confidence, result.notes);

      const guildId = pending.guildId;

      try {
        await upsertTroopLatest(guildId, playerName, result.stats, {
          rawResponses: result.rawResponses.map(r => ({ model: r.model, snippet: r.content.slice(0, 200) })),
          confidence: result.confidence,
          notes: result.notes,
        });

        await logTroopImport(guildId, playerName, 'ocr_import', {
          userId: pending.userId,
          username: pending.username,
          fieldsExtracted: Object.values(result.stats).filter(v => v !== null).length,
          confidence: result.confidence,
        });
      } catch (dbErr) {
        logger.error('Failed to save troop data to DB', dbErr as Error, { guildId, playerName });
      }

      const playerNameCanonical = playerName.toLowerCase().replace(/\s+/g, '');
      const exportButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`${CONTEXT_PREFIX}:export:${guildId}:${playerNameCanonical}`)
          .setLabel('Export CSV')
          .setStyle(ButtonStyle.Secondary),
      );

      await interaction.editReply({
        content: `Analysis complete for **${playerName}**. ${Object.values(result.stats).filter(v => v !== null).length}/14 fields extracted.`,
        embeds: [embed],
        components: [exportButton],
      });
    } catch (err) {
      logger.error('Troop OCR failed', err as Error);
      await interaction.editReply({
        content: `OCR failed: ${(err as Error).message}`,
      });
    } finally {
      pendingSessions.delete(pendingId);
    }
  },

  async handleButton(interaction: ButtonInteraction): Promise<boolean> {
    const parts = String(interaction.customId || '').split(':');
    if (parts[0] !== CONTEXT_PREFIX || parts.length < 4) return false;
    if (parts[1] !== 'export') return false;

    const guildId = parts[2];
    const _playerNameCanonical = parts.slice(3).join(':');

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const rows = await getAllTroopsForGuild(guildId);
      if (rows.length === 0) {
        await interaction.editReply({ content: 'No troop data found for this server.' });
        return true;
      }

      const csv = buildTroopCsv(rows);
      const buffer = Buffer.from(csv, 'utf-8');

      await interaction.editReply({
        content: `Exported ${rows.length} troop record(s) as CSV.`,
        files: [{ name: `sim-wars-troops-${guildId}.csv`, attachment: buffer }],
      });
    } catch (err) {
      logger.error('CSV export failed', err as Error);
      await interaction.editReply({ content: `Export failed: ${(err as Error).message}` });
    }

    return true;
  },
};
