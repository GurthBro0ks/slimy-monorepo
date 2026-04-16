/**
 * Shared chat utilities — extracted from chat.ts to avoid circular deps.
 * Used by both chat.ts command and mention.ts handler.
 */

import { ChannelType, GuildChannel, Guild } from "discord.js";
import { getEffectiveModesForChannel } from "./modes.js";
import { callWithFallback } from "./llm-fallback.js";
import { getPersona } from "./persona.js";

const _THREAD_TYPES = new Set([
  ChannelType.PublicThread,
  ChannelType.PrivateThread,
  ChannelType.AnnouncementThread,
]);

interface HistoryEntry {
  messages: Array<{ role: string; content: string }>;
  lastAccess: number;
}

const histories = new Map<string, HistoryEntry>();
const MAX_TURNS = 8;
const HISTORY_TTL_MS = 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;

export function cleanupOldHistories(): void {
  const now = Date.now();
  let cleaned = 0;
  for (const [key, entry] of histories.entries()) {
    if (now - entry.lastAccess > HISTORY_TTL_MS) {
      histories.delete(key);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.info(`[chat] Cleaned up ${cleaned} expired conversation histories`);
  }
}

// Start periodic cleanup
setInterval(cleanupOldHistories, CLEANUP_INTERVAL_MS);

const AUTO_DETECT_MODES = ["mentor", "partner", "mirror", "operator"];

export function autoDetectMode(text = ""): string {
  const t = text.toLowerCase();
  const s: Record<string, number> = { mentor: 0, partner: 0, mirror: 0, operator: 0 };
  if (/\b(help|guide|teach|explain|stuck)\b/i.test(t)) s.mentor += 2;
  if (/\b(calm|slow|reset|pause|breathe)\b/i.test(t)) s.mentor += 3;
  if (/\b(brainstorm|idea|creative|wild|fun)\b/i.test(t)) s.partner += 2;
  if (/\b(evaluate|compare|option|choose|decide)\b/i.test(t)) s.mirror += 2;
  if (/\b(plan|organize|schedule|task|checklist)\b/i.test(t)) s.operator += 2;
  const top = AUTO_DETECT_MODES.reduce((a, m) => (s[m] > s[a] ? m : a), "mentor");
  return s[top] > 0 ? top : "mentor";
}

export async function runConversation({
  userId,
  channelId,
  guildId,
  parentId: _parentId,
  userMsg,
  reset = false,
  effectiveOverride = null,
}: {
  userId: string;
  channelId: string;
  guildId?: string;
  parentId?: string;
  userMsg: string;
  reset?: boolean;
  effectiveOverride?: Record<string, boolean> | null;
}): Promise<{ response: string; persona: string }> {
  const key = `${channelId}:${userId}`;
  if (reset) histories.delete(key);

  let historyEntry = histories.get(key);
  let history = historyEntry ? historyEntry.messages : [];

  history.push({ role: "user", content: userMsg });
  if (history.length > MAX_TURNS * 2) {
    history = history.slice(-MAX_TURNS * 2);
  }

  histories.set(key, { messages: history, lastAccess: Date.now() });

  const detectedMode = autoDetectMode(userMsg);
  let persona = getPersona(detectedMode);

  let effectiveModes = effectiveOverride;
  if (!effectiveModes) {
    // global client injected by bot index
    const client = globalThis.client as { channels?: { cache?: Map<string, GuildChannel> }; guilds?: { cache?: Map<string, Guild> } } | undefined;
    const channel = client?.channels?.cache?.get(channelId) ?? null;
    const guild = guildId ? (client?.guilds?.cache?.get(guildId) ?? null) : null;
    effectiveModes = getEffectiveModesForChannel(guild, channel);
  }

  if (effectiveModes?.personality) {
    persona = getPersona("personality");
  } else if (effectiveModes?.no_personality) {
    persona = getPersona("no_personality");
  }

  const systemPrompt =
    typeof persona.prompt === "string" ? persona.prompt : "You are a helpful assistant.";
  const messages = [{ role: "system", content: systemPrompt }, ...history];

  const completion = await callWithFallback({
    model: process.env.OPENAI_MODEL || "gpt-4o",
    messages,
    temperature: 0.8,
    max_tokens: 1000,
  });

  const response = completion.response || "No response.";
  history.push({ role: "assistant", content: response });
  histories.set(key, { messages: history, lastAccess: Date.now() });

  return { response, persona: persona.name };
}

export { getEffectiveModesForChannel };
