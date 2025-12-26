"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryWriteRequestSchema = exports.MemoryRecordSchema = exports.MemoryContentSchema = exports.MemorySourceSchema = exports.MemoryKindSchema = exports.MemoryScopeTypeSchema = exports.SECRET_LIKE_KEY_HINTS = exports.MAX_MEMORY_CONTENT_BYTES = void 0;
const zod_1 = require("zod");
exports.MAX_MEMORY_CONTENT_BYTES = 16 * 1024;
exports.SECRET_LIKE_KEY_HINTS = [
    "token",
    "secret",
    "password",
    "auth",
    "cookie",
];
const secretKeyPatterns = [
    /token/i,
    /secret/i,
    /password/i,
    /auth/i,
    /cookie/i,
    /clientsecret/i,
    /apikey/i,
    /privatekey/i,
    /publickey/i,
    /accesskey/i,
    /sessionkey/i,
    /^key$/i,
    /key$/i,
];
function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function findSecretLikeKeyPath(value, path = []) {
    if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i += 1) {
            const nested = findSecretLikeKeyPath(value[i], [...path, String(i)]);
            if (nested)
                return nested;
        }
        return null;
    }
    if (!isPlainObject(value))
        return null;
    for (const [k, v] of Object.entries(value)) {
        if (secretKeyPatterns.some((re) => re.test(k))) {
            return [...path, k];
        }
        const nested = findSecretLikeKeyPath(v, [...path, k]);
        if (nested)
            return nested;
    }
    return null;
}
function jsonUtf8SizeBytes(value) {
    const str = JSON.stringify(value);
    return new TextEncoder().encode(str).length;
}
exports.MemoryScopeTypeSchema = zod_1.z.enum(["user", "guild"]);
exports.MemoryKindSchema = zod_1.z.enum([
    "profile_summary",
    "preferences",
    "project_state",
    "snail_lore",
]);
exports.MemorySourceSchema = zod_1.z.enum(["discord", "web", "admin-ui", "system"]);
exports.MemoryContentSchema = zod_1.z
    .object({})
    .passthrough()
    .superRefine((content, ctx) => {
    const secretPath = findSecretLikeKeyPath(content);
    if (secretPath) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: `memory content contains forbidden secret-like key at: ${secretPath.join(".")}`,
        });
        return;
    }
    let bytes = 0;
    try {
        bytes = jsonUtf8SizeBytes(content);
    }
    catch {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: "memory content must be JSON-serializable",
        });
        return;
    }
    if (bytes > exports.MAX_MEMORY_CONTENT_BYTES) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: `memory content too large: ${bytes} bytes (max ${exports.MAX_MEMORY_CONTENT_BYTES})`,
        });
    }
});
exports.MemoryRecordSchema = zod_1.z.object({
    scopeType: exports.MemoryScopeTypeSchema,
    scopeId: zod_1.z.string().min(1),
    kind: exports.MemoryKindSchema,
    source: exports.MemorySourceSchema,
    content: exports.MemoryContentSchema,
    createdAt: zod_1.z.string().refine((v) => !Number.isNaN(Date.parse(v)), "invalid ISO date string"),
    updatedAt: zod_1.z.string().refine((v) => !Number.isNaN(Date.parse(v)), "invalid ISO date string"),
});
exports.MemoryWriteRequestSchema = zod_1.z.object({
    kind: exports.MemoryKindSchema,
    source: exports.MemorySourceSchema,
    content: exports.MemoryContentSchema,
});
