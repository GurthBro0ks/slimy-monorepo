import { z } from "zod";
export declare const MAX_MEMORY_CONTENT_BYTES: number;
export declare const SECRET_LIKE_KEY_HINTS: string[];
export declare const MemoryScopeTypeSchema: z.ZodEnum<["user", "guild"]>;
export type MemoryScopeType = z.infer<typeof MemoryScopeTypeSchema>;
export declare const MemoryKindSchema: z.ZodEnum<["profile_summary", "preferences", "project_state", "snail_lore"]>;
export type MemoryKind = z.infer<typeof MemoryKindSchema>;
export declare const MEMORY_KIND_POLICY: {
    readonly profile_summary: {
        readonly allowedScopeTypes: readonly ["user"];
        readonly platformAdminOnlyScopeTypes: readonly [];
    };
    readonly preferences: {
        readonly allowedScopeTypes: readonly ["user", "guild"];
        readonly platformAdminOnlyScopeTypes: readonly [];
    };
    readonly project_state: {
        readonly allowedScopeTypes: readonly ["user", "guild"];
        readonly platformAdminOnlyScopeTypes: readonly ["user"];
    };
    readonly snail_lore: {
        readonly allowedScopeTypes: readonly ["user", "guild"];
        readonly platformAdminOnlyScopeTypes: readonly [];
    };
};
export type MemoryKindPolicy = typeof MEMORY_KIND_POLICY;
export declare function checkMemoryKindPolicy(input: {
    scopeType: MemoryScopeType;
    kind: MemoryKind;
    isPlatformAdmin: boolean;
}): {
    ok: true;
} | {
    ok: false;
    reason: "scope_forbidden" | "platform_admin_required";
};
export declare const MemorySourceSchema: z.ZodEnum<["discord", "web", "admin-ui", "system"]>;
export type MemorySource = z.infer<typeof MemorySourceSchema>;
export declare const MemoryContentSchema: z.ZodEffects<z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
export type MemoryContent = z.infer<typeof MemoryContentSchema>;
export declare const MemoryRecordSchema: z.ZodObject<{
    scopeType: z.ZodEnum<["user", "guild"]>;
    scopeId: z.ZodString;
    kind: z.ZodEnum<["profile_summary", "preferences", "project_state", "snail_lore"]>;
    source: z.ZodEnum<["discord", "web", "admin-ui", "system"]>;
    content: z.ZodEffects<z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    createdAt: z.ZodEffects<z.ZodString, string, string>;
    updatedAt: z.ZodEffects<z.ZodString, string, string>;
}, "strip", z.ZodTypeAny, {
    updatedAt: string;
    scopeType: "user" | "guild";
    scopeId: string;
    kind: "profile_summary" | "preferences" | "project_state" | "snail_lore";
    source: "system" | "discord" | "web" | "admin-ui";
    content: {} & {
        [k: string]: unknown;
    };
    createdAt: string;
}, {
    updatedAt: string;
    scopeType: "user" | "guild";
    scopeId: string;
    kind: "profile_summary" | "preferences" | "project_state" | "snail_lore";
    source: "system" | "discord" | "web" | "admin-ui";
    content: {} & {
        [k: string]: unknown;
    };
    createdAt: string;
}>;
export type MemoryRecord = z.infer<typeof MemoryRecordSchema>;
export declare const MemoryWriteRequestSchema: z.ZodObject<{
    kind: z.ZodEnum<["profile_summary", "preferences", "project_state", "snail_lore"]>;
    source: z.ZodEnum<["discord", "web", "admin-ui", "system"]>;
    content: z.ZodEffects<z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
}, "strip", z.ZodTypeAny, {
    kind: "profile_summary" | "preferences" | "project_state" | "snail_lore";
    source: "system" | "discord" | "web" | "admin-ui";
    content: {} & {
        [k: string]: unknown;
    };
}, {
    kind: "profile_summary" | "preferences" | "project_state" | "snail_lore";
    source: "system" | "discord" | "web" | "admin-ui";
    content: {} & {
        [k: string]: unknown;
    };
}>;
export type MemoryWriteRequest = z.infer<typeof MemoryWriteRequestSchema>;
