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

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function ensureUserSettingsShape(userId, data) {
  if (!contracts) {
    throw new Error("contracts_unavailable");
  }

  const base = contracts.defaultUserSettings(String(userId));
  const current = isPlainObject(data) ? data : {};
  const merged = {
    ...base,
    ...current,
    userId: String(userId),
    prefs: isPlainObject(current.prefs) ? current.prefs : base.prefs,
    updatedAt: typeof current.updatedAt === "string" ? current.updatedAt : base.updatedAt,
    version: Number.isFinite(Number(current.version)) ? Number(current.version) : base.version,
  };

  const parsed = contracts.UserSettingsSchema.safeParse(merged);
  return parsed.success ? parsed.data : base;
}

function ensureGuildSettingsShape(guildId, data) {
  if (!contracts) {
    throw new Error("contracts_unavailable");
  }

  const base = contracts.defaultGuildSettings(String(guildId));
  const current = isPlainObject(data) ? data : {};
  const merged = {
    ...base,
    ...current,
    guildId: String(guildId),
    prefs: isPlainObject(current.prefs) ? current.prefs : base.prefs,
    updatedAt: typeof current.updatedAt === "string" ? current.updatedAt : base.updatedAt,
    version: Number.isFinite(Number(current.version)) ? Number(current.version) : base.version,
  };

  const parsed = contracts.GuildSettingsSchema.safeParse(merged);
  return parsed.success ? parsed.data : base;
}

router.use(requireAuth);

router.get("/user/:userId", async (req, res) => {
  try {
    const targetUserId = String(req.params.userId || "").trim();
    if (!targetUserId) {
      return res.status(400).json({ ok: false, error: "invalid_user_id" });
    }

    const callerId = resolveCallerDiscordId(req);
    if (!callerId) {
      return res.status(401).json({ ok: false, error: "unauthorized" });
    }
    if (!isPlatformAdmin(req) && callerId !== targetUserId) {
      return res.status(403).json({ ok: false, error: "forbidden" });
    }

    await prismaDatabase.initialize();
    const prisma = prismaDatabase.getClient();

    const record = await prisma.userSettings.upsert({
      where: { userId: targetUserId },
      update: {},
      create: {
        userId: targetUserId,
        data: contracts ? contracts.defaultUserSettings(targetUserId) : { version: 1 },
      },
    });

    const normalized = ensureUserSettingsShape(targetUserId, record?.data);

    if (record?.data && JSON.stringify(record.data) !== JSON.stringify(normalized)) {
      await prisma.userSettings.update({
        where: { userId: targetUserId },
        data: { data: normalized },
      });
    }

    return res.json({ ok: true, settings: normalized });
  } catch (err) {
    console.error("[settings-v0 user GET] failed", { code: err?.code || err?.message });
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

router.put("/user/:userId", requireCsrf, express.json(), async (req, res) => {
  try {
    const targetUserId = String(req.params.userId || "").trim();
    if (!targetUserId) {
      return res.status(400).json({ ok: false, error: "invalid_user_id" });
    }

    const callerId = resolveCallerDiscordId(req);
    if (!callerId) {
      return res.status(401).json({ ok: false, error: "unauthorized" });
    }
    if (!isPlatformAdmin(req) && callerId !== targetUserId) {
      return res.status(403).json({ ok: false, error: "forbidden" });
    }

    if (!contracts) {
      return res.status(500).json({ ok: false, error: "contracts_unavailable" });
    }

    const incoming = req.body;
    const parsed = contracts.UserSettingsSchema.safeParse(incoming);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "invalid_settings", details: parsed.error.issues });
    }
    if (parsed.data.userId !== targetUserId) {
      return res.status(400).json({ ok: false, error: "user_id_mismatch" });
    }

    const now = new Date().toISOString();
    const base = contracts.defaultUserSettings(targetUserId);
    const next = ensureUserSettingsShape(targetUserId, {
      ...base,
      ...parsed.data,
      updatedAt: now,
    });

    await prismaDatabase.initialize();
    const prisma = prismaDatabase.getClient();

    const record = await prisma.userSettings.upsert({
      where: { userId: targetUserId },
      update: { data: next },
      create: { userId: targetUserId, data: next },
    });

    return res.json({ ok: true, settings: ensureUserSettingsShape(targetUserId, record?.data) });
  } catch (err) {
    console.error("[settings-v0 user PUT] failed", { code: err?.code || err?.message });
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

router.get("/guild/:guildId", async (req, res) => {
  try {
    const guildId = String(req.params.guildId || "").trim();
    if (!guildId) {
      return res.status(400).json({ ok: false, error: "invalid_guild_id" });
    }

    const authz = await requireGuildSettingsAdmin(req, guildId);
    if (!authz.ok) {
      return res.status(authz.status || 403).json({ ok: false, error: authz.error });
    }

    await prismaDatabase.initialize();
    const prisma = prismaDatabase.getClient();

    const guild = await prisma.guild.findUnique({ where: { id: guildId } });
    if (!guild) {
      return res.status(404).json({ ok: false, error: "guild_not_found" });
    }

    const record = await prisma.guildSettings.upsert({
      where: { guildId },
      update: {},
      create: {
        guildId,
        data: contracts ? contracts.defaultGuildSettings(guildId) : { version: 1 },
      },
    });

    const normalized = ensureGuildSettingsShape(guildId, record?.data);
    if (record?.data && JSON.stringify(record.data) !== JSON.stringify(normalized)) {
      await prisma.guildSettings.update({
        where: { guildId },
        data: { data: normalized },
      });
    }

    return res.json({ ok: true, settings: normalized });
  } catch (err) {
    console.error("[settings-v0 guild GET] failed", { code: err?.code || err?.message });
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

router.put("/guild/:guildId", requireCsrf, express.json(), async (req, res) => {
  try {
    const guildId = String(req.params.guildId || "").trim();
    if (!guildId) {
      return res.status(400).json({ ok: false, error: "invalid_guild_id" });
    }

    const authz = await requireGuildSettingsAdmin(req, guildId);
    if (!authz.ok) {
      return res.status(authz.status || 403).json({ ok: false, error: authz.error });
    }

    if (!contracts) {
      return res.status(500).json({ ok: false, error: "contracts_unavailable" });
    }

    const incoming = req.body;
    const parsed = contracts.GuildSettingsSchema.safeParse(incoming);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "invalid_settings", details: parsed.error.issues });
    }
    if (parsed.data.guildId !== guildId) {
      return res.status(400).json({ ok: false, error: "guild_id_mismatch" });
    }

    await prismaDatabase.initialize();
    const prisma = prismaDatabase.getClient();

    const guild = await prisma.guild.findUnique({ where: { id: guildId } });
    if (!guild) {
      return res.status(404).json({ ok: false, error: "guild_not_found" });
    }

    const now = new Date().toISOString();
    const base = contracts.defaultGuildSettings(guildId);
    const next = ensureGuildSettingsShape(guildId, {
      ...base,
      ...parsed.data,
      updatedAt: now,
    });

    const record = await prisma.guildSettings.upsert({
      where: { guildId },
      update: { data: next },
      create: { guildId, data: next },
    });

    return res.json({ ok: true, settings: ensureGuildSettingsShape(guildId, record?.data) });
  } catch (err) {
    console.error("[settings-v0 guild PUT] failed", { code: err?.code || err?.message });
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

module.exports = router;
