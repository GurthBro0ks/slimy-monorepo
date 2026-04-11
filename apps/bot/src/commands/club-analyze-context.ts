/**
 * Club Analyze — Context Menu Command
 *
 * Message context menu command "Analyze Club Roster" that reads all image
 * attachments from a single message, enabling a mobile-friendly multi-screenshot
 * workflow that the slash command's per-slot attachment picker cannot support.
 *
 * Discord's mobile UI opens the file picker ONCE PER SLOT for slash command
 * attachment options, making 10-screenshot batches painful. The context menu
 * workaround: user sends one message with up to 10 images attached, then
 * long-presses that message → Apps → "Analyze Club Roster".
 *
 * This command's handleButton is registered under the "club-analyze" namespace
 * (via BUTTON_PREFIX) so button routing works uniformly with the slash command.
 */

import {
  ContextMenuCommandBuilder,
  ApplicationCommandType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Message,
} from 'discord.js';
import { v4 as uuidv4 } from 'uuid';
import {
  sessions,
  cleanExpiredSessions,
  ensureDatabase,
  runAnalysis,
  buildPreviewEmbed,
  buildPreviewComponents,
  handleButton as flowHandleButton,
  BUTTON_PREFIX,
} from '../services/club-analyze-flow.js';
import { trackCommand } from '../lib/metrics.js';

export const data = new ContextMenuCommandBuilder()
  .setName("Analyze Club Roster")
  .setType(ApplicationCommandType.Message);

interface ContextMenuInteraction {
  targetId: string;
  guildId: string;
  channelId: string;
  user: { id: string };
  member: unknown;
  deferReply: (opts: { ephemeral?: boolean }) => Promise<unknown>;
  editReply: (opts: Record<string, unknown>) => Promise<unknown>;
  reply: (opts: Record<string, unknown>) => Promise<unknown>;
  channel: { id: string; sendTyping: () => Promise<void> };
  getMessage: (messageId: string) => Promise<Message>;
}

export async function execute(interaction: ContextMenuInteraction): Promise<unknown> {
  const startTime = Date.now();
  cleanExpiredSessions();

  try {
    ensureDatabase();
    await interaction.deferReply({ ephemeral: true });

    // 1. Get the message the user targeted
    const targetMessage = await interaction.getMessage(interaction.targetId);

    // 2. Collect all image attachments from that message
    const imageAttachments = [...targetMessage.attachments.values()].filter(
      (a) => a.contentType?.startsWith("image/")
    );

    // 3. Validate attachment count
    if (imageAttachments.length === 0) {
      trackCommand("club-analyze-context", Date.now() - startTime, false);
      return interaction.editReply({
        content: "No image attachments found on that message. Please attach 1–10 screenshots and try again.",
      });
    }
    if (imageAttachments.length > 10) {
      trackCommand("club-analyze-context", Date.now() - startTime, false);
      return interaction.editReply({
        content: `Too many attachments (${imageAttachments.length}). Max 10 images please — send them as separate messages or reduce the count.`,
      });
    }

    // 4. Ask for metric via ephemeral button prompt
    const sessionId = uuidv4();
    sessions.set(sessionId, {
      id: sessionId,
      guildId: interaction.guildId,
      userId: interaction.user.id,
      channelId: interaction.channelId,
      type: "both",
      attachments: imageAttachments.map((a) => ({ url: a.url, name: a.name })),
      metrics: { sim: new Map(), total: new Map() },
      displayNames: new Map(),
      previousByCanonical: new Map(),
      lastWeekSet: new Set(),
      ensembleMetadata: null,
      sheetConfig: { url: null, sheetId: null },
      qa: null,
      approvals: new Set(),
      forceCommit: false,
      strictRuns: 0,
      createdAt: Date.now(),
      useEnsemble: false,
    });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`${BUTTON_PREFIX}:metric:sim:${sessionId}`)
        .setEmoji("⚡")
        .setLabel("Sim Power")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`${BUTTON_PREFIX}:metric:total:${sessionId}`)
        .setEmoji("💪")
        .setLabel("Total Power")
        .setStyle(ButtonStyle.Primary),
    );

    trackCommand("club-analyze-context", Date.now() - startTime, true);
    return interaction.editReply({
      content: `Found **${imageAttachments.length}** screenshot${imageAttachments.length === 1 ? "" : "s"}. Which metric are these showing?`,
      components: [row],
    });
  } catch (err) {
    trackCommand("club-analyze-context", Date.now() - startTime, false);
    console.error("[club-analyze-context] Failed", { error: (err as Error).message });
    return interaction.editReply({
      content: `❌ ${(err as Error).message}`,
    });
  }
}

/**
 * Unified button handler for club-analyze.
 * Registered under the "club-analyze" namespace (BUTTON_PREFIX) so it handles
 * both the slash command's approve/cancel buttons AND this command's metric
 * selection buttons.
 *
 * Button customId formats:
 *   - approve/cancel (slash + context):  `club-analyze:approve:${sessionId}`
 *                                           `club-analyze:cancel:${sessionId}`
 *   - metric selection (context only):    `club-analyze:metric:${metric}:${sessionId}`
 *
 * Returns true if handled, false otherwise.
 */
export async function handleButton(interaction: {
  customId: string;
  deferUpdate: () => Promise<unknown>;
  reply: (opts: { content: string; ephemeral?: boolean }) => Promise<unknown>;
  editReply: (opts: Record<string, unknown>) => Promise<unknown>;
}): Promise<boolean> {
  const parts = String(interaction.customId || "").split(":");
  if (parts[0] !== BUTTON_PREFIX || parts.length < 3) return false;

  const [, action, ...rest] = parts;

  // Delegate approve/cancel to the shared flow handler
  if (action === "approve" || action === "cancel") {
    return flowHandleButton(interaction);
  }

  // Handle metric selection (context menu only): club-analyze:metric:${metric}:${sessionId}
  if (action === "metric" && rest.length >= 2) {
    const metric = rest[0];
    const sessionId = rest[1];
    const session = sessions.get(sessionId);

    if (!session) {
      await interaction.reply({ content: "❌ Session expired. Run the command again.", ephemeral: true });
      return true;
    }

    try {
      // Run the analysis
      await runAnalysis(session);

      // Build preview
      const embed = buildPreviewEmbed(session);
      const components = buildPreviewComponents(session);

      // Update the original reply to show the preview
      await interaction.editReply({
        content: `**${metric === "sim" ? "Sim Power" : "Total Power"}** analysis complete.`,
        embeds: [embed],
        components,
      });
    } catch (err) {
      await interaction.editReply({
        content: `❌ Analysis failed: ${(err as Error).message}`,
      });
    }
    return true;
  }

  return false;
}
