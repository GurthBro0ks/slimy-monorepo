/**
 * GDPR consent management command.
 * Ported from /opt/slimy/app/commands/consent.js
 */

import { SlashCommandBuilder } from "discord.js";
import { database } from "../../lib/database.js";
import { memoryStore } from "../../lib/memory.js";

async function getConsent({
  guildId,
  userId,
}: {
  guildId: string;
  userId: string;
}): Promise<boolean> {
  if (database.isConfigured()) {
    try {
      return await database.getUserConsent(userId);
    } catch (err) {
      console.error("[consent] Database error:", (err as Error).message);
    }
  }
  return await memoryStore.getConsent({ guildId, userId });
}

async function setConsent({
  guildId,
  userId,
  allow,
}: {
  guildId: string;
  userId: string;
  allow: boolean;
}): Promise<void> {
  if (database.isConfigured()) {
    try {
      await database.setUserConsent(userId, allow);
      return;
    } catch (err) {
      console.error("[consent] Database error:", (err as Error).message);
    }
  }
  await memoryStore.setConsent({ guildId, userId, allowed: allow });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("consent")
    .setDescription("Manage memory consent")
    .addSubcommand((sc) =>
      sc
        .setName("set")
        .setDescription("Enable or disable memory here")
        .addBooleanOption((o) =>
          o
            .setName("allow")
            .setDescription("true to enable, false to disable")
            .setRequired(true),
        ),
    )
    .addSubcommand((sc) =>
      sc.setName("status").setDescription("Show current memory consent here"),
    ),

  async execute(interaction: {
    options: { getSubcommand: (fallback: boolean) => string; getBoolean: (name: string) => boolean | null };
    guild: { id: string } | null;
    user: { id: string };
    reply: (opts: { content: string; ephemeral?: boolean }) => Promise<void>;
  }): Promise<void> {
    const guildId = interaction.guild?.id || "";
    const userId = interaction.user.id;

    const sub = interaction.options.getSubcommand(false);

    if (sub === "status") {
      const on = await getConsent({ guildId, userId });
      await interaction.reply({
        content: on ? "✅ Memory ON here." : "❌ Memory OFF here.",
        ephemeral: true,
      });
      return;
    }

    if (sub === "set") {
      const allow = interaction.options.getBoolean("allow") ?? false;
      await setConsent({ guildId, userId, allow });
      await interaction.reply({
        content: allow
          ? "✅ Memory ON for this server."
          : "🛑 Memory OFF for this server.",
        ephemeral: true,
      });
      return;
    }

    // Legacy fallback
    const legacy = interaction.options.getBoolean("allow");
    if (legacy !== null) {
      await setConsent({ guildId, userId, allow: legacy });
      await interaction.reply({
        content: legacy
          ? "✅ Memory ON for this server."
          : "🛑 Memory OFF for this server.",
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content: "Usage: /consent set allow:true|false  •  /consent status",
      ephemeral: true,
    });
  },
};
