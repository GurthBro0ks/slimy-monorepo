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
export declare function createAdminApiClient(client: AdminApiClientInit): {
    getUserSettings(userId: string): Promise<AdminApiJsonResult<{
        ok: boolean;
        settings: UserSettingsV0;
    }>>;
    setUserSettings(userId: string, settings: UserSettingsV0): Promise<AdminApiJsonResult<{
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
    listMemory(scopeType: MemoryScopeType, scopeId: string, opts?: {
        kind?: MemoryKind;
    }): Promise<AdminApiJsonResult<{
        ok: boolean;
        records: MemoryRecordV0[];
    }>>;
    writeMemory(scopeType: MemoryScopeType, scopeId: string, body: MemoryWriteRequestV0): Promise<AdminApiJsonResult<{
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
    getGuildSettings(guildId: string): Promise<AdminApiJsonResult<{
        ok: boolean;
        settings: GuildSettingsV0;
    }>>;
    setGuildSettings(guildId: string, settings: GuildSettingsV0): Promise<AdminApiJsonResult<{
        ok: boolean;
        settings: GuildSettingsV0;
    }>>;
    listMemory(scopeType: MemoryScopeType, scopeId: string, opts?: {
        kind?: MemoryKind;
    }): Promise<AdminApiJsonResult<{
        ok: boolean;
        records: MemoryRecordV0[];
    }>>;
    writeMemory(scopeType: MemoryScopeType, scopeId: string, body: MemoryWriteRequestV0): Promise<AdminApiJsonResult<{
        ok: boolean;
        record: MemoryRecordV0;
    }>>;
};
