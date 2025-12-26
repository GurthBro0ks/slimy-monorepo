"use strict";

const express = require("express");
const prismaDatabase = require("../lib/database");
const { requireAuth } = require("../middleware/auth");
const { requireCsrf } = require("../middleware/csrf");
const { isPlatformAdmin, requireGuildSettingsAdmin, resolveCallerDiscordId } = require("../services/guild-settings-authz");

let contracts = null;
try {
  contracts = require("@slimy/contracts");
} catch {
  contracts = null;
}

const router = express.Router();

function normalizeScopeType(value) {
  const v = String(value || "").trim();
  return v;
}

router.use(requireAuth);

function isProjectStateKind(kind) {
  return kind === "project_state";
}

function ensureMemoryKindAllowed({ scopeType, kind, req }) {
  if (scopeType === "user" && isProjectStateKind(kind) && !isPlatformAdmin(req)) {
    return { ok: false, status: 403, error: "kind_forbidden" };
  }

  return { ok: true };
}

router.get("/:scopeType/:scopeId", async (req, res) => {
  try {
    if (!contracts) {
      return res.status(500).json({ ok: false, error: "contracts_unavailable" });
    }

    const scopeTypeRaw = normalizeScopeType(req.params.scopeType);
    const scopeId = String(req.params.scopeId || "").trim();
    const kind = req.query?.kind ? String(req.query.kind).trim() : null;

    const scopeParsed = contracts.MemoryScopeTypeSchema.safeParse(scopeTypeRaw);
    if (!scopeParsed.success) {
      return res.status(400).json({ ok: false, error: "invalid_scope_type" });
    }
    if (!scopeId) {
      return res.status(400).json({ ok: false, error: "invalid_scope_id" });
    }

    const scopeType = scopeParsed.data;
    if (scopeType === "user") {
      const callerId = resolveCallerDiscordId(req);
      if (!callerId) {
        return res.status(401).json({ ok: false, error: "unauthorized" });
      }
      if (!isPlatformAdmin(req) && callerId !== scopeId) {
        return res.status(403).json({ ok: false, error: "forbidden" });
      }
    } else if (scopeType === "guild" && !isPlatformAdmin(req)) {
      const authz = await requireGuildSettingsAdmin(req, scopeId);
      if (!authz.ok) {
        return res.status(authz.status || 403).json({ ok: false, error: authz.error });
      }
    }

    let kindParsed = null;
    if (kind) {
      const parsed = contracts.MemoryKindSchema.safeParse(kind);
      if (!parsed.success) {
        return res.status(400).json({ ok: false, error: "invalid_kind" });
      }
      kindParsed = parsed.data;
    }

    if (kindParsed) {
      const kindAllowed = ensureMemoryKindAllowed({ scopeType, kind: kindParsed, req });
      if (!kindAllowed.ok) {
        return res.status(kindAllowed.status || 403).json({ ok: false, error: kindAllowed.error });
      }
    }

    await prismaDatabase.initialize();
    const prisma = prismaDatabase.getClient();

    const records = await prisma.memoryRecord.findMany({
      where: {
        scopeType,
        scopeId,
        ...(kindParsed ? { kind: kindParsed } : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });

    const mapped = records
      .map((r) => ({
        scopeType: r.scopeType,
        scopeId: r.scopeId,
        kind: r.kind,
        source: r.source,
        content: r.content,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }))
      .map((r) => {
        const parsed = contracts.MemoryRecordSchema.safeParse(r);
        return parsed.success ? parsed.data : null;
      })
      .filter(Boolean);

    return res.json({ ok: true, records: mapped });
  } catch (err) {
    console.error("[memory-v0 GET] failed", { code: err?.code || err?.message });
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

router.post("/:scopeType/:scopeId", requireCsrf, express.json(), async (req, res) => {
  try {
    if (!contracts) {
      return res.status(500).json({ ok: false, error: "contracts_unavailable" });
    }

    const scopeTypeRaw = normalizeScopeType(req.params.scopeType);
    const scopeId = String(req.params.scopeId || "").trim();
    const scopeParsed = contracts.MemoryScopeTypeSchema.safeParse(scopeTypeRaw);
    if (!scopeParsed.success) {
      return res.status(400).json({ ok: false, error: "invalid_scope_type" });
    }
    if (!scopeId) {
      return res.status(400).json({ ok: false, error: "invalid_scope_id" });
    }

    const scopeType = scopeParsed.data;
    if (scopeType === "user") {
      const callerId = resolveCallerDiscordId(req);
      if (!callerId) {
        return res.status(401).json({ ok: false, error: "unauthorized" });
      }
      if (!isPlatformAdmin(req) && callerId !== scopeId) {
        return res.status(403).json({ ok: false, error: "forbidden" });
      }
    } else if (scopeType === "guild" && !isPlatformAdmin(req)) {
      const authz = await requireGuildSettingsAdmin(req, scopeId);
      if (!authz.ok) {
        return res.status(authz.status || 403).json({ ok: false, error: authz.error });
      }
    }

    const parsed = contracts.MemoryWriteRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "invalid_memory", details: parsed.error.issues });
    }

    const kindAllowed = ensureMemoryKindAllowed({ scopeType, kind: parsed.data.kind, req });
    if (!kindAllowed.ok) {
      return res.status(kindAllowed.status || 403).json({ ok: false, error: kindAllowed.error });
    }

    await prismaDatabase.initialize();
    const prisma = prismaDatabase.getClient();

    const existing = await prisma.memoryRecord.findFirst({
      where: { scopeType, scopeId, kind: parsed.data.kind },
      orderBy: { updatedAt: "desc" },
    });

    const record = existing
      ? await prisma.memoryRecord.update({
          where: { id: existing.id },
          data: {
            source: parsed.data.source,
            content: parsed.data.content,
          },
        })
      : await prisma.memoryRecord.create({
          data: {
            scopeType,
            scopeId,
            kind: parsed.data.kind,
            source: parsed.data.source,
            content: parsed.data.content,
          },
        });

    const outgoing = {
      scopeType: record.scopeType,
      scopeId: record.scopeId,
      kind: record.kind,
      source: record.source,
      content: record.content,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };

    const validated = contracts.MemoryRecordSchema.safeParse(outgoing);
    if (!validated.success) {
      return res.status(500).json({ ok: false, error: "invalid_persisted_record" });
    }

    return res.status(existing ? 200 : 201).json({ ok: true, record: validated.data });
  } catch (err) {
    console.error("[memory-v0 POST] failed", { code: err?.code || err?.message });
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

module.exports = router;
