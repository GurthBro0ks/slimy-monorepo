import { z } from "zod";

export const SETTINGS_VERSION_V0 = 1;

const isoDateString = z
  .string()
  .refine((value: string) => !Number.isNaN(Date.parse(value)), "invalid ISO date string");

export const ThemeSchema = z.enum(["neon", "classic", "system"]);

export const UserSettingsPrefsSchema = z.object({
  theme: ThemeSchema.optional(),
  chat: z
    .object({
      markdown: z.boolean().optional(),
      profanityFilter: z.boolean().optional(),
    })
    .optional(),
  snail: z
    .object({
      avatarId: z.string().optional(),
      vibe: z.string().optional(),
      loreFlags: z.array(z.string()).optional(),
    })
    .optional(),
});

export const UserSettingsSchema = z
  .object({
    userId: z.string().min(1),
    version: z.number().int().min(1),
    updatedAt: isoDateString,
    prefs: UserSettingsPrefsSchema,
  })
  .passthrough();

export type UserSettings = z.infer<typeof UserSettingsSchema>;

export const GuildSettingsPrefsSchema = z.object({
  botEnabled: z.boolean().optional(),
  channels: z
    .object({
      adminLogChannelId: z.string().optional(),
      globalChatChannelId: z.string().optional(),
    })
    .optional(),
  widget: z
    .object({
      enabled: z.boolean().optional(),
    })
    .optional(),
});

export const GuildSettingsSchema = z
  .object({
    guildId: z.string().min(1),
    version: z.number().int().min(1),
    updatedAt: isoDateString,
    prefs: GuildSettingsPrefsSchema,
  })
  .passthrough();

export type GuildSettings = z.infer<typeof GuildSettingsSchema>;

export const SettingsScopeTypeSchema = z.enum(["user", "guild"]);
export type SettingsScopeType = z.infer<typeof SettingsScopeTypeSchema>;

export const SETTINGS_CHANGES_DEFAULT_LIMIT = 50;
export const SETTINGS_CHANGES_MAX_LIMIT = 200;

export const SETTINGS_CHANGE_KINDS = [
  "user_settings_updated",
  "guild_settings_updated",
] as const;
export const SettingsChangeKindSchema = z.enum(SETTINGS_CHANGE_KINDS);
export type SettingsChangeKind = z.infer<typeof SettingsChangeKindSchema>;

export const SETTINGS_CHANGE_SOURCES = [
  "discord",
  "admin-ui",
  "web",
  "api",
  "unknown",
] as const;
export const SettingsChangeSourceSchema = z.enum(SETTINGS_CHANGE_SOURCES);
export type SettingsChangeSource = z.infer<typeof SettingsChangeSourceSchema>;

export const SettingsChangeEventSchema = z.object({
  id: z.number().int().min(0),
  createdAt: isoDateString,
  scopeType: SettingsScopeTypeSchema,
  scopeId: z.string().min(1),
  kind: SettingsChangeKindSchema,
  actorUserId: z.string().min(1),
  actorIsAdmin: z.boolean().optional(),
  source: SettingsChangeSourceSchema.optional(),
  changedKeys: z.array(z.string()).optional(),
});

export type SettingsChangeEvent = z.infer<typeof SettingsChangeEventSchema>;

function legacyCentralDefaults() {
  return {
    profile: {},
    chat: {},
    snail: {
      personalSheet: {
        enabled: false,
        sheetId: null as string | null,
      },
    },
  };
}

export function defaultUserSettings(userId: string): UserSettings {
  const now = new Date().toISOString();
  return UserSettingsSchema.parse({
    ...legacyCentralDefaults(),
    userId,
    version: SETTINGS_VERSION_V0,
    updatedAt: now,
    prefs: {},
  });
}

export function defaultGuildSettings(guildId: string): GuildSettings {
  const now = new Date().toISOString();
  return GuildSettingsSchema.parse({
    ...legacyCentralDefaults(),
    guildId,
    version: SETTINGS_VERSION_V0,
    updatedAt: now,
    prefs: {},
  });
}
