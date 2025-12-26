import { z } from "zod";
export declare const SETTINGS_VERSION_V0 = 1;
export declare const ThemeSchema: z.ZodEnum<["neon", "classic", "system"]>;
export declare const UserSettingsPrefsSchema: z.ZodObject<{
    theme: z.ZodOptional<z.ZodEnum<["neon", "classic", "system"]>>;
    chat: z.ZodOptional<z.ZodObject<{
        markdown: z.ZodOptional<z.ZodBoolean>;
        profanityFilter: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        markdown?: boolean | undefined;
        profanityFilter?: boolean | undefined;
    }, {
        markdown?: boolean | undefined;
        profanityFilter?: boolean | undefined;
    }>>;
    snail: z.ZodOptional<z.ZodObject<{
        avatarId: z.ZodOptional<z.ZodString>;
        vibe: z.ZodOptional<z.ZodString>;
        loreFlags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        avatarId?: string | undefined;
        vibe?: string | undefined;
        loreFlags?: string[] | undefined;
    }, {
        avatarId?: string | undefined;
        vibe?: string | undefined;
        loreFlags?: string[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    theme?: "neon" | "classic" | "system" | undefined;
    chat?: {
        markdown?: boolean | undefined;
        profanityFilter?: boolean | undefined;
    } | undefined;
    snail?: {
        avatarId?: string | undefined;
        vibe?: string | undefined;
        loreFlags?: string[] | undefined;
    } | undefined;
}, {
    theme?: "neon" | "classic" | "system" | undefined;
    chat?: {
        markdown?: boolean | undefined;
        profanityFilter?: boolean | undefined;
    } | undefined;
    snail?: {
        avatarId?: string | undefined;
        vibe?: string | undefined;
        loreFlags?: string[] | undefined;
    } | undefined;
}>;
export declare const UserSettingsSchema: z.ZodObject<{
    userId: z.ZodString;
    version: z.ZodNumber;
    updatedAt: z.ZodEffects<z.ZodString, string, string>;
    prefs: z.ZodObject<{
        theme: z.ZodOptional<z.ZodEnum<["neon", "classic", "system"]>>;
        chat: z.ZodOptional<z.ZodObject<{
            markdown: z.ZodOptional<z.ZodBoolean>;
            profanityFilter: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            markdown?: boolean | undefined;
            profanityFilter?: boolean | undefined;
        }, {
            markdown?: boolean | undefined;
            profanityFilter?: boolean | undefined;
        }>>;
        snail: z.ZodOptional<z.ZodObject<{
            avatarId: z.ZodOptional<z.ZodString>;
            vibe: z.ZodOptional<z.ZodString>;
            loreFlags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            avatarId?: string | undefined;
            vibe?: string | undefined;
            loreFlags?: string[] | undefined;
        }, {
            avatarId?: string | undefined;
            vibe?: string | undefined;
            loreFlags?: string[] | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        theme?: "neon" | "classic" | "system" | undefined;
        chat?: {
            markdown?: boolean | undefined;
            profanityFilter?: boolean | undefined;
        } | undefined;
        snail?: {
            avatarId?: string | undefined;
            vibe?: string | undefined;
            loreFlags?: string[] | undefined;
        } | undefined;
    }, {
        theme?: "neon" | "classic" | "system" | undefined;
        chat?: {
            markdown?: boolean | undefined;
            profanityFilter?: boolean | undefined;
        } | undefined;
        snail?: {
            avatarId?: string | undefined;
            vibe?: string | undefined;
            loreFlags?: string[] | undefined;
        } | undefined;
    }>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    userId: z.ZodString;
    version: z.ZodNumber;
    updatedAt: z.ZodEffects<z.ZodString, string, string>;
    prefs: z.ZodObject<{
        theme: z.ZodOptional<z.ZodEnum<["neon", "classic", "system"]>>;
        chat: z.ZodOptional<z.ZodObject<{
            markdown: z.ZodOptional<z.ZodBoolean>;
            profanityFilter: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            markdown?: boolean | undefined;
            profanityFilter?: boolean | undefined;
        }, {
            markdown?: boolean | undefined;
            profanityFilter?: boolean | undefined;
        }>>;
        snail: z.ZodOptional<z.ZodObject<{
            avatarId: z.ZodOptional<z.ZodString>;
            vibe: z.ZodOptional<z.ZodString>;
            loreFlags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            avatarId?: string | undefined;
            vibe?: string | undefined;
            loreFlags?: string[] | undefined;
        }, {
            avatarId?: string | undefined;
            vibe?: string | undefined;
            loreFlags?: string[] | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        theme?: "neon" | "classic" | "system" | undefined;
        chat?: {
            markdown?: boolean | undefined;
            profanityFilter?: boolean | undefined;
        } | undefined;
        snail?: {
            avatarId?: string | undefined;
            vibe?: string | undefined;
            loreFlags?: string[] | undefined;
        } | undefined;
    }, {
        theme?: "neon" | "classic" | "system" | undefined;
        chat?: {
            markdown?: boolean | undefined;
            profanityFilter?: boolean | undefined;
        } | undefined;
        snail?: {
            avatarId?: string | undefined;
            vibe?: string | undefined;
            loreFlags?: string[] | undefined;
        } | undefined;
    }>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    userId: z.ZodString;
    version: z.ZodNumber;
    updatedAt: z.ZodEffects<z.ZodString, string, string>;
    prefs: z.ZodObject<{
        theme: z.ZodOptional<z.ZodEnum<["neon", "classic", "system"]>>;
        chat: z.ZodOptional<z.ZodObject<{
            markdown: z.ZodOptional<z.ZodBoolean>;
            profanityFilter: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            markdown?: boolean | undefined;
            profanityFilter?: boolean | undefined;
        }, {
            markdown?: boolean | undefined;
            profanityFilter?: boolean | undefined;
        }>>;
        snail: z.ZodOptional<z.ZodObject<{
            avatarId: z.ZodOptional<z.ZodString>;
            vibe: z.ZodOptional<z.ZodString>;
            loreFlags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            avatarId?: string | undefined;
            vibe?: string | undefined;
            loreFlags?: string[] | undefined;
        }, {
            avatarId?: string | undefined;
            vibe?: string | undefined;
            loreFlags?: string[] | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        theme?: "neon" | "classic" | "system" | undefined;
        chat?: {
            markdown?: boolean | undefined;
            profanityFilter?: boolean | undefined;
        } | undefined;
        snail?: {
            avatarId?: string | undefined;
            vibe?: string | undefined;
            loreFlags?: string[] | undefined;
        } | undefined;
    }, {
        theme?: "neon" | "classic" | "system" | undefined;
        chat?: {
            markdown?: boolean | undefined;
            profanityFilter?: boolean | undefined;
        } | undefined;
        snail?: {
            avatarId?: string | undefined;
            vibe?: string | undefined;
            loreFlags?: string[] | undefined;
        } | undefined;
    }>;
}, z.ZodTypeAny, "passthrough">>;
export type UserSettings = z.infer<typeof UserSettingsSchema>;
export declare const GuildSettingsPrefsSchema: z.ZodObject<{
    botEnabled: z.ZodOptional<z.ZodBoolean>;
    channels: z.ZodOptional<z.ZodObject<{
        adminLogChannelId: z.ZodOptional<z.ZodString>;
        globalChatChannelId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        adminLogChannelId?: string | undefined;
        globalChatChannelId?: string | undefined;
    }, {
        adminLogChannelId?: string | undefined;
        globalChatChannelId?: string | undefined;
    }>>;
    widget: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        enabled?: boolean | undefined;
    }, {
        enabled?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    botEnabled?: boolean | undefined;
    channels?: {
        adminLogChannelId?: string | undefined;
        globalChatChannelId?: string | undefined;
    } | undefined;
    widget?: {
        enabled?: boolean | undefined;
    } | undefined;
}, {
    botEnabled?: boolean | undefined;
    channels?: {
        adminLogChannelId?: string | undefined;
        globalChatChannelId?: string | undefined;
    } | undefined;
    widget?: {
        enabled?: boolean | undefined;
    } | undefined;
}>;
export declare const GuildSettingsSchema: z.ZodObject<{
    guildId: z.ZodString;
    version: z.ZodNumber;
    updatedAt: z.ZodEffects<z.ZodString, string, string>;
    prefs: z.ZodObject<{
        botEnabled: z.ZodOptional<z.ZodBoolean>;
        channels: z.ZodOptional<z.ZodObject<{
            adminLogChannelId: z.ZodOptional<z.ZodString>;
            globalChatChannelId: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            adminLogChannelId?: string | undefined;
            globalChatChannelId?: string | undefined;
        }, {
            adminLogChannelId?: string | undefined;
            globalChatChannelId?: string | undefined;
        }>>;
        widget: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            enabled?: boolean | undefined;
        }, {
            enabled?: boolean | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        botEnabled?: boolean | undefined;
        channels?: {
            adminLogChannelId?: string | undefined;
            globalChatChannelId?: string | undefined;
        } | undefined;
        widget?: {
            enabled?: boolean | undefined;
        } | undefined;
    }, {
        botEnabled?: boolean | undefined;
        channels?: {
            adminLogChannelId?: string | undefined;
            globalChatChannelId?: string | undefined;
        } | undefined;
        widget?: {
            enabled?: boolean | undefined;
        } | undefined;
    }>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    guildId: z.ZodString;
    version: z.ZodNumber;
    updatedAt: z.ZodEffects<z.ZodString, string, string>;
    prefs: z.ZodObject<{
        botEnabled: z.ZodOptional<z.ZodBoolean>;
        channels: z.ZodOptional<z.ZodObject<{
            adminLogChannelId: z.ZodOptional<z.ZodString>;
            globalChatChannelId: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            adminLogChannelId?: string | undefined;
            globalChatChannelId?: string | undefined;
        }, {
            adminLogChannelId?: string | undefined;
            globalChatChannelId?: string | undefined;
        }>>;
        widget: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            enabled?: boolean | undefined;
        }, {
            enabled?: boolean | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        botEnabled?: boolean | undefined;
        channels?: {
            adminLogChannelId?: string | undefined;
            globalChatChannelId?: string | undefined;
        } | undefined;
        widget?: {
            enabled?: boolean | undefined;
        } | undefined;
    }, {
        botEnabled?: boolean | undefined;
        channels?: {
            adminLogChannelId?: string | undefined;
            globalChatChannelId?: string | undefined;
        } | undefined;
        widget?: {
            enabled?: boolean | undefined;
        } | undefined;
    }>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    guildId: z.ZodString;
    version: z.ZodNumber;
    updatedAt: z.ZodEffects<z.ZodString, string, string>;
    prefs: z.ZodObject<{
        botEnabled: z.ZodOptional<z.ZodBoolean>;
        channels: z.ZodOptional<z.ZodObject<{
            adminLogChannelId: z.ZodOptional<z.ZodString>;
            globalChatChannelId: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            adminLogChannelId?: string | undefined;
            globalChatChannelId?: string | undefined;
        }, {
            adminLogChannelId?: string | undefined;
            globalChatChannelId?: string | undefined;
        }>>;
        widget: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            enabled?: boolean | undefined;
        }, {
            enabled?: boolean | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        botEnabled?: boolean | undefined;
        channels?: {
            adminLogChannelId?: string | undefined;
            globalChatChannelId?: string | undefined;
        } | undefined;
        widget?: {
            enabled?: boolean | undefined;
        } | undefined;
    }, {
        botEnabled?: boolean | undefined;
        channels?: {
            adminLogChannelId?: string | undefined;
            globalChatChannelId?: string | undefined;
        } | undefined;
        widget?: {
            enabled?: boolean | undefined;
        } | undefined;
    }>;
}, z.ZodTypeAny, "passthrough">>;
export type GuildSettings = z.infer<typeof GuildSettingsSchema>;
export declare function defaultUserSettings(userId: string): UserSettings;
export declare function defaultGuildSettings(guildId: string): GuildSettings;
