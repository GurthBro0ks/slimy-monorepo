/**
 * Health/Debug command for bot diagnostics
 * Provides uptime, environment info, and version details
 */

import { Client, Message, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { logInfo } from '../lib/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let botVersion = '0.1.0';
try {
  const packageJson = JSON.parse(
    readFileSync(join(__dirname, '../../package.json'), 'utf-8')
  );
  botVersion = packageJson.version;
} catch {
  // Use default version if package.json can't be read
}

/**
 * Format uptime in a human-readable format
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

/**
 * Handle the !bothealth command
 */
export async function handleHealthCommand(
  message: Message,
  client: Client
): Promise<void> {
  // TODO: Add guild admin check when role system is implemented
  // For now, we'll allow anyone to use this command

  const uptime = process.uptime();
  const nodeEnv = process.env.NODE_ENV || 'development';
  const memoryUsage = process.memoryUsage();
  const memoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);

  const embed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle('🤖 Bot Health Status')
    .addFields(
      { name: 'Status', value: '✅ Online', inline: true },
      { name: 'Uptime', value: formatUptime(uptime), inline: true },
      { name: 'Version', value: botVersion, inline: true },
      { name: 'Environment', value: nodeEnv, inline: true },
      { name: 'Memory Usage', value: `${memoryMB} MB`, inline: true },
      { name: 'Node.js', value: process.version, inline: true },
      {
        name: 'Guilds',
        value: client.guilds.cache.size.toString(),
        inline: true,
      },
      {
        name: 'Ping',
        value: `${Math.round(client.ws.ping)}ms`,
        inline: true,
      }
    )
    .setTimestamp();

  await message.reply({ embeds: [embed] });

  logInfo('Health command executed', {
    guildId: message.guild?.id || 'DM',
    userId: message.author.id,
    channelId: message.channel.id,
  });
}

/**
 * Check if a message is the health command
 */
export function isHealthCommand(message: Message): boolean {
  const content = message.content.trim().toLowerCase();
  return content === '!bothealth' || content === '!health';
}
