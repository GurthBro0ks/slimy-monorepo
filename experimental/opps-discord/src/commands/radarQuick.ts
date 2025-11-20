/**
 * Discord command handler for /radar-quick
 *
 * This is a stub implementation ready to be integrated into the actual Discord bot.
 * It fetches a quick radar scan and formats it for Discord.
 */

import { fetchRadarSnapshot } from '../apiClient.js';
import type { RadarSnapshot, ScoredOpportunity } from '../types.js';

/**
 * Context interface for Discord command execution
 * This abstraction allows the handler to work with any Discord library
 */
export interface RadarCommandContext {
  /** Discord user ID of the command invoker */
  userId: string;
  /** Optional username for personalization */
  userName?: string;
  /** Function to send a plain text reply */
  reply: (content: string) => Promise<void>;
  /** Optional function to send an embed reply (richer formatting) */
  replyEmbed?: (embed: {
    title: string;
    description: string;
    fields?: { name: string; value: string; inline?: boolean }[];
    color?: number;
  }) => Promise<void>;
}

/**
 * Format a radar snapshot into a Discord-friendly text message
 */
function formatRadarText(snapshot: RadarSnapshot): string {
  const lines: string[] = [];

  lines.push(`📡 **Quick Radar Scan**`);
  lines.push(`Found ${snapshot.summary.totalOpportunities} opportunities across ${snapshot.summary.domainCount} domains`);
  lines.push('');

  const domainEmojis: Record<string, string> = {
    markets: '💰',
    trends: '📈',
    'class-actions': '⚖️',
    freebies: '🎁',
  };

  for (const [domain, opportunities] of Object.entries(snapshot.domains)) {
    if (opportunities.length === 0) continue;

    const emoji = domainEmojis[domain] || '•';
    lines.push(`${emoji} **${domain.toUpperCase()}** (${opportunities.length})`);

    for (const opp of opportunities.slice(0, 3)) {
      const score = `[${opp.score.toFixed(1)}]`;
      const title = opp.title.length > 60 ? opp.title.substring(0, 57) + '...' : opp.title;
      lines.push(`  ${score} ${title}`);

      // Add metadata if available
      const metaParts: string[] = [];
      if (opp.metadata.category) metaParts.push(opp.metadata.category);
      if (opp.metadata.amount) metaParts.push(opp.metadata.amount);
      if (opp.metadata.deadline) metaParts.push(`Due: ${opp.metadata.deadline}`);

      if (metaParts.length > 0) {
        lines.push(`    ${metaParts.join(' • ')}`);
      }
    }

    if (opportunities.length > 3) {
      lines.push(`  _...and ${opportunities.length - 3} more_`);
    }
    lines.push('');
  }

  // Keep total under Discord's 2000 character limit (with safety margin)
  const fullText = lines.join('\n');
  if (fullText.length > 1900) {
    return fullText.substring(0, 1897) + '...';
  }

  return fullText;
}

/**
 * Main command handler for /radar-quick
 */
export async function handleRadarQuick(ctx: RadarCommandContext): Promise<void> {
  try {
    // Fetch quick radar snapshot with limited results per domain
    const snapshot = await fetchRadarSnapshot({
      mode: 'quick',
      maxPerDomain: 3,
      discordUserId: ctx.userId,
    });

    // Format and send the response
    const message = formatRadarText(snapshot);

    if (ctx.replyEmbed) {
      // Use rich embed if available
      await ctx.replyEmbed({
        title: '📡 Quick Radar Scan',
        description: message,
        color: 0x5865F2, // Discord blurple
      });
    } else {
      // Fallback to plain text
      await ctx.reply(message);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Check if this is a connection error
    if (errorMessage.includes('fetch') || errorMessage.includes('ECONNREFUSED')) {
      await ctx.reply(
        '⚠️ The radar engine is currently unavailable. Please try again later or contact support.'
      );
    } else {
      await ctx.reply(
        `❌ Failed to fetch radar data: ${errorMessage}`
      );
    }
  }
}
