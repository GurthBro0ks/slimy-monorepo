import type {
  GuildSettingsV0,
  SettingsChangeEventV0,
  SettingsScopeTypeV0,
  UserSettingsV0,
} from "@slimy/admin-api-client";
import type { createAdminApiClient } from "@slimy/admin-api-client";

type AdminApiClient = ReturnType<typeof createAdminApiClient>;

type ScopeState<T> = {
  sinceId: number | null;
  settings: T | null;
};

const userState = new Map<string, ScopeState<UserSettingsV0>>();
const guildState = new Map<string, ScopeState<GuildSettingsV0>>();

type SettingsSyncResult<T> =
  | { ok: true; settings: T; refreshed: boolean }
  | { ok: false; error: unknown };

function getOrInitState<T>(map: Map<string, ScopeState<T>>, key: string): ScopeState<T> {
  const existing = map.get(key);
  if (existing) return existing;
  const next = { sinceId: null, settings: null };
  map.set(key, next);
  return next;
}

async function fetchChanges(
  client: AdminApiClient,
  scopeType: SettingsScopeTypeV0,
  scopeId: string,
  sinceId: number | null,
): Promise<{ events: SettingsChangeEventV0[]; nextSinceId: number | null } | null> {
  const res = await client.listSettingsChangesV0({
    scopeType,
    scopeId,
    sinceId: sinceId ?? undefined,
    limit: 1,
  });
  if (!res.ok || !res.data) return null;
  return { events: res.data.events, nextSinceId: res.data.nextSinceId };
}

export async function getFreshUserSettings(
  client: AdminApiClient,
  userId: string,
): Promise<SettingsSyncResult<UserSettingsV0>> {
  const state = getOrInitState(userState, userId);
  let refreshed = false;

  const changes = await fetchChanges(client, "user", userId, state.sinceId);
  if (changes) {
    if (typeof changes.nextSinceId === "number") state.sinceId = changes.nextSinceId;
    if (changes.events.length && state.settings) {
      state.settings = null;
      refreshed = true;
    }
  }

  if (state.settings) return { ok: true, settings: state.settings, refreshed: false };

  const settingsRes = await client.getUserSettings(userId);
  if (!settingsRes.ok) return { ok: false, error: settingsRes.error };

  const settings = settingsRes.data.settings ?? null;
  if (!settings) return { ok: false, error: "missing_settings" };
  state.settings = settings;
  return { ok: true, settings, refreshed };
}

export async function getFreshGuildSettings(
  client: AdminApiClient,
  guildId: string,
): Promise<SettingsSyncResult<GuildSettingsV0>> {
  const state = getOrInitState(guildState, guildId);
  let refreshed = false;

  const changes = await fetchChanges(client, "guild", guildId, state.sinceId);
  if (changes) {
    if (typeof changes.nextSinceId === "number") state.sinceId = changes.nextSinceId;
    if (changes.events.length && state.settings) {
      state.settings = null;
      refreshed = true;
    }
  }

  if (state.settings) return { ok: true, settings: state.settings, refreshed: false };

  const settingsRes = await client.getGuildSettings(guildId);
  if (!settingsRes.ok) return { ok: false, error: settingsRes.error };

  const settings = settingsRes.data.settings ?? null;
  if (!settings) return { ok: false, error: "missing_settings" };
  state.settings = settings;
  return { ok: true, settings, refreshed };
}

export async function noteUserSettingsWrite(
  client: AdminApiClient,
  userId: string,
  settings: UserSettingsV0,
): Promise<void> {
  const state = getOrInitState(userState, userId);
  state.settings = settings;

  const changes = await fetchChanges(client, "user", userId, state.sinceId);
  if (changes && typeof changes.nextSinceId === "number") state.sinceId = changes.nextSinceId;
}

export async function noteGuildSettingsWrite(
  client: AdminApiClient,
  guildId: string,
  settings: GuildSettingsV0,
): Promise<void> {
  const state = getOrInitState(guildState, guildId);
  state.settings = settings;

  const changes = await fetchChanges(client, "guild", guildId, state.sinceId);
  if (changes && typeof changes.nextSinceId === "number") state.sinceId = changes.nextSinceId;
}
