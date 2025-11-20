/**
 * Discord command handler for /radar-daily
 *
 * This is a stub implementation ready to be integrated into the actual Discord bot.
 * It fetches a comprehensive daily radar scan and formats it for Discord.
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
function formatRadarText(snapshot: RadarSnapshot, userName?: string): string {
  const lines: string[] = [];

  const greeting = userName ? `Hey ${userName}` : 'Hello';
  lines.push(`📅 **Daily Radar Summary**`);
  lines.push(`${greeting}! Here's your comprehensive daily scan:`);
  lines.push(`Found ${snapshot.summary.totalOpportunities} opportunities across ${snapshot.summary.domainCount} domains`);

  if (snapshot.summary.topScore > 0) {
    lines.push(`🌟 Top score: ${snapshot.summary.topScore.toFixed(1)}`);
  }
  lines.push('');

  const domainEmojis: Record<string, string> = {
    markets: '💰',
    trends: '📈',
    'class-actions': '⚖️',
    freebies: '🎁',
  };

  const domainNames: Record<string, string> = {
    markets: 'Markets',
    trends: 'Trends',
    'class-actions': 'Class Actions',
    freebies: 'Freebies',
  };

  for (const [domain, opportunities] of Object.entries(snapshot.domains)) {
    if (opportunities.length === 0) continue;

    const emoji = domainEmojis[domain] || '•';
    const displayName = domainNames[domain] || domain;
    lines.push(`${emoji} **${displayName}** (${opportunities.length})`);

    // Show up to 5 items for daily digest
    for (const opp of opportunities.slice(0, 5)) {
      const score = `[${opp.score.toFixed(1)}]`;
      const title = opp.title.length > 70 ? opp.title.substring(0, 67) + '...' : opp.title;
      lines.push(`  ${score} ${title}`);

      // Add rich metadata for daily digest
      const metaParts: string[] = [];
      if (opp.metadata.category) metaParts.push(opp.metadata.category);
      if (opp.metadata.amount) metaParts.push(opp.metadata.amount);
      if (opp.metadata.deadline) metaParts.push(`⏰ ${opp.metadata.deadline}`);
      if (opp.metadata.status) metaParts.push(`Status: ${opp.metadata.status}`);

      if (metaParts.length > 0) {
        lines.push(`    ${metaParts.join(' • ')}`);
      }
    }

    if (opportunities.length > 5) {
      lines.push(`  _...and ${opportunities.length - 5} more_`);
    }
    lines.push('');
  }

  lines.push(`_Scanned at ${new Date(snapshot.timestamp).toLocaleTimeString()}_`);

  // Keep total under Discord's 2000 character limit (with safety margin)
  const fullText = lines.join('\n');
  if (fullText.length > 1900) {
    return fullText.substring(0, 1897) + '...';
  }

  return fullText;
}

/**
 * Main command handler for /radar-daily
 */
export async function handleRadarDaily(ctx: RadarCommandContext): Promise<void> {
  try {
    // Fetch comprehensive daily radar snapshot with more results per domain
    const snapshot = await fetchRadarSnapshot({
      mode: 'daily',
      maxPerDomain: 5,
      discordUserId: ctx.userId,
    });

    // Format and send the response
    const message = formatRadarText(snapshot, ctx.userName);

    if (ctx.replyEmbed) {
      // Use rich embed if available
      await ctx.replyEmbed({
        title: '📅 Daily Radar Summary',
        description: message,
        color: 0x57F287, // Discord green
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
        `❌ Failed to fetch daily radar data: ${errorMessage}`
      );
    }
  }
}
