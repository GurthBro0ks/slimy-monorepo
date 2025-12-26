"use strict";

const express = require("express");
const prismaDatabase = require("../lib/database");
const { requireAuth } = require("../middleware/auth");
const { internalBotAuth } = require("../middleware/internal-bot-auth");
const { isPlatformAdmin, requireGuildSettingsAdmin, resolveCallerDiscordId } = require("../services/guild-settings-authz");

let contracts = null;
try {
  contracts = require("@slimy/contracts");
} catch {
  contracts = null;
}

const router = express.Router();

function parsePositiveInt(value) {
  if (value === undefined || value === null || value === "") return null;
  const raw = String(value).trim();
  if (!/^\d+$/.test(raw)) return null;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
}

router.use(internalBotAuth);
router.use(requireAuth);

router.get("/changes-v0", async (req, res) => {
  try {
    if (!contracts) {
      return res.status(500).json({ ok: false, error: "contracts_unavailable" });
    }

    const scopeTypeRaw = String(req.query.scopeType || "").trim();
    const scopeId = String(req.query.scopeId || "").trim();
    const kindRaw = req.query.kind !== undefined ? String(req.query.kind || "").trim() : "";

    const scopeParsed = contracts.SettingsScopeTypeSchema.safeParse(scopeTypeRaw);
    if (!scopeParsed.success) {
      return res.status(400).json({ ok: false, error: "invalid_scope_type" });
    }
    const scopeType = scopeParsed.data;

    if (!scopeId) {
      return res.status(400).json({ ok: false, error: "invalid_scope_id" });
    }

    let kind = null;
    if (kindRaw) {
      const kindParsed = contracts.SettingsChangeKindSchema.safeParse(kindRaw);
      if (!kindParsed.success) {
        return res.status(400).json({ ok: false, error: "invalid_kind" });
      }
      kind = kindParsed.data;
    }

    const sinceId = parsePositiveInt(req.query.sinceId);
    if (req.query.sinceId !== undefined && sinceId === null) {
      return res.status(400).json({ ok: false, error: "invalid_since_id" });
    }

    const requestedLimit = parsePositiveInt(req.query.limit);
    if (req.query.limit !== undefined && requestedLimit === null) {
      return res.status(400).json({ ok: false, error: "invalid_limit" });
    }

    const defaultLimit = Number.isFinite(contracts.SETTINGS_CHANGES_DEFAULT_LIMIT) ? contracts.SETTINGS_CHANGES_DEFAULT_LIMIT : 50;
    const maxLimit = Number.isFinite(contracts.SETTINGS_CHANGES_MAX_LIMIT) ? contracts.SETTINGS_CHANGES_MAX_LIMIT : 200;
    const limit = Math.min(Math.max(requestedLimit ?? defaultLimit, 1), maxLimit);

    if (scopeType === "user") {
      const callerId = resolveCallerDiscordId(req);
      if (!callerId) return res.status(401).json({ ok: false, error: "unauthorized" });
      if (!isPlatformAdmin(req) && callerId !== scopeId) {
        return res.status(403).json({ ok: false, error: "forbidden" });
      }
    } else if (scopeType === "guild") {
      const authz = await requireGuildSettingsAdmin(req, scopeId);
      if (!authz.ok) {
        return res.status(authz.status || 403).json({ ok: false, error: authz.error });
      }
    }

    await prismaDatabase.initialize();
    const prisma = prismaDatabase.getClient();

    const where = { scopeType, scopeId };
    if (kind) where.kind = kind;
    if (sinceId !== null) where.id = { gt: sinceId };

    let events = [];
    if (sinceId !== null) {
      events = await prisma.settingsChangeEvent.findMany({
        where,
        orderBy: { id: "asc" },
        take: limit,
      });
    } else {
      const page = await prisma.settingsChangeEvent.findMany({
        where,
        orderBy: { id: "desc" },
        take: limit,
      });
      events = page.reverse();
    }

    const shaped = events.map((event) => ({
      id: event.id,
      createdAt: event.createdAt instanceof Date ? event.createdAt.toISOString() : String(event.createdAt),
      scopeType: event.scopeType,
      scopeId: event.scopeId,
      kind: event.kind,
      actorUserId: event.actorUserId,
      actorIsAdmin: event.actorIsAdmin,
      source: event.source ?? undefined,
      changedKeys: Array.isArray(event.changedKeys) ? event.changedKeys : event.changedKeys ?? undefined,
    }));

    const nextSinceId = shaped.length ? shaped[shaped.length - 1].id : sinceId;
    return res.json({ ok: true, events: shaped, nextSinceId });
  } catch (err) {
    console.error("[settings-changes-v0 GET] failed", { code: err?.code || err?.message });
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

module.exports = router;
