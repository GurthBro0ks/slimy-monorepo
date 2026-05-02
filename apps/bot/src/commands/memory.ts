import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

const rememberCommand = require("./memory/remember.js");
const forgetCommand = require("./memory/forget.js");
const exportCommand = require("./memory/export.js");
const consentCommand = require("./memory/consent.js");

function withConsentOptions(
  interaction: ChatInputCommandInteraction,
): ChatInputCommandInteraction {
  const action = interaction.options.getString("action", true);
  const originalOptions = interaction.options;
  const wrappedOptions = new Proxy(originalOptions, {
    get(target, prop, receiver) {
      if (prop === "getSubcommand") return (): string => (action === "status" ? "status" : "set");
      if (prop === "getBoolean") {
        return (name: string): boolean | null => {
          if (name !== "allow") return originalOptions.getBoolean(name);
          if (action === "grant") return true;
          if (action === "revoke") return false;
          return null;
        };
      }
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
    .setName("memory")
    .setDescription("Manage your AI memory — remember, forget, export, and consent")
    .addSubcommand((sub) =>
      sub
        .setName("remember")
        .setDescription("Save a memory")
        .addStringOption((o) =>
          o.setName("note").setDescription("What should I remember?").setRequired(true),
        )
        .addStringOption((o) =>
          o.setName("tags").setDescription("Optional tags (comma-separated)").setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("forget")
        .setDescription("Delete memories")
        .addStringOption((o) =>
          o
            .setName("id")
            .setDescription('Memory ID to delete (use /memory export to see IDs), or "ALL" to delete everything')
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName("export").setDescription("Export your memories (latest 25)"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("consent")
        .setDescription("Manage memory consent")
        .addStringOption((o) =>
          o
            .setName("action")
            .setDescription("Consent action")
            .addChoices(
              { name: "Grant", value: "grant" },
              { name: "Revoke", value: "revoke" },
              { name: "Status", value: "status" },
            )
            .setRequired(true),
        ),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const subcommand = interaction.options.getSubcommand(true);

    if (subcommand === "remember") {
      return rememberCommand.execute(interaction);
    }
    if (subcommand === "forget") {
      return forgetCommand.execute(interaction);
    }
    if (subcommand === "export") {
      return exportCommand.execute(interaction);
    }
    if (subcommand === "consent") {
      return consentCommand.execute(withConsentOptions(interaction));
    }

    await interaction.reply({ content: "Unknown memory subcommand.", ephemeral: true });
  },
};
