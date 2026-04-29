import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";

const diagCommand = require("./admin/diag.js");
const statsCommand = require("./admin/stats.js");
const usageCommand = require("./admin/usage.js");
const personalityCommand = require("./admin/personality.js");

function withPersonalityOptions(
  interaction: ChatInputCommandInteraction,
): ChatInputCommandInteraction {
  const action = interaction.options.getString("action", true);
  const originalOptions = interaction.options;
  const wrappedOptions = new Proxy(originalOptions, {
    get(target, prop, receiver) {
      if (prop === "getSubcommand") return (): string => action;
      const value = Reflect.get(target, prop, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });

  return new Proxy(interaction, {
    get(target, prop, receiver) {
      if (prop === "options") return wrappedOptions;
      const value = Reflect.get(target, prop, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    },
  }) as ChatInputCommandInteraction;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("admin")
    .setDescription("Bot administration — diagnostics, usage, stats, and personality")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false)
    .addSubcommand((sub) =>
      sub.setName("diag").setDescription("Run bot diagnostics"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("stats")
        .setDescription("View bot usage statistics")
        .addUserOption((option) =>
          option.setName("user").setDescription("User to view stats for").setRequired(false),
        )
        .addStringOption((option) =>
          option
            .setName("period")
            .setDescription("Time period for stats")
            .addChoices(
              { name: "7 days", value: "7d" },
              { name: "30 days", value: "30d" },
              { name: "90 days", value: "90d" },
              { name: "1 year", value: "1y" },
            )
            .setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("usage")
        .setDescription("View API cost and usage report")
        .addStringOption((option) =>
          option
            .setName("window")
            .setDescription("Time window for usage stats")
            .addChoices(
              { name: "Today", value: "today" },
              { name: "Last 7 days", value: "7d" },
              { name: "Last 30 days", value: "30d" },
              { name: "This month", value: "this_month" },
              { name: "Custom range", value: "custom" },
            )
            .setRequired(false),
        )
        .addStringOption((option) =>
          option.setName("start").setDescription("Start date (YYYY-MM-DD) for custom window").setRequired(false),
        )
        .addStringOption((option) =>
          option.setName("end").setDescription("End date (YYYY-MM-DD) for custom window").setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("personality")
        .setDescription("Configure bot personality and system prompts")
        .addStringOption((option) =>
          option
            .setName("action")
            .setDescription("Personality action")
            .addChoices(
              { name: "View", value: "view" },
              { name: "Test", value: "test" },
              { name: "Analytics", value: "analytics" },
              { name: "Adjust", value: "adjust" },
            )
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("parameter")
            .setDescription("Parameter to adjust")
            .addChoices(
              { name: "Catchphrase Frequency", value: "catchphrase_freq" },
              { name: "Enthusiasm Level", value: "enthusiasm" },
              { name: "Technical Depth", value: "technical_depth" },
              { name: "Formality Level", value: "formality" },
            )
            .setRequired(false),
        )
        .addIntegerOption((option) =>
          option
            .setName("value")
            .setDescription("New value (1-10 scale)")
            .setMinValue(1)
            .setMaxValue(10)
            .setRequired(false),
        ),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const subcommand = interaction.options.getSubcommand(true);

    if (subcommand === "diag") {
      return diagCommand.execute(interaction);
    }
    if (subcommand === "stats") {
      return statsCommand.execute(interaction);
    }
    if (subcommand === "usage") {
      return usageCommand.execute(interaction);
    }
    if (subcommand === "personality") {
      return personalityCommand.execute(withPersonalityOptions(interaction));
    }

    await interaction.reply({ content: "Unknown admin subcommand.", ephemeral: true });
  },
};
