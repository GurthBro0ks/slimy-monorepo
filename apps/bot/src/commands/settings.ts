import type { ChatInputCommandInteraction } from "discord.js";

import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

import { createAdminApiClientForInteraction } from "../lib/adminApi.js";

function normalizeOnOff(value: string): boolean | null {
  const v = String(value || "").trim().toLowerCase();
  if (v === "on") return true;
  if (v === "off") return false;
  return null;
}

function describeAdminApiError(error: unknown): string {
  if (!error) return "unknown_error";
  if (typeof error === "string") return error;
  if (typeof error === "object") {
    const e: any = error;
    return String(e.error || e.code || e.message || "unknown_error");
  }
  return String(error);
}

export const settingsCommand = new SlashCommandBuilder()
  .setName("settings")
  .setDescription("View/update your settings (v0.1)")
  .addSubcommand((sub) =>
    sub.setName("me").setDescription("Show your current user settings"),
  )
  .addSubcommand((sub) =>
    sub
      .setName("markdown")
      .setDescription("Enable/disable markdown formatting")
      .addStringOption((opt) =>
        opt
          .setName("state")
          .setDescription("on/off")
          .setRequired(true)
          .addChoices(
            { name: "on", value: "on" },
            { name: "off", value: "off" },
          ),
      ),
  )
  .addSubcommandGroup((group) =>
    group
      .setName("guild")
      .setDescription("Guild settings (requires Manage Guild)")
      .addSubcommand((sub) =>
        sub
          .setName("widget")
          .setDescription("Enable/disable the widget for this guild")
          .addStringOption((opt) =>
            opt
              .setName("state")
              .setDescription("on/off")
              .setRequired(true)
              .addChoices(
                { name: "on", value: "on" },
                { name: "off", value: "off" },
              ),
          ),
      ),
  );

export async function handleSettingsCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const subcommandGroup = interaction.options.getSubcommandGroup(false);
  const subcommand = interaction.options.getSubcommand(true);

  const client = createAdminApiClientForInteraction(interaction);
  const userId = interaction.user.id;

  if (!subcommandGroup && subcommand === "me") {
    const result = await client.getUserSettings(userId);
    if (!result.ok) {
      await interaction.reply({
        ephemeral: true,
        content: `admin-api error: ${describeAdminApiError(result.error)}`,
      });
      return;
    }

    const markdown = Boolean(result.data.settings?.prefs?.chat?.markdown);
    await interaction.reply({
      ephemeral: true,
      content: `Your settings:\n- markdown: ${markdown ? "on" : "off"}`,
    });
    return;
  }

  if (!subcommandGroup && subcommand === "markdown") {
    const state = normalizeOnOff(interaction.options.getString("state", true));
    if (state === null) {
      await interaction.reply({ ephemeral: true, content: "Invalid state; expected on/off." });
      return;
    }

    const result = await client.patchUserSettings(userId, {
      prefs: { chat: { markdown: state } },
    });
    if (!result.ok) {
      await interaction.reply({
        ephemeral: true,
        content: `admin-api error: ${describeAdminApiError(result.error)}`,
      });
      return;
    }

    await interaction.reply({
      ephemeral: true,
      content: `Updated: markdown is now ${state ? "on" : "off"}.`,
    });
    return;
  }

  if (subcommandGroup === "guild" && subcommand === "widget") {
    if (!interaction.guildId) {
      await interaction.reply({
        ephemeral: true,
        content: "This command must be used in a guild channel.",
      });
      return;
    }

    const perms = interaction.memberPermissions;
    const hasManage =
      Boolean(perms?.has(PermissionFlagsBits.ManageGuild)) ||
      Boolean(perms?.has(PermissionFlagsBits.Administrator));
    if (!hasManage) {
      await interaction.reply({
        ephemeral: true,
        content: "Forbidden: requires Manage Guild (or Administrator).",
      });
      return;
    }

    const state = normalizeOnOff(interaction.options.getString("state", true));
    if (state === null) {
      await interaction.reply({ ephemeral: true, content: "Invalid state; expected on/off." });
      return;
    }

    const result = await client.patchGuildSettings(interaction.guildId, {
      prefs: { widget: { enabled: state } },
    });
    if (!result.ok) {
      await interaction.reply({
        ephemeral: true,
        content: `admin-api error: ${describeAdminApiError(result.error)}`,
      });
      return;
    }

    await interaction.reply({
      ephemeral: true,
      content: `Updated guild widget: ${state ? "enabled" : "disabled"}.`,
    });
    return;
  }

  await interaction.reply({ ephemeral: true, content: "Unknown settings subcommand." });
}

