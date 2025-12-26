"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsChangeEventSchema = exports.SettingsChangeSourceSchema = exports.SETTINGS_CHANGE_SOURCES = exports.SettingsChangeKindSchema = exports.SETTINGS_CHANGE_KINDS = exports.SettingsScopeTypeSchema = exports.GuildSettingsSchema = exports.GuildSettingsPrefsSchema = exports.UserSettingsSchema = exports.UserSettingsPrefsSchema = exports.ThemeSchema = exports.SETTINGS_VERSION_V0 = void 0;
exports.defaultUserSettings = defaultUserSettings;
exports.defaultGuildSettings = defaultGuildSettings;
const zod_1 = require("zod");
exports.SETTINGS_VERSION_V0 = 1;
const isoDateString = zod_1.z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), "invalid ISO date string");
exports.ThemeSchema = zod_1.z.enum(["neon", "classic", "system"]);
exports.UserSettingsPrefsSchema = zod_1.z.object({
    theme: exports.ThemeSchema.optional(),
    chat: zod_1.z
        .object({
        markdown: zod_1.z.boolean().optional(),
        profanityFilter: zod_1.z.boolean().optional(),
    })
        .optional(),
    snail: zod_1.z
        .object({
        avatarId: zod_1.z.string().optional(),
        vibe: zod_1.z.string().optional(),
        loreFlags: zod_1.z.array(zod_1.z.string()).optional(),
    })
        .optional(),
});
exports.UserSettingsSchema = zod_1.z
    .object({
    userId: zod_1.z.string().min(1),
    version: zod_1.z.number().int().min(1),
    updatedAt: isoDateString,
    prefs: exports.UserSettingsPrefsSchema,
})
    .passthrough();
exports.GuildSettingsPrefsSchema = zod_1.z.object({
    botEnabled: zod_1.z.boolean().optional(),
    channels: zod_1.z
        .object({
        adminLogChannelId: zod_1.z.string().optional(),
        globalChatChannelId: zod_1.z.string().optional(),
    })
        .optional(),
    widget: zod_1.z
        .object({
        enabled: zod_1.z.boolean().optional(),
    })
        .optional(),
});
exports.GuildSettingsSchema = zod_1.z
    .object({
    guildId: zod_1.z.string().min(1),
    version: zod_1.z.number().int().min(1),
    updatedAt: isoDateString,
    prefs: exports.GuildSettingsPrefsSchema,
})
    .passthrough();
exports.SettingsScopeTypeSchema = zod_1.z.enum(["user", "guild"]);
exports.SETTINGS_CHANGE_KINDS = [
    "user_settings_updated",
    "guild_settings_updated",
];
exports.SettingsChangeKindSchema = zod_1.z.enum(exports.SETTINGS_CHANGE_KINDS);
exports.SETTINGS_CHANGE_SOURCES = [
    "discord",
    "admin-ui",
    "web",
    "api",
    "unknown",
];
exports.SettingsChangeSourceSchema = zod_1.z.enum(exports.SETTINGS_CHANGE_SOURCES);
exports.SettingsChangeEventSchema = zod_1.z.object({
    id: zod_1.z.number().int().min(0),
    createdAt: isoDateString,
    scopeType: exports.SettingsScopeTypeSchema,
    scopeId: zod_1.z.string().min(1),
    kind: exports.SettingsChangeKindSchema,
    actorUserId: zod_1.z.string().min(1),
    actorIsAdmin: zod_1.z.boolean().optional(),
    source: exports.SettingsChangeSourceSchema.optional(),
    changedKeys: zod_1.z.array(zod_1.z.string()).optional(),
});
function legacyCentralDefaults() {
    return {
        profile: {},
        chat: {},
        snail: {
            personalSheet: {
                enabled: false,
                sheetId: null,
            },
        },
    };
}
function defaultUserSettings(userId) {
    const now = new Date().toISOString();
    return exports.UserSettingsSchema.parse({
        ...legacyCentralDefaults(),
        userId,
        version: exports.SETTINGS_VERSION_V0,
        updatedAt: now,
        prefs: {},
    });
}
function defaultGuildSettings(guildId) {
    const now = new Date().toISOString();
    return exports.GuildSettingsSchema.parse({
        ...legacyCentralDefaults(),
        guildId,
        version: exports.SETTINGS_VERSION_V0,
        updatedAt: now,
        prefs: {},
    });
}
