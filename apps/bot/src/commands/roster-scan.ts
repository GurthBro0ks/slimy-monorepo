/**
 * Roster Scan — Dual-model VLM OCR for Super Snail club roster screenshots.
 * Accepts 1-9 image attachments and returns extracted roster with conflict flags.
 */

import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Attachment,
} from 'discord.js';
import { extractRoster, formatRosterEmbed } from '../services/roster-ocr.js';

const MAX_IMAGES = 9;

function attachmentToUrl(att: Attachment): { url: string; name: string } {
  return { url: att.url, name: att.name || "image" };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("roster-scan")
    .setDescription("Extract a Super Snail club roster from Manage Members screenshots using dual-model OCR")
    .addAttachmentOption((option) =>
      option
        .setName("image_1")
        .setDescription("Manage Members screenshot (page 1)")
        .setRequired(true)
    )
    .addAttachmentOption((option) =>
      option
        .setName("image_2")
        .setDescription("Manage Members screenshot (page 2)")
        .setRequired(false)
    )
    .addAttachmentOption((option) =>
      option
        .setName("image_3")
        .setDescription("Manage Members screenshot (page 3)")
        .setRequired(false)
    )
    .addAttachmentOption((option) =>
      option
        .setName("image_4")
        .setDescription("Manage Members screenshot (page 4)")
        .setRequired(false)
    )
    .addAttachmentOption((option) =>
      option
        .setName("image_5")
        .setDescription("Manage Members screenshot (page 5)")
        .setRequired(false)
    )
    .addAttachmentOption((option) =>
      option
        .setName("image_6")
        .setDescription("Manage Members screenshot (page 6)")
        .setRequired(false)
    )
    .addAttachmentOption((option) =>
      option
        .setName("image_7")
        .setDescription("Manage Members screenshot (page 7)")
        .setRequired(false)
    )
    .addAttachmentOption((option) =>
      option
        .setName("image_8")
        .setDescription("Manage Members screenshot (page 8)")
        .setRequired(false)
    )
    .addAttachmentOption((option) =>
      option
        .setName("image_9")
        .setDescription("Manage Members screenshot (page 9)")
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const loading = await interaction.editReply({
      content: "⏳ Running dual-model OCR on roster screenshots...",
    });

    // Collect attachments
    const attachmentNames = [
      "image_1", "image_2", "image_3", "image_4", "image_5",
      "image_6", "image_7", "image_8", "image_9",
    ];

    const attachments = attachmentNames
      .map((name) => interaction.options.getAttachment(name))
      .filter((att): att is Attachment => att !== null);

    if (!attachments.length) {
      await interaction.editReply({ content: "❌ No images attached. Provide 1-9 Manage Members screenshots." });
      return;
    }

    if (attachments.length > MAX_IMAGES) {
      await interaction.editReply({ content: `❌ Maximum ${MAX_IMAGES} images per scan.` });
      return;
    }

    // Filter to image MIME types
    const imageAttachments = attachments.filter((att) => {
      const mime = att.contentType || "";
      return mime.startsWith("image/") || mime === "";
    });

    if (!imageAttachments.length) {
      await interaction.editReply({ content: "❌ None of the attachments appear to be images." });
      return;
    }

    try {
      const results = await extractRoster(
        imageAttachments.map(attachmentToUrl),
        { skipLiveOcr: process.env.SKIP_LIVE_OCR === "1" },
      );

      const summary = formatRosterEmbed(results);
      const totalMembers = results.reduce((sum, r) => sum + r.totalMembers, 0);
      const totalConflicts = results.reduce((sum, r) => sum + r.conflictCount, 0);

      let reply = summary;
      if (process.env.SKIP_LIVE_OCR === "1") {
        reply += "\n⚠️ SKIP_LIVE_OCR is enabled — no actual OCR was performed.";
      }

      await interaction.editReply({ content: reply });

      console.info(`[roster-scan] OCR complete: ${imageAttachments.length} images, ${totalMembers} members, ${totalConflicts} conflicts`);
    } catch (err) {
      console.error("[roster-scan] OCR failed:", err);
      await interaction.editReply({
        content: `❌ OCR failed: ${(err as Error).message}`,
      });
    }
  },
};
