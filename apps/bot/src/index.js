"use strict";

require("dotenv").config();
const { Client, Collection, Events, GatewayIntentBits } = require("discord.js");
const fs = require("fs");
const path = require("path");
const database = require("./lib/database");

// Validate environment variables
if (!process.env.DISCORD_TOKEN) {
  console.error("❌ DISCORD_TOKEN is not set in environment variables");
  process.exit(1);
}

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
  ],
});

// Load commands
client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");

if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
      console.log(`✅ Loaded command: ${command.data.name}`);
    } else {
      console.warn(`⚠️  Skipping ${file}: missing 'data' or 'execute' property`);
    }
  }
} else {
  console.warn(`⚠️  Commands directory not found at: ${commandsPath}`);
}

// Event: Bot is ready
client.once(Events.ClientReady, async (readyClient) => {
  console.log(`✅ Logged in as ${readyClient.user.tag}`);
  console.log(`📊 Serving ${readyClient.guilds.cache.size} guild(s)`);

  // Initialize database connection
  try {
    await database.initialize();
  } catch (error) {
    console.error("⚠️  Failed to initialize database:", error.message);
    console.log("Bot will continue running, but database-dependent commands may fail.");
  }
});

// Event: Handle slash command interactions
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`❌ No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    console.log(`🔹 Executing command: /${interaction.commandName} in guild: ${interaction.guildId || "DM"}`);
    await command.execute(interaction);
  } catch (error) {
    console.error(`❌ Error executing command ${interaction.commandName}:`, error);

    const errorMessage = "❌ There was an error while executing this command!";

    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } catch (replyError) {
      console.error("Failed to send error message to user:", replyError);
    }
  }
});

// Event: Handle errors
client.on(Events.Error, (error) => {
  console.error("Discord client error:", error);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n⏹️  Shutting down bot...");
  await database.close();
  client.destroy();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n⏹️  Shutting down bot...");
  await database.close();
  client.destroy();
  process.exit(0);
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN).catch((error) => {
  console.error("❌ Failed to login to Discord:", error);
  process.exit(1);
});
