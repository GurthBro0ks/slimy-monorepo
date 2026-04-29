import {
  ChannelType,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";

const readChannelCommand = require("./read/channel.js");
const readThreadCommand = require("./read/thread.js");
const readUserCommand = require("./read/user.js");

const MAX_LIMIT = 10000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("read")
    .setDescription("Read and export Discord channel, thread, or user message history")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand((sub) =>
      sub
        .setName("channel")
        .setDescription("Export a Discord channel or thread to an Obsidian-ready Markdown file")
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("Channel or thread to export (defaults to current channel)")
            .addChannelTypes(
              ChannelType.GuildText,
              ChannelType.PublicThread,
              ChannelType.PrivateThread,
              ChannelType.AnnouncementThread,
              ChannelType.GuildAnnouncement,
            )
            .setRequired(false),
        )
        .addIntegerOption((opt) =>
          opt
            .setName("limit")
            .setDescription("Max messages to export; 0 means all up to 10000")
            .setMinValue(0)
            .setMaxValue(MAX_LIMIT)
            .setRequired(false),
        )
        .addBooleanOption((opt) =>
          opt
            .setName("include_attachments")
            .setDescription("Include attachment links (default: true)")
            .setRequired(false),
        )
        .addBooleanOption((opt) =>
          opt
            .setName("include_embeds")
            .setDescription("Include embed titles and links (default: true)")
            .setRequired(false),
        )
        .addBooleanOption((opt) =>
          opt
            .setName("include_threads")
            .setDescription("Also export all threads as separate files")
            .setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("thread")
        .setDescription("Export a Discord thread to an Obsidian-ready Markdown file")
        .addChannelOption((opt) =>
          opt
            .setName("thread")
            .setDescription("Thread to export (defaults to current thread)")
            .addChannelTypes(
              ChannelType.PublicThread,
              ChannelType.PrivateThread,
              ChannelType.AnnouncementThread,
            )
            .setRequired(false),
        )
        .addIntegerOption((opt) =>
          opt
            .setName("limit")
            .setDescription("Max messages to export; 0 means all up to 10000")
            .setMinValue(0)
            .setMaxValue(MAX_LIMIT)
            .setRequired(false),
        )
        .addBooleanOption((opt) =>
          opt
            .setName("include_attachments")
            .setDescription("Include attachment links (default: true)")
            .setRequired(false),
        )
        .addBooleanOption((opt) =>
          opt
            .setName("include_embeds")
            .setDescription("Include embed titles and links (default: true)")
            .setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("user")
        .setDescription("Export messages from a specific user in a channel to an Obsidian-ready Markdown file")
        .addUserOption((opt) =>
          opt
            .setName("user")
            .setDescription("The user whose messages to export")
            .setRequired(true),
        )
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("Channel to export from (defaults to current channel)")
            .addChannelTypes(
              ChannelType.GuildText,
              ChannelType.PublicThread,
              ChannelType.PrivateThread,
              ChannelType.AnnouncementThread,
              ChannelType.GuildAnnouncement,
            )
            .setRequired(false),
        )
        .addIntegerOption((opt) =>
          opt
            .setName("limit")
            .setDescription("Max messages to scan; 0 means all up to 10000")
            .setMinValue(0)
            .setMaxValue(MAX_LIMIT)
            .setRequired(false),
        )
        .addBooleanOption((opt) =>
          opt
            .setName("include_attachments")
            .setDescription("Include attachment links (default: true)")
            .setRequired(false),
        )
        .addBooleanOption((opt) =>
          opt
            .setName("include_embeds")
            .setDescription("Include embed titles and links (default: true)")
            .setRequired(false),
        ),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const subcommand = interaction.options.getSubcommand(true);

    if (subcommand === "channel") {
      return readChannelCommand.execute(interaction);
    }
    if (subcommand === "thread") {
      return readThreadCommand.execute(interaction);
    }
    if (subcommand === "user") {
      return readUserCommand.execute(interaction);
    }

    await interaction.reply({ content: "Unknown read subcommand.", ephemeral: true });
  },
};
