import {
  ButtonInteraction,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";

const adminCommand = require("./club/admin.js");
const aliasCommand = require("./club/alias.js");
const alertsCommand = require("./club/alerts.js");
const exportCommand = require("./club/export.js");
const statsCommand = require("./club/stats.js");
const leaderboardCommand = require("./club/leaderboard.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("club")
    .setDescription("Club management — admin, aliases, alerts, and roster views")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false)
    .addSubcommandGroup((group) =>
      group
        .setName("admin")
        .setDescription("Club admin panel")
        .addSubcommand((sub) =>
          sub
            .setName("aliases")
            .setDescription("View club member aliases")
            .addStringOption((opt) =>
              opt
                .setName("action")
                .setDescription("Action")
                .setRequired(false)
                .addChoices({ name: "View", value: "view" }),
            ),
        )
        .addSubcommand((sub) =>
          sub
            .setName("stats")
            .setDescription("Show club stats summary")
            .addStringOption((opt) =>
              opt.setName("url").setDescription("Google Sheets URL").setRequired(false),
            )
            .addBooleanOption((opt) =>
              opt.setName("clear").setDescription("Clear settings").setRequired(false),
            ),
        )
        .addSubcommand((sub) =>
          sub
            .setName("correct")
            .setDescription("Add a manual power correction")
            .addStringOption((opt) =>
              opt.setName("member").setDescription("Member name or @mention").setRequired(true),
            )
            .addStringOption((opt) =>
              opt
                .setName("metric")
                .setDescription("Metric")
                .setRequired(true)
                .addChoices(
                  { name: "Total Power", value: "total" },
                  { name: "Sim Power", value: "sim" },
                ),
            )
            .addStringOption((opt) =>
              opt.setName("value").setDescription("Power value (e.g. 1.5M)").setRequired(true),
            )
            .addStringOption((opt) =>
              opt.setName("week").setDescription("Week ID (auto for current)").setRequired(false),
            )
            .addStringOption((opt) =>
              opt.setName("reason").setDescription("Reason for correction").setRequired(false),
            ),
        )
        .addSubcommand((sub) =>
          sub.setName("rollback").setDescription("Rollback to previous snapshot"),
        )
        .addSubcommand((sub) =>
          sub.setName("export").setDescription("Export club data to CSV"),
        ),
    )
    .addSubcommandGroup((group) =>
      group
        .setName("alias")
        .setDescription("Manage OCR name aliases")
        .addSubcommand((sub) =>
          sub
            .setName("add")
            .setDescription("Add an alias for an existing club member")
            .addStringOption((opt) =>
              opt.setName("alias").setDescription("The alternate name (e.g. OCR variant)").setRequired(true),
            )
            .addStringOption((opt) =>
              opt.setName("canonical").setDescription("The real member name in the database").setRequired(true),
            ),
        )
        .addSubcommand((sub) =>
          sub.setName("list").setDescription("List all aliases for this guild"),
        )
        .addSubcommand((sub) =>
          sub
            .setName("remove")
            .setDescription("Remove an alias")
            .addStringOption((opt) =>
              opt.setName("alias").setDescription("The alias to remove").setRequired(true),
            ),
        ),
    )
    .addSubcommandGroup((group) =>
      group
        .setName("alerts")
        .setDescription("Club member change alerts")
        .addSubcommand((sub) =>
          sub.setName("status").setDescription("Show alert system status"),
        )
        .addSubcommand((sub) =>
          sub.setName("check").setDescription("Force an immediate alert check"),
        ),
    )
    .addSubcommandGroup((group) =>
      group
        .setName("view")
        .setDescription("View club data and rankings")
        .addSubcommand((sub) =>
          sub
            .setName("stats")
            .setDescription("Show paginated club roster sorted by power")
            .addStringOption((option) =>
              option
                .setName("metric")
                .setDescription("Sort column")
                .setRequired(false)
                .addChoices(
                  { name: "Total Power", value: "total" },
                  { name: "Sim Power", value: "sim" },
                ),
            )
            .addStringOption((option) =>
              option
                .setName("format")
                .setDescription("Embed (default) or CSV export")
                .setRequired(false)
                .addChoices(
                  { name: "Embed", value: "embed" },
                  { name: "CSV", value: "csv" },
                ),
            ),
        )
        .addSubcommand((sub) =>
          sub
            .setName("leaderboard")
            .setDescription("View club power rankings for this server")
            .addIntegerOption((option) =>
              option
                .setName("limit")
                .setDescription("Number of members to show (default: 10)")
                .setMinValue(5)
                .setMaxValue(25)
                .setRequired(false),
            ),
        )
        .addSubcommand((sub) =>
          sub.setName("export").setDescription("Export club roster as a CSV file attachment"),
        ),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const group = interaction.options.getSubcommandGroup(true);
    const subcommand = interaction.options.getSubcommand(true);

    if (group === "admin") {
      return adminCommand.execute(interaction);
    }
    if (group === "alias") {
      return aliasCommand.execute(interaction);
    }
    if (group === "alerts") {
      return alertsCommand.execute(interaction);
    }
    if (group === "view" && subcommand === "stats") {
      return statsCommand.execute(interaction);
    }
    if (group === "view" && subcommand === "leaderboard") {
      return leaderboardCommand.execute(interaction);
    }
    if (group === "view" && subcommand === "export") {
      return exportCommand.execute(interaction);
    }

    await interaction.reply({ content: "Unknown club subcommand.", ephemeral: true });
  },

  async handleButton(interaction: ButtonInteraction): Promise<void> {
    if (statsCommand.handleButton) {
      return statsCommand.handleButton(interaction);
    }
  },
};
