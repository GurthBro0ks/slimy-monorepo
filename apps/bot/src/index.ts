/**
 * Discord Bot Entry Point — Chunk 2: Infrastructure
 * Ported from /opt/slimy/app/index.js
 *
 * This module bootstraps:
 * - Discord.js Client with correct GatewayIntentBits
 * - Singleton lock (prevents double-start)
 * - Command registration system
 * - interactionCreate event handler (buttons, modals, chat input)
 * - Health server on port 3000
 * - Graceful SIGTERM/SIGINT shutdown
 */

import 'dotenv/config';
import http from 'http';
import fs from 'fs';
import path from 'path';

import {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  Events,
  MessageFlags,
  ChatInputCommandInteraction,
  ButtonInteraction,
  ModalSubmitInteraction,
  ContextMenuCommandInteraction,
} from 'discord.js';
import { database } from './lib/database.js';
import { logInfo, logWarn, logError } from './lib/logger.js';
import { startHealthServer, recordBotError } from './lib/health-server.js';

// ─── Global Bot Stats ────────────────────────────────────────────────────────

interface BotStats {
  startTime: number;
  errors: { count: number; lastError: string | null; lastErrorTime: number | null };
}

declare global {
  // eslint-disable-next-line no-var
  var botStats: BotStats | undefined;
  // eslint-disable-next-line no-var
  var client: Client | undefined;
}

globalThis.botStats = {
  startTime: Date.now(),
  errors: { count: 0, lastError: null, lastErrorTime: null },
};

// ─── Singleton Guard ─────────────────────────────────────────────────────────

const LOCK_FILE = path.join(__dirname, '.slimy-singleton.lock');

function removeLockFile(): void {
  try {
    fs.unlinkSync(LOCK_FILE);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.warn('[WARN] Failed to remove singleton lock:', (err as Error).message);
    }
  }
}

function ensureSingleInstance(): void {
  const cleanup = (): void => {
    removeLockFile();
  };

  const writeLock = (): void => {
    const fd = fs.openSync(LOCK_FILE, 'wx');
    fs.writeSync(fd, String(process.pid));
    fs.closeSync(fd);
  };

  try {
    writeLock();
  } catch (err) {
    const nodeErr = err as NodeJS.ErrnoException;
    if (nodeErr.code === 'EEXIST') {
      try {
        const existingPid = parseInt(fs.readFileSync(LOCK_FILE, 'utf8'), 10);
        if (existingPid && existingPid !== process.pid) {
          try {
            process.kill(existingPid, 0);
            console.error(
              `❌ Another slimy-bot instance is already running (pid ${existingPid}). Exiting.`,
            );
            process.exit(1);
          } catch (killErr) {
            const killNodeErr = killErr as NodeJS.ErrnoException;
            if (killNodeErr.code === 'ESRCH') {
              fs.unlinkSync(LOCK_FILE);
              return ensureSingleInstance();
            }
            console.error('[ERROR] Could not verify existing PID:', (killErr as Error).message);
            process.exit(1);
          }
        } else {
          fs.unlinkSync(LOCK_FILE);
          return ensureSingleInstance();
        }
      } catch (readErr) {
        console.warn('[WARN] Corrupt singleton lock detected, resetting:', (readErr as Error).message);
        try {
          fs.unlinkSync(LOCK_FILE);
        } catch (unlinkErr) {
          console.error('[ERROR] Failed to reset singleton lock:', (unlinkErr as Error).message);
          process.exit(1);
        }
        return ensureSingleInstance();
      }
    } else {
      console.error('[ERROR] Unable to create singleton lock:', (err as Error).message);
      process.exit(1);
    }
  }

  process.once('exit', cleanup);
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
    process.once(signal, () => {
      cleanup();
      process.exit(0);
    });
  }
  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    if (globalThis.botStats) recordBotError(err);
    cleanup();
    process.exit(1);
  });
}

ensureSingleInstance();

// ─── Database Init ────────────────────────────────────────────────────────────

database.initialize();

// ─── Health Server ────────────────────────────────────────────────────────────

let healthServer: http.Server | null = null;
try {
  healthServer = startHealthServer();
  logInfo('Health check server started successfully');
} catch (err) {
  logError('Failed to start health server', err as Error);
}

// ─── Discord Client ───────────────────────────────────────────────────────────

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel],
});

globalThis.client = client;

// ─── Command Loader ───────────────────────────────────────────────────────────

interface DiscordCommand {
  data?: { name: string };
  execute?(interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction): Promise<void>;
  handleButton?(interaction: ButtonInteraction): Promise<void>;
  handleModal?(interaction: ModalSubmitInteraction): Promise<void>;
}

interface ClientWithCommands extends Client {
  commands: Collection<string, DiscordCommand>;
}

(client as ClientWithCommands).commands = new Collection<string, DiscordCommand>();

const commandsDir = path.join(__dirname, 'commands');

if (fs.existsSync(commandsDir)) {
  const files = fs.readdirSync(commandsDir).filter((f) => f.endsWith('.js') && !f.endsWith('.d.ts'));
  for (const file of files) {
    const fp = path.join(commandsDir, file);
    try {
      const cmd = require(fp) as DiscordCommand;
      const cmdData = cmd?.data ?? (cmd as any)?.default?.data;
      const cmdExecute = cmd?.execute ?? (cmd as any)?.default?.execute;
      if (cmdData && cmdExecute) {
        (client as ClientWithCommands).commands.set(cmdData.name, cmd);
        console.log(`✅ Loaded command: ${cmdData.name}`);
      } else if (cmd && (cmd as Record<string, unknown>).registerSubcommand) {
        continue;
      } else {
        console.warn(`[WARN] Skipping ${file}: missing data/execute`);
      }
    } catch (err) {
      console.error(`[ERROR] Failed to load ${file}:`, (err as Error).message);
    }
  }
} else {
  console.warn('[WARN] ./commands directory not found');
}

// ─── Ready Handler ───────────────────────────────────────────────────────────

client.once(Events.ClientReady, async (c) => {
  console.log(`✅ Logged in as ${c.user.tag}`);
  console.log(`📡 Connected to ${c.guilds.cache.size} server(s)`);

  // Load mode cache from DB (requires lib/mode-store — Chunk 5)
  try {
    const modeStore = require('./lib/mode-store.js');
    if (typeof modeStore.loadGuildModesIntoCache === 'function') {
      await modeStore.loadGuildModesIntoCache(client);
      console.log('[mode] cache primed from database');
    }
  } catch {
    console.warn('[mode] cache not primed: module not available (Chunk 5)');
  }

  // Schedule daily farming summary (requires commands/farming — Chunk 4)
  try {
    const farming = require('./commands/farming.js');
    const farmingChannelId = process.env.FARMING_CHANNEL;
    if (farming?.postDailySummary && farmingChannelId) {
      setInterval(async () => {
        const now = new Date();
        if (now.getUTCHours() === 8 && now.getUTCMinutes() < 5) {
          try {
            const channel = await client.channels.fetch(farmingChannelId);
            if (channel) {
              await farming.postDailySummary(channel);
              console.log('[farming] Daily summary posted');
            }
          } catch (e) {
            console.error('[farming] Daily summary failed:', (e as Error).message);
          }
        }
      }, 5 * 60 * 1000);
      console.log('[farming] Daily summary scheduled for 8:00 AM UTC');
    }
  } catch {
    // farming module not available yet
  }
});

// ─── Interaction Handler ──────────────────────────────────────────────────────

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isButton()) {
      const [namespace] = String(interaction.customId || '').split(':');
      const handler = namespace ? (client as ClientWithCommands).commands.get(namespace) : null;
      if (handler?.handleButton) {
        await handler.handleButton(interaction);
      }
      return;
    }

    if (interaction.isModalSubmit()) {
      const [namespace] = String(interaction.customId || '').split(':');
      const handler = namespace ? (client as ClientWithCommands).commands.get(namespace) : null;
      if (handler?.handleModal) {
        await handler.handleModal(interaction);
      }
      return;
    }

    if (interaction.isContextMenuCommand()) {
      const ctxInteraction = interaction as ContextMenuCommandInteraction;
      logInfo('Context menu command invoked', {
        commandName: ctxInteraction.commandName,
        commandsLoaded: Array.from((client as ClientWithCommands).commands.keys()).join(','),
      });
      const command = (client as ClientWithCommands).commands.get(ctxInteraction.commandName);
      if (!command) {
        console.warn('Context menu command lookup failed', {
          commandName: ctxInteraction.commandName,
          knownCommands: Array.from((client as ClientWithCommands).commands.keys()),
        });
        await ctxInteraction
          .reply({ content: '❌ Unknown command.', flags: MessageFlags.Ephemeral })
          .catch(() => {});
        return;
      }
      await command.execute!(ctxInteraction);
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    const chatInteraction = interaction as ChatInputCommandInteraction;

    logInfo('Slash command invoked', {
      commandName: chatInteraction.commandName,
      commandsLoaded: Array.from((client as ClientWithCommands).commands.keys()).join(','),
    });

    const command = (client as ClientWithCommands).commands.get(chatInteraction.commandName);
    if (!command) {
      console.warn('Slash command lookup failed', {
        commandName: chatInteraction.commandName,
        knownCommands: Array.from((client as ClientWithCommands).commands.keys()),
      });
      await chatInteraction
        .reply({ content: '❌ Unknown command.', flags: MessageFlags.Ephemeral })
        .catch(() => {});
      return;
    }

    await command.execute!(chatInteraction);
  } catch (err) {
    const chatInteraction = interaction as ChatInputCommandInteraction;
    const commandName = chatInteraction.commandName || 'unknown';
    console.error('Command error:', err);
    recordBotError(err);

    try {
      if (chatInteraction.deferred) {
        await chatInteraction.editReply('❌ Command failed.');
      } else if (chatInteraction.replied) {
        await chatInteraction.followUp({
          content: '❌ Command failed.',
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await chatInteraction.reply({
          content: '❌ Command failed.',
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (innerErr) {
      console.error('Could not send error message:', (innerErr as Error).message);
      recordBotError(innerErr);
    }
  }
});

// ─── Mention Handler (graceful) ───────────────────────────────────────────────

try {
  const mentionHandlerPath = path.join(__dirname, 'handlers', 'mention.js');
  if (fs.existsSync(mentionHandlerPath)) {
    const { attachMentionHandler } = require('./handlers/mention.js');
    if (typeof attachMentionHandler === 'function') {
      attachMentionHandler(client);
      console.log('✅ Mention handler attached');
    }
  }
} catch (err) {
  console.warn('[WARN] Mention handler not loaded:', (err as Error).message);
}

// ─── Snail Auto-Detect Handler (graceful) ─────────────────────────────────────

try {
  const snailHandlerPath = path.join(__dirname, 'handlers', 'snail-auto-detect.js');
  if (fs.existsSync(snailHandlerPath)) {
    const { attachSnailAutoDetect } = require('./handlers/snail-auto-detect.js');
    if (typeof attachSnailAutoDetect === 'function') {
      attachSnailAutoDetect(client);
      console.log('✅ Snail auto-detect handler attached');
    }
  }
} catch (err) {
  console.warn('[WARN] Snail auto-detect handler not loaded:', (err as Error).message);
}

// ─── Global Error Handlers ────────────────────────────────────────────────────

process.on('unhandledRejection', (reason) => {
  logError('Unhandled Promise Rejection', reason instanceof Error ? reason : new Error(String(reason)));
});

process.on('uncaughtException', (error) => {
  logError('Uncaught Exception', error);
  process.exit(1);
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

const shutdown = async (signal: string): Promise<void> => {
  logInfo(`${signal} received, shutting down gracefully...`);

  if (healthServer) {
    try {
      await new Promise<void>((resolve) => {
        healthServer!.close(() => {
          console.log('Health server closed');
          resolve();
        });
      });
    } catch (err) {
      logError('Error closing health server', err as Error);
    }
  }

  try {
    await database.close();
    logInfo('Database connections closed');
  } catch (err) {
    logError('Error closing database', err as Error);
  }

  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ─── Login ───────────────────────────────────────────────────────────────────

logInfo('Starting Slimy.AI bot...');

if (!process.env.DISCORD_TOKEN) {
  logWarn('DISCORD_TOKEN not set in environment, skipping Discord login.');
  console.warn('❌ DISCORD_TOKEN not set in environment. Skipping Discord login.');
} else {
  client.login(process.env.DISCORD_TOKEN).catch((err) => {
    logError('Discord login failed', err);
  });
}
