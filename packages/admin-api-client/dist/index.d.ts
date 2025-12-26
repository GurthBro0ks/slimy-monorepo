import type { SettingsChangeEvent, SettingsChangeKind, SettingsScopeType } from "../../contracts/dist/index.js";
export type AdminApiJsonResult<T> = {
    ok: true;
    status: number;
    data: T;
    headers: Headers;
} | {
    ok: false;
    status: number;
    error: unknown;
    headers: Headers;
};
export type AdminApiClientInit = {
    baseUrl: string;
    fetchImpl?: typeof fetch;
    defaultHeaders?: Record<string, string>;
};
export declare function resolveAdminApiBaseUrl(env?: Record<string, string | undefined>): string;
export type MemoryScopeType = "user" | "guild";
export type MemoryKind = "profile_summary" | "preferences" | "project_state" | "snail_lore";
export type MemorySource = "discord" | "web" | "admin-ui" | "system";
export type UserSettingsPrefs = {
    theme?: "neon" | "classic" | "system";
    chat?: {
        markdown?: boolean;
        profanityFilter?: boolean;
    };
    snail?: {
        avatarId?: string;
        vibe?: string;
        loreFlags?: string[];
    };
};
export type GuildSettingsPrefs = {
    botEnabled?: boolean;
    channels?: {
        adminLogChannelId?: string;
        globalChatChannelId?: string;
    };
    widget?: {
        enabled?: boolean;
    };
};
export type UserSettingsV0 = {
    userId: string;
    version: number;
    updatedAt: string;
    prefs: UserSettingsPrefs;
    [k: string]: unknown;
};
export type GuildSettingsV0 = {
    guildId: string;
    version: number;
    updatedAt: string;
    prefs: GuildSettingsPrefs;
    [k: string]: unknown;
};
export type SettingsScopeTypeV0 = SettingsScopeType;
export type SettingsChangeKindV0 = SettingsChangeKind;
export type SettingsChangeEventV0 = SettingsChangeEvent;
export type SettingsChangesResponseV0 = {
    ok: true;
    events: SettingsChangeEventV0[];
    nextSinceId: number | null;
};
export type MemoryRecordV0 = {
    scopeType: MemoryScopeType;
    scopeId: string;
    kind: MemoryKind;
    source: MemorySource;
    content: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
};
export type MemoryWriteRequestV0 = {
    kind: MemoryKind;
    source: MemorySource;
    content: Record<string, unknown>;
};
export type UserSettingsPatchV0 = {
    prefs?: {
        theme?: "neon" | "classic" | "system";
        chat?: {
            markdown?: boolean;
            profanityFilter?: boolean;
        };
        snail?: {
            avatarId?: string;
            vibe?: string;
            loreFlags?: string[];
        };
    };
};
export type GuildSettingsPatchV0 = {
    prefs?: {
        botEnabled?: boolean;
        channels?: {
            adminLogChannelId?: string;
            globalChatChannelId?: string;
        };
        widget?: {
            enabled?: boolean;
        };
    };
};
export declare function createAdminApiClient(client: AdminApiClientInit): {
    getUserSettings(userId: string): Promise<AdminApiJsonResult<{
        ok: boolean;
        settings: UserSettingsV0;
    }>>;
    setUserSettings(userId: string, settings: UserSettingsV0): Promise<AdminApiJsonResult<{
        ok: boolean;
        settings: UserSettingsV0;
    }>>;
    patchUserSettings(userId: string, patch: UserSettingsPatchV0): Promise<AdminApiJsonResult<{
        ok: boolean;
        settings: UserSettingsV0;
    }>>;
    getGuildSettings(guildId: string): Promise<AdminApiJsonResult<{
        ok: boolean;
        settings: GuildSettingsV0;
    }>>;
    setGuildSettings(guildId: string, settings: GuildSettingsV0): Promise<AdminApiJsonResult<{
        ok: boolean;
        settings: GuildSettingsV0;
    }>>;
    patchGuildSettings(guildId: string, patch: GuildSettingsPatchV0): Promise<AdminApiJsonResult<{
        ok: boolean;
        settings: GuildSettingsV0;
    }>>;
    listSettingsChangesV0(input: {
        scopeType: SettingsScopeTypeV0;
        scopeId: string;
        sinceId?: number | null;
        limit?: number;
        kind?: SettingsChangeKindV0;
    }): Promise<AdminApiJsonResult<SettingsChangesResponseV0>>;
    listMemory(scopeType: MemoryScopeType, scopeId: string, opts?: {
        kind?: MemoryKind;
    }): Promise<AdminApiJsonResult<{
        ok: boolean;
        records: MemoryRecordV0[];
    }>>;
    writeMemory(input: {
        scopeType: MemoryScopeType;
        scopeId: string;
    } & MemoryWriteRequestV0): Promise<AdminApiJsonResult<{
        ok: boolean;
        record: MemoryRecordV0;
    }>>;
};
export declare function createAdminApiClientFromEnv(opts?: {
    env?: Record<string, string | undefined>;
    fetchImpl?: typeof fetch;
    defaultHeaders?: Record<string, string>;
}): {
    getUserSettings(userId: string): Promise<AdminApiJsonResult<{
        ok: boolean;
        settings: UserSettingsV0;
    }>>;
    setUserSettings(userId: string, settings: UserSettingsV0): Promise<AdminApiJsonResult<{
        ok: boolean;
        settings: UserSettingsV0;
    }>>;
    patchUserSettings(userId: string, patch: UserSettingsPatchV0): Promise<AdminApiJsonResult<{
        ok: boolean;
        settings: UserSettingsV0;
    }>>;
    getGuildSettings(guildId: string): Promise<AdminApiJsonResult<{
        ok: boolean;
        settings: GuildSettingsV0;
    }>>;
    setGuildSettings(guildId: string, settings: GuildSettingsV0): Promise<AdminApiJsonResult<{
        ok: boolean;
        settings: GuildSettingsV0;
    }>>;
    patchGuildSettings(guildId: string, patch: GuildSettingsPatchV0): Promise<AdminApiJsonResult<{
        ok: boolean;
        settings: GuildSettingsV0;
    }>>;
    listSettingsChangesV0(input: {
        scopeType: SettingsScopeTypeV0;
        scopeId: string;
        sinceId?: number | null;
        limit?: number;
        kind?: SettingsChangeKindV0;
    }): Promise<AdminApiJsonResult<SettingsChangesResponseV0>>;
    listMemory(scopeType: MemoryScopeType, scopeId: string, opts?: {
        kind?: MemoryKind;
    }): Promise<AdminApiJsonResult<{
        ok: boolean;
        records: MemoryRecordV0[];
    }>>;
    writeMemory(input: {
        scopeType: MemoryScopeType;
        scopeId: string;
    } & MemoryWriteRequestV0): Promise<AdminApiJsonResult<{
        ok: boolean;
        record: MemoryRecordV0;
    }>>;
};
