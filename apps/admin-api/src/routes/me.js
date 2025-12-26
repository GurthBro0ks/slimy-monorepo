"use strict";

const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { requireCsrf } = require("../middleware/csrf");
const prismaDatabase = require("../lib/database");
const {
  DEFAULT_VERSION,
  defaultUserSettings,
  mergeSettings,
} = require("../services/central-settings");

const router = express.Router();

function resolveUserDiscordId(req) {
  const raw = req.user?.user || req.user || null;
  const id = raw?.discordId || raw?.id || raw?.sub || null;
  return id ? String(id) : null;
}

async function ensureUserRecord(prisma, userDiscordId, reqUser) {
  await prisma.user.upsert({
    where: { discordId: userDiscordId },
    update: {
      username: reqUser?.username || undefined,
      globalName: reqUser?.globalName || reqUser?.username || undefined,
      avatar: reqUser?.avatar ?? undefined,
      email: reqUser?.email || undefined,
    },
    create: {
      discordId: userDiscordId,
      username: reqUser?.username || null,
      globalName: reqUser?.globalName || reqUser?.username || null,
      avatar: reqUser?.avatar || null,
      email: reqUser?.email || null,
    },
  });
}

router.use(requireAuth);

router.get("/settings", async (req, res) => {
  try {
    const userDiscordId = resolveUserDiscordId(req);
    if (!userDiscordId) {
      return res.status(401).json({ ok: false, error: "unauthorized" });
    }

    await prismaDatabase.initialize();
    const prisma = prismaDatabase.getClient();

    await ensureUserRecord(prisma, userDiscordId, req.user);

    const record = await prisma.userSettings.upsert({
      where: { userId: userDiscordId },
      update: {},
      create: {
        userId: userDiscordId,
        data: defaultUserSettings(userDiscordId),
      },
    });

    const settings = record?.data || defaultUserSettings(userDiscordId);
    const version = Number.isFinite(Number(settings?.version))
      ? Number(settings.version)
      : DEFAULT_VERSION;

    return res.json({ ok: true, settings, version });
  } catch (err) {
    console.error("[me/settings GET] failed", { code: err?.code || err?.message });
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

router.patch("/settings", requireCsrf, express.json(), async (req, res) => {
  try {
    const userDiscordId = resolveUserDiscordId(req);
    if (!userDiscordId) {
      return res.status(401).json({ ok: false, error: "unauthorized" });
    }

    const patch = req.body;
    if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
      return res.status(400).json({ ok: false, error: "invalid_patch" });
    }

    await prismaDatabase.initialize();
    const prisma = prismaDatabase.getClient();

    await ensureUserRecord(prisma, userDiscordId, req.user);

    const existing = await prisma.userSettings.findUnique({
      where: { userId: userDiscordId },
    });
    const current = existing?.data || defaultUserSettings(userDiscordId);
    const next = mergeSettings(current, patch);

    const record = await prisma.userSettings.upsert({
      where: { userId: userDiscordId },
      update: {
        data: next,
      },
      create: {
        userId: userDiscordId,
        data: next,
      },
    });

    const settings = record?.data || next;
    const version = Number.isFinite(Number(settings?.version))
      ? Number(settings.version)
      : DEFAULT_VERSION;
    return res.json({ ok: true, settings, version });
  } catch (err) {
    console.error("[me/settings PATCH] failed", { code: err?.code || err?.message });
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

module.exports = router;
