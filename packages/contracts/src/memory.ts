import { z } from "zod";

export const MAX_MEMORY_CONTENT_BYTES = 16 * 1024;

export const SECRET_LIKE_KEY_HINTS = [
  "token",
  "secret",
  "password",
  "auth",
  "cookie",
];

const secretKeyPatterns: RegExp[] = [
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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function findSecretLikeKeyPath(
  value: unknown,
  path: string[] = [],
): string[] | null {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      const nested = findSecretLikeKeyPath(value[i], [...path, String(i)]);
      if (nested) return nested;
    }
    return null;
  }

  if (!isPlainObject(value)) return null;

  for (const [k, v] of Object.entries(value)) {
    if (secretKeyPatterns.some((re) => re.test(k))) {
      return [...path, k];
    }
    const nested = findSecretLikeKeyPath(v, [...path, k]);
    if (nested) return nested;
  }

  return null;
}

function jsonUtf8SizeBytes(value: unknown): number {
  const str = JSON.stringify(value);
  return new TextEncoder().encode(str).length;
}

export const MemoryScopeTypeSchema = z.enum(["user", "guild"]);
export type MemoryScopeType = z.infer<typeof MemoryScopeTypeSchema>;

export const MemoryKindSchema = z.enum([
  "profile_summary",
  "preferences",
  "project_state",
  "snail_lore",
]);
export type MemoryKind = z.infer<typeof MemoryKindSchema>;

export const MEMORY_KIND_POLICY = {
  profile_summary: {
    allowedScopeTypes: ["user"],
    platformAdminOnlyScopeTypes: [],
  },
  preferences: {
    allowedScopeTypes: ["user", "guild"],
    platformAdminOnlyScopeTypes: [],
  },
  project_state: {
    allowedScopeTypes: ["user", "guild"],
    platformAdminOnlyScopeTypes: ["user"],
  },
  snail_lore: {
    allowedScopeTypes: ["user", "guild"],
    platformAdminOnlyScopeTypes: [],
  },
} as const satisfies Record<
  MemoryKind,
  {
    allowedScopeTypes: readonly MemoryScopeType[];
    platformAdminOnlyScopeTypes: readonly MemoryScopeType[];
  }
>;

export type MemoryKindPolicy = typeof MEMORY_KIND_POLICY;

export function checkMemoryKindPolicy(input: {
  scopeType: MemoryScopeType;
  kind: MemoryKind;
  isPlatformAdmin: boolean;
}): { ok: true } | { ok: false; reason: "scope_forbidden" | "platform_admin_required" } {
  const policy = MEMORY_KIND_POLICY[input.kind];
  const allowedScopeTypes = policy.allowedScopeTypes as readonly MemoryScopeType[];
  const platformAdminOnlyScopeTypes =
    policy.platformAdminOnlyScopeTypes as readonly MemoryScopeType[];

  if (!allowedScopeTypes.includes(input.scopeType)) {
    return { ok: false, reason: "scope_forbidden" };
  }

  if (
    platformAdminOnlyScopeTypes.includes(input.scopeType) &&
    !input.isPlatformAdmin
  ) {
    return { ok: false, reason: "platform_admin_required" };
  }

  return { ok: true };
}

export const MemorySourceSchema = z.enum(["discord", "web", "admin-ui", "system"]);
export type MemorySource = z.infer<typeof MemorySourceSchema>;

export const MemoryContentSchema = z
  .object({})
  .passthrough()
  .superRefine((content: Record<string, unknown>, ctx: z.RefinementCtx) => {
    const secretPath = findSecretLikeKeyPath(content);
    if (secretPath) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `memory content contains forbidden secret-like key at: ${secretPath.join(".")}`,
      });
      return;
    }

    let bytes = 0;
    try {
      bytes = jsonUtf8SizeBytes(content);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "memory content must be JSON-serializable",
      });
      return;
    }

    if (bytes > MAX_MEMORY_CONTENT_BYTES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `memory content too large: ${bytes} bytes (max ${MAX_MEMORY_CONTENT_BYTES})`,
      });
    }
  });

export type MemoryContent = z.infer<typeof MemoryContentSchema>;

export const MemoryRecordSchema = z.object({
  scopeType: MemoryScopeTypeSchema,
  scopeId: z.string().min(1),
  kind: MemoryKindSchema,
  source: MemorySourceSchema,
  content: MemoryContentSchema,
  createdAt: z.string().refine((v: string) => !Number.isNaN(Date.parse(v)), "invalid ISO date string"),
  updatedAt: z.string().refine((v: string) => !Number.isNaN(Date.parse(v)), "invalid ISO date string"),
});

export type MemoryRecord = z.infer<typeof MemoryRecordSchema>;

export const MemoryWriteRequestSchema = z.object({
  kind: MemoryKindSchema,
  source: MemorySourceSchema,
  content: MemoryContentSchema,
});

export type MemoryWriteRequest = z.infer<typeof MemoryWriteRequestSchema>;
