import type { ChatInputCommandInteraction } from "discord.js";

import { SlashCommandBuilder } from "discord.js";

import * as contracts from "@slimy/contracts";

import { createAdminApiClientForInteraction } from "../lib/adminApi.js";

function describeAdminApiError(error: unknown): string {
  if (!error) return "unknown_error";
  if (typeof error === "string") return error;
  if (typeof error === "object") {
    const e: any = error;
    return String(e.error || e.code || e.message || "unknown_error");
  }
  return String(error);
}

export const memoryCommand = new SlashCommandBuilder()
  .setName("memory")
  .setDescription("Write structured memory (v0.1)")
  .addSubcommand((sub) =>
    sub
      .setName("profile_summary")
      .setDescription("Write/update your profile summary memory record")
      .addStringOption((opt) =>
        opt
          .setName("text")
          .setDescription("Short summary (stored as structured JSON)")
          .setRequired(true)
          .setMaxLength(1024),
      ),
  );

export async function handleMemoryCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const subcommand = interaction.options.getSubcommand(true);
  if (subcommand !== "profile_summary") {
    await interaction.reply({ ephemeral: true, content: "Unknown memory subcommand." });
    return;
  }

  const userId = interaction.user.id;
  const text = interaction.options.getString("text", true);
  const content = { summary: text };

  const policy = contracts.checkMemoryKindPolicy({
    scopeType: "user",
    kind: "profile_summary",
    isPlatformAdmin: false,
  });
  if (!policy.ok) {
    await interaction.reply({
      ephemeral: true,
      content: `Memory kind policy rejected this write (${policy.reason}).`,
    });
    return;
  }

  const client = createAdminApiClientForInteraction(interaction);
  const result = await client.writeMemory({
    scopeType: "user",
    scopeId: userId,
    kind: "profile_summary",
    source: "discord",
    content,
  });

  if (!result.ok) {
    await interaction.reply({
      ephemeral: true,
      content: `admin-api error: ${describeAdminApiError(result.error)}`,
    });
    return;
  }

  await interaction.reply({ ephemeral: true, content: "Saved profile_summary memory." });
}

