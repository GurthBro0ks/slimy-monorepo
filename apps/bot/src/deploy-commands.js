"use strict";

require("dotenv").config();
const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");

const commands = [];
const commandsPath = path.join(__dirname, "commands");

// Check if commands directory exists
if (!fs.existsSync(commandsPath)) {
  console.error(`❌ Commands directory not found at: ${commandsPath}`);
  process.exit(1);
}

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

// Load all command files
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  if ("data" in command && "execute" in command) {
    commands.push(command.data.toJSON());
    console.log(`✅ Loaded command: ${command.data.name}`);
  } else {
    console.warn(`⚠️  Skipping ${file}: missing 'data' or 'execute' property`);
  }
}

// Validate environment variables
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;

if (!token) {
  console.error("❌ DISCORD_TOKEN is not set in environment variables");
  process.exit(1);
}

if (!clientId) {
  console.error("❌ DISCORD_CLIENT_ID is not set in environment variables");
  process.exit(1);
}

// Create REST client
const rest = new REST({ version: "10" }).setToken(token);

// Deploy commands
(async () => {
  try {
    console.log(`\n🚀 Started refreshing ${commands.length} application (/) commands.`);

    // Register commands globally
    // Note: Global commands can take up to 1 hour to update
    // For faster testing, use guild-specific commands instead:
    // Routes.applicationGuildCommands(clientId, guildId)
    const data = await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands }
    );

    console.log(`✅ Successfully reloaded ${data.length} application (/) commands globally.`);
    console.log("\nRegistered commands:");
    for (const cmd of data) {
      console.log(`  • /${cmd.name} - ${cmd.description}`);
    }

  } catch (error) {
    console.error("❌ Error deploying commands:", error);
    process.exit(1);
  }
})();
