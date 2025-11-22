/**
 * Discord Bot Entry Point
 * Initializes the bot and registers event handlers with crash safety
 */

import { Client, GatewayIntentBits, Events, Message } from 'discord.js';
import { logInfo, logWarn, logError } from './lib/logger.js';
import { safeHandler } from './lib/errorHandler.js';
import { handleHealthCommand, isHealthCommand } from './commands/health.js';

// Validate required environment variables
if (!process.env.DISCORD_BOT_TOKEN) {
  logError('DISCORD_BOT_TOKEN environment variable is required');
  process.exit(1);
}

// Create Discord client with necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

/**
 * Ready event handler
 * Fired when the bot successfully connects to Discord
 */
const handleReady = safeHandler(async () => {
  if (!client.user) return;

  logInfo('Bot is ready', {
    username: client.user.tag,
    guildCount: client.guilds.cache.size.toString(),
  });

  // Set bot presence
  client.user.setPresence({
    activities: [{ name: '!bothealth for status' }],
    status: 'online',
  });
}, 'ready-event');

/**
 * Message create event handler
 * Handles incoming messages and commands
 */
const handleMessageCreate = safeHandler(async (message: Message) => {
  // Ignore bot messages
  if (message.author.bot) return;

  // Handle health command
  if (isHealthCommand(message)) {
    await handleHealthCommand(message, client);
    return;
  }

  // TODO: Add more command handlers here
}, 'message-create-event');

/**
 * Error event handler
 * Catches Discord.js client errors
 */
const handleError = safeHandler(async (error: Error) => {
  logError('Discord client error', error);
}, 'client-error-event');

/**
 * Warning event handler
 * Logs Discord.js warnings
 */
const handleWarn = safeHandler(async (warning: string) => {
  logWarn('Discord client warning', { warning });
}, 'client-warn-event');

// Register event handlers
client.on(Events.ClientReady, handleReady);
client.on(Events.MessageCreate, handleMessageCreate);
client.on(Events.Error, handleError);
client.on(Events.Warn, handleWarn);

// Handle process-level errors
process.on('unhandledRejection', (error: Error) => {
  logError('Unhandled promise rejection', error);
});

process.on('uncaughtException', (error: Error) => {
  logError('Uncaught exception', error);
  // Exit on uncaught exception after logging
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  logInfo('Received SIGINT, shutting down gracefully');
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logInfo('Received SIGTERM, shutting down gracefully');
  client.destroy();
  process.exit(0);
});

// Login to Discord
logInfo('Starting bot', { env: process.env.NODE_ENV || 'development' });
client.login(process.env.DISCORD_BOT_TOKEN).catch((error) => {
  logError('Failed to login to Discord', error);
  process.exit(1);
});
