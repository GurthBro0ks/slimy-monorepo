/**
 * Channel/category mode management command.
 * Ported from /opt/slimy/app/commands/mode.js
 */

import {
  SlashCommandBuilder,
  ChannelType,
  ChatInputCommandInteraction,
  GuildChannel,
} from "discord.js";
import { setModes, viewModes, listModes, formatModeState } from "../lib/mode-store.js";
import { requireAdminRole } from "../utils/admin-role.js";

const MODE_PROFILES = [
  { key: "chat|personality|rating_pg13", label: "Chat · Personality · Rated PG-13" },
  { key: "chat|personality|rating_unrated", label: "Chat · Personality · Unrated" },
  { key: "chat|no_personality|rating_pg13", label: "Chat · No Personality · Rated PG-13" },
  { key: "chat|no_personality|rating_unrated", label: "Chat · No Personality · Unrated" },
  { key: "super_snail|personality|rating_pg13", label: "Super Snail · Personality · Rated PG-13" },
  { key: "super_snail|personality|rating_unrated", label: "Super Snail · Personality · Unrated" },
  { key: "super_snail|no_personality|rating_pg13", label: "Super Snail · No Personality · Rated PG-13" },
  { key: "super_snail|no_personality|rating_unrated", label: "Super Snail · No Personality · Unrated" },
];

const PROFILE_CHOICE_MAP = new Map(
  MODE_PROFILES.map((profile) => [profile.key, profile]),
);
PROFILE_CHOICE_MAP.set("clear", { key: "clear", label: "Clear all modes" });

const PROFILE_CHOICES = [
  ...MODE_PROFILES.map((profile) => ({
    name: profile.label,
    value: profile.key,
  })),
  { name: "Clear (remove all modes)", value: "clear" },
];

const LIST_FILTER_CHOICES = [
  { name: "All configurations", value: "all" },
  { name: "Chat enabled", value: "chat" },
  { name: "Super Snail enabled", value: "super_snail" },
  { name: "Personality enabled", value: "personality" },
  { name: "No Personality enabled", value: "no_personality" },
  { name: "Rated PG-13", value: "rating_pg13" },
  { name: "Unrated", value: "rating_unrated" },
];

interface TargetResult {
  target: GuildChannel | null;
  targetType: "channel" | "category" | "thread";
  parents: Array<{ targetId: string; targetType: string }>;
}

function _resolveTargetAndParents(
  interaction: ChatInputCommandInteraction,
): TargetResult {
  const channelOption = interaction.options.getChannel("channel");
  const categoryOption = interaction.options.getChannel("category");

  let target: GuildChannel | null = null;
  let targetType: "channel" | "category" | "thread" = "channel";
  const parents: Array<{ targetId: string; targetType: string }> = [];

  if (categoryOption) {
    target = categoryOption as GuildChannel;
    targetType = "category";
  } else if (channelOption) {
    target = channelOption as GuildChannel;
    const chan = channelOption as unknown as { isThread?: () => boolean; parentId?: string };
    if (chan.isThread?.()) {
      targetType = "thread";
      if (chan.parentId) {
        parents.push({ targetId: chan.parentId, targetType: "channel" });
        const parent = interaction.guild?.channels.cache.get(chan.parentId);
        if (parent?.parentId) {
          parents.push({ targetId: parent.parentId, targetType: "category" });
        }
      }
    } else {
      if (chan.parentId) {
        parents.push({ targetId: chan.parentId, targetType: "category" });
      }
    }
  } else if (interaction.channel) {
    target = interaction.channel as GuildChannel;
    const chan = interaction.channel as unknown as { isThread?: () => boolean; parentId?: string; parent?: { id: string } };
    if (chan.isThread?.()) {
      targetType = "thread";
      if (chan.parentId) {
        parents.push({ targetId: chan.parentId, targetType: "channel" });
      }
    } else {
      if (chan.parentId) {
        parents.push({ targetId: chan.parentId, targetType: "category" });
      }
    }
  }

  return { target, targetType, parents };
}

function formatTargetLabel(interaction: ChatInputCommandInteraction, type: string, id: string): string {
  if (type === "category") {
    const category = interaction.guild?.channels.cache.get(id);
    return category ? `category **${category.name}**` : `category ${id}`;
  }
  return `<#${id}>`;
}

async function handleSet(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const profileKey = interaction.options.getString("profile", true);
  const channelOption = interaction.options.getChannel("channel");
  const categoryOption = interaction.options.getChannel("category");

  let target: GuildChannel | null = null;
  let targetType: "channel" | "category" | "thread" = "channel";
  const parents: Array<{ targetId: string; targetType: string }> = [];

  if (categoryOption) {
    target = categoryOption as GuildChannel;
    targetType = "category";
  } else if (channelOption) {
    target = channelOption as GuildChannel;
    const chan = channelOption as unknown as { isThread?: () => boolean; parentId?: string; parent?: { id: string } };
    if (chan.isThread?.()) {
      targetType = "thread";
      if (chan.parentId) {
        parents.push({ targetId: chan.parentId, targetType: "channel" });
        const parent = interaction.guild?.channels.cache.get(chan.parentId);
        if (parent?.parentId) {
          parents.push({ targetId: parent.parentId, targetType: "category" });
        }
      }
    } else {
      if (chan.parentId) {
        parents.push({ targetId: chan.parentId, targetType: "category" });
      }
    }
  } else if (interaction.channel) {
    target = interaction.channel as GuildChannel;
    const chan = interaction.channel as unknown as { isThread?: () => boolean; parentId?: string; parent?: { id: string } };
    if (chan.isThread?.()) {
      targetType = "thread";
      if (chan.parentId) {
        parents.push({ targetId: chan.parentId, targetType: "channel" });
      }
    } else {
      if (chan.parentId) {
        parents.push({ targetId: chan.parentId, targetType: "category" });
      }
    }
  }

  if (!target) {
    await interaction.editReply({ content: "❌ Unable to resolve target channel." });
    return;
  }

  const profile = PROFILE_CHOICE_MAP.get(profileKey);
  if (!profile) {
    await interaction.editReply({ content: "❌ Unknown profile selected." });
    return;
  }

  if (profile.key === "clear") {
    await setModes({
      guildId: interaction.guildId!,
      targetId: target.id,
      targetType,
      modes: [],
      operation: "clear",
      actorHasManageGuild: true,
    });
    await interaction.editReply({
      content: `🧹 Cleared all modes for ${formatTargetLabel(interaction, targetType, target.id)}.`,
    });
    return;
  }

  const [primary, personality, rating] = profile.key.split("|");
  const modes = [primary, personality, rating];

  await setModes({
    guildId: interaction.guildId!,
    targetId: target.id,
    targetType,
    modes,
    operation: "replace",
    actorHasManageGuild: true,
  });

  const view = await viewModes({
    guildId: interaction.guildId!,
    targetId: target.id,
    targetType,
    parents,
  });

  const lines: string[] = [
    `📂 Applied **${profile.label}** to ${formatTargetLabel(interaction, targetType, target.id)}.`,
    "",
    `**Direct:** ${formatModeState(view.direct.modes)}`,
  ];

  if (view.inherited.length) {
    lines.push("");
    lines.push("**Inherited:**");
    for (const entry of view.inherited) {
      const [type, id] = entry.label.split(":");
      lines.push(
        `${formatTargetLabel(interaction, type, id)}: ${formatModeState(entry.modes)}`,
      );
    }
  } else {
    lines.push("");
    lines.push("**Inherited:** none");
  }

  lines.push("");
  lines.push(`**Effective:** ${formatModeState(view.effective.modes)}`);

  await interaction.editReply({ content: lines.join("\n") });
}

async function handleView(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const channelOption = interaction.options.getChannel("channel");

  let target: GuildChannel | null = null;
  let targetType: "channel" | "category" | "thread" = "channel";
  const parents: Array<{ targetId: string; targetType: string }> = [];

  if (channelOption) {
    target = channelOption as GuildChannel;
    const chan = channelOption as unknown as { isThread?: () => boolean; parentId?: string };
    if (chan.isThread?.()) {
      targetType = "thread";
      if (chan.parentId) {
        parents.push({ targetId: chan.parentId, targetType: "channel" });
      }
    } else {
      if (chan.parentId) {
        parents.push({ targetId: chan.parentId, targetType: "category" });
      }
    }
  } else if (interaction.channel) {
    target = interaction.channel as GuildChannel;
    const chan = interaction.channel as unknown as { isThread?: () => boolean; parentId?: string };
    if (chan.isThread?.()) {
      targetType = "thread";
      if (chan.parentId) {
        parents.push({ targetId: chan.parentId, targetType: "channel" });
      }
    } else {
      if (chan.parentId) {
        parents.push({ targetId: chan.parentId, targetType: "category" });
      }
    }
  }

  if (!target) {
    await interaction.editReply({ content: "❌ Unable to resolve target channel." });
    return;
  }

  const view = await viewModes({
    guildId: interaction.guildId!,
    targetId: target.id,
    targetType,
    parents,
  });

  const lines: string[] = [
    `📋 Mode configuration for ${formatTargetLabel(interaction, targetType, target.id)}`,
    "",
    `**Direct:** ${formatModeState(view.direct.modes)}`,
  ];

  if (view.inherited.length) {
    lines.push("");
    lines.push("**Inherited:**");
    for (const entry of view.inherited) {
      const [type, id] = entry.label.split(":");
      lines.push(
        `${formatTargetLabel(interaction, type, id)}: ${formatModeState(entry.modes)}`,
      );
    }
  } else {
    lines.push("");
    lines.push("**Inherited:** none");
  }

  lines.push("");
  lines.push(`**Effective:** ${formatModeState(view.effective.modes)}`);

  await interaction.editReply({ content: lines.join("\n") });
}

async function handleList(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });
  const filter = interaction.options.getString("filter") || "all";

  const presenceFilter = filter === "all" ? null : "has";
  const presenceMode = filter === "all" ? null : filter;

  const entries = await listModes({
    guildId: interaction.guildId!,
    scope: "guild",
    presenceMode,
    presenceFilter,
  });

  if (!entries.length) {
    await interaction.editReply({ content: "📭 No mode configurations found." });
    return;
  }

  const lines: string[] = [`📋 Mode configurations (${filter})`, ""];
  for (const entry of entries) {
    const [type, id] = entry.label.split(":");
    lines.push(`${formatTargetLabel(interaction, type, id)}`);
    lines.push(`  ${formatModeState(entry.modes)}`);
  }

  await interaction.editReply({ content: lines.join("\n") });
}

async function handleClear(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });
  const channelOption = interaction.options.getChannel("channel");

  let target: GuildChannel | null = null;
  let targetType: "channel" | "category" | "thread" = "channel";

  if (channelOption) {
    target = channelOption as GuildChannel;
  } else if (interaction.channel) {
    target = interaction.channel as GuildChannel;
  }

  if (!target) {
    await interaction.editReply({ content: "❌ Unable to resolve target channel." });
    return;
  }

  const chan = target as unknown as { isThread?: () => boolean; type?: ChannelType };
  if (chan.isThread?.()) {
    targetType = "thread";
  } else if (chan.type === ChannelType.GuildCategory) {
    targetType = "category";
  }

  await setModes({
    guildId: interaction.guildId!,
    targetId: target.id,
    targetType,
    modes: [],
    operation: "clear",
    actorHasManageGuild: true,
  });

  await interaction.editReply({
    content: `✅ All modes cleared from ${formatTargetLabel(interaction, targetType, target.id)}`,
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mode")
    .setDescription("[Admin] Manage slimy.ai modes")
    .addSubcommand((sub) =>
      sub
        .setName("set")
        .setDescription("Select a profile for this channel/category")
        .addStringOption((opt) =>
          opt
            .setName("profile")
            .setDescription("Mode profile")
            .setRequired(true)
            .addChoices(...PROFILE_CHOICES),
        )
        .addChannelOption((opt) =>
          opt.setName("channel").setDescription("Channel to modify (defaults to current)"),
        )
        .addChannelOption((opt) =>
          opt
            .setName("category")
            .setDescription("Category to modify (overrides channel)")
            .addChannelTypes(ChannelType.GuildCategory),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("view")
        .setDescription("View the active modes here")
        .addChannelOption((opt) =>
          opt.setName("channel").setDescription("Channel to inspect (defaults to current)"),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("list")
        .setDescription("List mode configurations in the guild")
        .addStringOption((opt) =>
          opt
            .setName("filter")
            .setDescription("Filter by mode presence")
            .addChoices(...LIST_FILTER_CHOICES),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("clear")
        .setDescription("Remove all modes from a channel/category")
        .addChannelOption((opt) =>
          opt.setName("channel").setDescription("Channel to clear (defaults to current)"),
        ),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      if (!(await requireAdminRole(interaction, "/mode"))) return;

      const sub = interaction.options.getSubcommand();
      if (sub === "set") return handleSet(interaction);
      if (sub === "view") return handleView(interaction);
      if (sub === "list") return handleList(interaction);
      if (sub === "clear") return handleClear(interaction);
      throw new Error("Unknown subcommand.");
    } catch (error) {
      console.error("Mode command error:", error);
      const message = error instanceof Error ? error.message : "Unexpected error.";
      try {
        await interaction.editReply({ content: `❌ ${message}` });
      } catch {
        await interaction.reply({ content: `❌ ${message}`, ephemeral: true });
      }
    }
  },
};
