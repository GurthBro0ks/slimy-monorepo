/**
 * Channel mode management — super_snail, chat, admin, personality modes.
 * Ported from /opt/slimy/app/lib/modes.js
 */

import { ChannelType, Guild, GuildChannel } from 'discord.js';

const MODE_KEYS = ["admin", "chat", "personality", "no_personality", "super_snail", "rating_unrated", "rating_pg13"];
const PRIMARY_MODES = ["admin", "chat", "super_snail"];
const OPTIONAL_MODES = ["personality", "no_personality"];
const RATING_MODES = ["rating_unrated", "rating_pg13"];

const THREAD_TYPES = new Set([
  ChannelType.PublicThread,
  ChannelType.PrivateThread,
  ChannelType.AnnouncementThread,
]);

interface GuildModeEntry {
  guildId: string;
  targetId: string;
  targetType: "category" | "channel" | "thread";
  modes: Record<string, boolean>;
  updatedAt: number;
}

const inMemoryStore: Map<string, GuildModeEntry[]> = new Map();

interface ClientWithModeCache {
  slimeModeCache?: Map<string, GuildModeEntry>;
}

function emptyState(): Record<string, boolean> {
  const state: Record<string, boolean> = {};
  for (const key of MODE_KEYS) state[key] = false;
  return state;
}

interface ModeContext {
  targetId: string;
  targetType: "category" | "channel" | "thread";
  parents: { targetId: string; targetType: string }[];
}

function resolveModeContext(channel: GuildChannel): ModeContext | null {
  if (!channel) return null;
  const parents: { targetId: string; targetType: string }[] = [];
  let targetType: "category" | "channel" | "thread" = "channel";
  const channelType = channel.type;

  if (channelType === ChannelType.GuildCategory) {
    targetType = "category";
  } else if (THREAD_TYPES.has(channelType)) {
    targetType = "thread";
    if (channel.parentId) {
      parents.push({ targetId: channel.parentId, targetType: "channel" });
      const parentChannel = channel.guild?.channels?.cache?.get(channel.parentId) || channel.parent;
      if ((parentChannel as { parentId?: string }).parentId) {
        parents.push({ targetId: (parentChannel as { parentId: string }).parentId, targetType: "category" });
      }
    }
  } else {
    targetType = "channel";
    if (channel.parentId) {
      parents.push({ targetId: channel.parentId, targetType: "category" });
    }
  }

  return { targetId: channel.id, targetType, parents };
}

function loadStore(guildId: string): GuildModeEntry[] {
  return inMemoryStore.get(guildId) || [];
}

function _saveStore(guildId: string, modes: GuildModeEntry[]): void {
  inMemoryStore.set(guildId, modes);
}

function cacheKey(guildId: string, targetType: string, targetId: string): string {
  return `${guildId || "unknown"}:${targetType || "channel"}:${targetId || "unknown"}`;
}

function _findRecord(store: GuildModeEntry[], guildId: string, targetId: string, targetType: string): { index: number; record: GuildModeEntry | null } {
  const index = store.findIndex(
    (entry) => entry.guildId === guildId && entry.targetId === targetId && entry.targetType === targetType,
  );
  return { index, record: index >= 0 ? store[index] : null };
}

function combineModes(...states: Record<string, boolean>[]): Record<string, boolean> {
  const combined = emptyState();
  for (const state of states) {
    if (!state) continue;
    const normalized = { ...state };
    if (normalized.no_personality) normalized.personality = false;
    if (normalized.rating_unrated) normalized.rating_pg13 = false;

    if (normalized.admin || normalized.chat || normalized.super_snail) {
      for (const mode of PRIMARY_MODES) combined[mode] = false;
    }
    if (normalized.personality || normalized.no_personality) {
      for (const mode of OPTIONAL_MODES) combined[mode] = false;
    }
    if (normalized.rating_unrated || normalized.rating_pg13) {
      for (const mode of RATING_MODES) combined[mode] = false;
    }
    for (const mode of MODE_KEYS) {
      if (normalized[mode]) combined[mode] = true;
    }
  }
  return combined;
}

function resolveInherited(store: GuildModeEntry[], guildId: string, parents: { targetId: string; targetType: string }[] = []): Record<string, boolean>[] {
  const results: Record<string, boolean>[] = [];
  for (const parent of parents) {
    if (!parent) continue;
    const record = store.find(
      (entry) => entry.guildId === guildId && entry.targetId === parent.targetId && entry.targetType === parent.targetType,
    );
    if (record) results.push(record.modes);
  }
  return results;
}

function viewModes(guildId: string, targetId: string, targetType: string, parents: { targetId: string; targetType: string }[]): { effective: Record<string, boolean> } {
  const store = loadStore(guildId);
  const inheritedRecords = resolveInherited(store, guildId, parents);
  const directRecord = store.find(
    (entry) => entry.guildId === guildId && entry.targetId === targetId && entry.targetType === targetType,
  );
  const directState = directRecord?.modes || emptyState();
  const effectiveState = combineModes(...inheritedRecords, directState);
  return { effective: effectiveState };
}

export function getEffectiveModesForChannel(guild: Guild | null, channel: GuildChannel | null): Record<string, boolean> {
  if (!guild || !channel) return emptyState();
  const context = resolveModeContext(channel);
  if (!context) return emptyState();

  const client = (globalThis as typeof globalThis & { client?: ClientWithModeCache }).client;
  const cache = client?.slimeModeCache;
  if (cache instanceof Map) {
    const inherited = context.parents
      .map((parent) => cache.get(cacheKey(guild.id, parent.targetType, parent.targetId))?.modes)
      .filter(Boolean) as Record<string, boolean>[];
    const direct = cache.get(cacheKey(guild.id, context.targetType, context.targetId))?.modes || emptyState();
    return combineModes(...inherited, direct);
  }

  const view = viewModes(guild.id, context.targetId, context.targetType, context.parents);
  return view.effective;
}

export { MODE_KEYS, PRIMARY_MODES, OPTIONAL_MODES, RATING_MODES, emptyState };
