"use strict";

const express = require("express");
const multer = require("multer");
const { z } = require("zod");

const { requireAuth } = require("../middleware/auth");
const { requireCsrf } = require("../middleware/csrf");
const { requireRole, requireGuildAccess } = require("../middleware/rbac");
const { validateBody, validateQuery } = require("../middleware/validate");
const personalityService = require("../services/personality");
const channelService = require("../services/channels");
const correctionsService = require("../services/corrections");
const usageService = require("../services/usage");
const healthService = require("../services/health");
const { rescanMember } = require("../services/rescan");
const { recordAudit } = require("../services/audit");
const guildService = require("../services/guild.service");
const { AuthenticationError } = require("../lib/errors");
const prismaDatabase = require("../lib/database");
const {
  botInstalledInGuild,
  getSharedGuildsForUser,
  getSlimyBotToken,
} = require("../services/discord-shared-guilds");
const {
  DEFAULT_VERSION,
  defaultGuildSettings,
  mergeSettings,
} = require("../services/central-settings");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 6 * 1024 * 1024,
  },
});

const router = express.Router();

const DISCORD_API_BASE = "https://discord.com/api/v10";
const PRIMARY_GUILD_ID = "1176605506912141444";
const ADMIN_ROLE_IDS = new Set(["1178129227321712701", "1216250443257217124"]);

const ADMIN_PERMISSION = 0x8n;
const MANAGE_GUILD_PERMISSION = 0x20n;

function hasAdminOrManagePermission(permissions) {
  if (permissions === undefined || permissions === null) return false;
  try {
    const permsBigInt = BigInt(permissions);
    const isAdmin = (permsBigInt & ADMIN_PERMISSION) === ADMIN_PERMISSION;
    const canManage = (permsBigInt & MANAGE_GUILD_PERMISSION) === MANAGE_GUILD_PERMISSION;
    return isAdmin || canManage;
  } catch {
    return false;
  }
}

async function fetchWith429Retry(url, options, maxRetries = 3) {
  let attempt = 0;
  while (true) {
    const res = await fetch(url, options);
    if (res.status !== 429 || attempt >= maxRetries) return res;
    attempt += 1;
    const retryAfter = Number(res.headers?.get?.("retry-after") || "1");
    await new Promise((r) => setTimeout(r, Math.max(250, Math.min(10_000, retryAfter * 1000))));
  }
}

async function fetchUserGuilds(discordAccessToken) {
  const res = await fetch(`${DISCORD_API_BASE}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${discordAccessToken}` },
  });
  if (!res.ok) {
    const err = new Error(`discord_user_guilds_failed:${res.status}`);
    err.status = res.status;
    throw err;
  }
  const guilds = await res.json();
  return Array.isArray(guilds) ? guilds : [];
}

async function fetchMemberRoles(guildId, userDiscordId, botToken) {
  const res = await fetchWith429Retry(
    `${DISCORD_API_BASE}/guilds/${guildId}/members/${userDiscordId}`,
    { headers: { Authorization: `Bot ${botToken}` } },
  );
  if (!res.ok) return null;
  const member = await res.json().catch(() => null);
  const roles = member?.roles;
  return Array.isArray(roles) ? roles.map(String) : [];
}

function canManageByPrimaryRoles(roleIds) {
  const roles = new Set((roleIds || []).map(String));
  return [...ADMIN_ROLE_IDS].some((id) => roles.has(String(id)));
}

async function requireGuildSettingsAdmin(req) {
  const guildId = String(req.params.guildId || "");
  const userDiscordId = String(req.user?.discordId || req.user?.id || "");
  if (!guildId || !userDiscordId) {
    return { ok: false, status: 401, error: "unauthorized" };
  }

  const botToken = getSlimyBotToken();
  if (!botToken) {
    return { ok: false, status: 500, error: "MISSING_SLIMYAI_BOT_TOKEN" };
  }

  const botInGuild = await botInstalledInGuild(guildId, botToken);
  if (!botInGuild) {
    return { ok: false, status: 403, error: "BOT_NOT_IN_GUILD" };
  }

  await prismaDatabase.initialize();
  const userRecord = await prismaDatabase.findUserByDiscordId(userDiscordId);
  if (!userRecord) {
    return { ok: false, status: 404, error: "user_not_found" };
  }
  if (!userRecord.discordAccessToken) {
    return { ok: false, status: 400, error: "missing_discord_token" };
  }

  if (guildId === PRIMARY_GUILD_ID) {
    const roles = await fetchMemberRoles(PRIMARY_GUILD_ID, userDiscordId, botToken);
    if (roles) {
      return canManageByPrimaryRoles(roles)
        ? { ok: true, roleSource: "roles" }
        : { ok: false, status: 403, error: "forbidden" };
    }
  }

  const guilds = await fetchUserGuilds(userRecord.discordAccessToken);
  const g = guilds.find((entry) => String(entry?.id) === guildId);
  if (!g) {
    return { ok: false, status: 403, error: "USER_NOT_IN_GUILD" };
  }
  const allowed = Boolean(g.owner) || hasAdminOrManagePermission(g.permissions);
  return allowed
    ? { ok: true, roleSource: "permissions" }
    : { ok: false, status: 403, error: "forbidden" };
}

const personalitySchema = z.object({
  profile: z.record(z.any()).default({}),
});

const channelEntrySchema = z.object({
  channelId: z.string().min(1),
  channelName: z.string().min(1).optional(),
  modes: z.record(z.any()).default({}),
  allowlist: z.array(z.string()).default([]),
});

const channelsSchema = z.object({
  channels: z.array(channelEntrySchema).default([]),
});

const correctionsQuerySchema = z.object({
  weekId: z.string().optional(),
});

const correctionSchema = z
  .object({
    weekId: z.string().optional(),
    memberKey: z.string().optional(),
    displayName: z.string().optional(),
    memberInput: z.string().optional(),
    metric: z.enum(["total", "sim"]),
    value: z.union([z.number(), z.string()]),
    reason: z.string().optional(),
  })
  .refine(
    (data) => data.memberKey || data.displayName || data.memberInput,
    "memberKey or displayName is required",
  );

const usageQuerySchema = z.object({
  window: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    await prismaDatabase.initialize();
    const lookupId = req.user.discordId || req.user.id;
    const userRecord = await prismaDatabase.findUserByDiscordId(lookupId);
    if (!userRecord) {
      return res.status(404).json({ error: "user_not_found" });
    }
    if (!userRecord.discordAccessToken) {
      return res.status(400).json({ error: "missing_discord_token" });
    }

    const guilds = await getSharedGuildsForUser({
      discordAccessToken: userRecord.discordAccessToken,
      userDiscordId: String(lookupId),
      concurrency: 4,
    });

    return res.json({ guilds });
  } catch (err) {
    const code = err?.code || err?.message || "server_error";
    if (code === "MISSING_SLIMYAI_BOT_TOKEN") {
      return res.status(500).json({ error: "MISSING_SLIMYAI_BOT_TOKEN" });
    }
    console.error("[guilds] failed to fetch shared guilds", { code });
    return res.status(500).json({ error: "server_error" });
  }
});

router.post(
  "/connect",
  requireAuth,
  validateBody(z.object({
    guildId: z.string(),
    name: z.string(),
    icon: z.string().nullable().optional(),
  })),
  async (req, res, next) => {
    try {
      const userId = guildService.resolveUserId(req.user);
      if (!userId) {
        throw new AuthenticationError("User session missing id");
      }

      // Enforce shared-only connection
      const SLIMYAI_BOT_TOKEN = getSlimyBotToken();
      if (!SLIMYAI_BOT_TOKEN) {
        console.error("[guilds/connect] Missing SLIMYAI_BOT_TOKEN");
        return res.status(500).json({ error: "MISSING_SLIMYAI_BOT_TOKEN" });
      }

      await prismaDatabase.initialize();
      const lookupId = req.user.discordId || req.user.id;
      const userRecord = await prismaDatabase.findUserByDiscordId(lookupId);
      
      if (!userRecord || !userRecord.discordAccessToken) {
        return res.status(401).json({ error: "UNAUTHENTICATED" });
      }

      // Fetch User Guilds
      const userGuildsResponse = await fetch("https://discord.com/api/v10/users/@me/guilds", {
        headers: { Authorization: `Bearer ${userRecord.discordAccessToken}` },
      });

      if (!userGuildsResponse.ok) {
        return res.status(userGuildsResponse.status).json({ error: "DISCORD_USER_GUILDS_FAILED" });
      }
      const userGuilds = await userGuildsResponse.json();
      const userInGuild = userGuilds.some(g => g.id === req.validated.body.guildId);

      if (!userInGuild) {
        return res.status(403).json({ error: "USER_NOT_IN_GUILD" });
      }

      const botInGuild = await botInstalledInGuild(
        String(req.validated.body.guildId),
        SLIMYAI_BOT_TOKEN,
      );
      if (!botInGuild) {
        return res.status(403).json({ error: "BOT_NOT_IN_GUILD" });
      }

      const guild = await guildService.connectGuild(
        { ...req.user, id: userId, sub: req.user?.sub || userId, discordId: req.user?.discordId || req.user?.discord_id || userId },
        req.validated.body,
      );
      res.json(guild);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/:guildId",
  requireAuth,
  async (req, res, next) => {
    try {
      const { guildId } = req.params;
      const guild = await guildService.getGuild(guildId);
      if (!guild) return res.status(404).json({ error: 'Guild not found' });

      // Calculate user role based on permissions
      // We need to fetch the user's permissions for this guild from Discord or cache
      // Since we don't have easy access to Discord API here without a token, 
      // we rely on the fact that only admins can connect/view this for now, 
      // OR we check the cached UserGuild if it exists.

      // However, the requirement is:
      // If (permissions & 0x8) === 0x8 (Admin) or (permissions & 0x20) === 0x20 (Manage Guild), role is ADMIN. Else MEMBER.
      // We can get this from the session or the UserGuild record if we had it.
      // But getGuild(guildId) returns the guild.

      // Let's fetch the UserGuild record to get roles/permissions if stored, 
      // OR we might need to rely on what was passed during auth/connect.

      // Actually, let's look at how we can get the permissions.
      // In auth.js, we fetch guilds and permissions.
      // But here we are just fetching the guild from DB.

      // Let's check if the user is the owner.
      let userRole = 'MEMBER';
      if (guild.ownerId === req.user.id) {
        userRole = 'ADMIN';
      } else {
        // Check UserGuild for roles
        // Note: checkPermission returns a boolean, so we just call it below.

        // We need to fetch UserGuild directly to check roles.
        // But wait, the prompt says: "When fetching a guild, calculate the user's role based on their Discord Permissions in that guild."
        // We don't store Discord Permissions in UserGuild, we store 'roles' (array of strings like 'admin', 'owner').
        // And in auth.js we map Discord perms to these roles.

        // So we should check if the user has 'admin' or 'owner' role in UserGuild.
        const isAdmin = await guildService.checkPermission(req.user.id, guildId, 'manage_guild');
        if (isAdmin) {
          userRole = 'ADMIN';
        }
      }

      res.json({ ...guild, userRole });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/:guildId/settings",
  async (req, res, next) => {
    try {
      const authz = await requireGuildSettingsAdmin(req, res);
      if (!authz.ok) {
        return res.status(authz.status || 403).json({ ok: false, error: authz.error });
      }

      await prismaDatabase.initialize();
      const prisma = prismaDatabase.getClient();
      const guildId = String(req.params.guildId);

      const guild = await prisma.guild.findUnique({ where: { id: guildId } });
      if (!guild) {
        return res.status(404).json({ ok: false, error: "guild_not_connected" });
      }

      const record = await prisma.guildSettings.upsert({
        where: { guildId },
        update: {},
        create: {
          guildId,
          data: defaultGuildSettings(),
        },
      });

      const settings = record?.data || defaultGuildSettings();
      const version = Number.isFinite(Number(settings?.version))
        ? Number(settings.version)
        : DEFAULT_VERSION;

      return res.json({ ok: true, settings, version, roleSource: authz.roleSource || null });
    } catch (err) {
      next(err);
    }
  },
);

async function updateCentralGuildSettings(req, res, next) {
  try {
    const authz = await requireGuildSettingsAdmin(req, res);
    if (!authz.ok) {
      return res.status(authz.status || 403).json({ ok: false, error: authz.error });
    }

    const patch = req.body;
    if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
      return res.status(400).json({ ok: false, error: "invalid_patch" });
    }

    await prismaDatabase.initialize();
    const prisma = prismaDatabase.getClient();
    const guildId = String(req.params.guildId);

    const guild = await prisma.guild.findUnique({ where: { id: guildId } });
    if (!guild) {
      return res.status(404).json({ ok: false, error: "guild_not_connected" });
    }

    const existing = await prisma.guildSettings.findUnique({ where: { guildId } });
    const current = existing?.data || defaultGuildSettings();
    const nextSettings = mergeSettings(current, patch);

    const record = await prisma.guildSettings.upsert({
      where: { guildId },
      update: { data: nextSettings },
      create: { guildId, data: nextSettings },
    });

    await recordAudit({
      adminId: req.user?.sub || req.user?.id || null,
      action: "guild.settings.update",
      guildId,
      payload: Object.keys(patch || {}).sort(),
    });

    const settings = record?.data || nextSettings;
    const version = Number.isFinite(Number(settings?.version))
      ? Number(settings.version)
      : DEFAULT_VERSION;
    return res.json({ ok: true, settings, version, roleSource: authz.roleSource || null });
  } catch (err) {
    next(err);
  }
}

router.patch("/:guildId/settings", requireCsrf, express.json(), updateCentralGuildSettings);
// Back-compat for existing clients using PUT
router.put("/:guildId/settings", requireCsrf, express.json(), updateCentralGuildSettings);

router.get(
  "/:guildId/personality",
  requireGuildAccess,
  async (req, res, next) => {
    try {
      const record = await personalityService.getPersonality(
        req.params.guildId,
      );
      res.json(record);
    } catch (err) {
      next(err);
    }
  },
);

router.put(
  "/:guildId/personality",
  requireGuildAccess,
  requireRole("editor"),
  requireCsrf,
  validateBody(personalitySchema),
  async (req, res, next) => {
    try {
      const record = await personalityService.updatePersonality(
        req.params.guildId,
        req.validated.body.profile,
        { userId: req.user.sub },
      );
      await recordAudit({
        adminId: req.user.sub,
        action: "guild.personality.update",
        guildId: req.params.guildId,
      });
      res.json(record);
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/:guildId/channels",
  requireGuildAccess,
  async (req, res, next) => {
    try {
      const channels = await channelService.getChannelSettings(
        req.params.guildId,
      );
      res.json({ channels });
    } catch (err) {
      next(err);
    }
  },
);

router.put(
  "/:guildId/channels",
  requireGuildAccess,
  requireRole("editor"),
  requireCsrf,
  validateBody(channelsSchema),
  async (req, res, next) => {
    try {
      const result = await channelService.replaceChannelSettings(
        req.params.guildId,
        req.validated.body.channels,
        { userId: req.user.sub },
      );
      await recordAudit({
        adminId: req.user.sub,
        action: "guild.channels.update",
        guildId: req.params.guildId,
        payload: { count: req.validated.body.channels.length },
      });
      res.json({ channels: result });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/:guildId/corrections",
  requireGuildAccess,
  validateQuery(correctionsQuerySchema),
  async (req, res, next) => {
    try {
      const corrections = await correctionsService.listCorrections(
        req.params.guildId,
        req.validated?.query?.weekId,
      );
      res.json({ corrections });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/:guildId/corrections",
  requireGuildAccess,
  requireRole("editor"),
  requireCsrf,
  validateBody(correctionSchema),
  async (req, res, next) => {
    try {
      const result = await correctionsService.createCorrection(
        req.params.guildId,
        req.validated.body,
        { userId: req.user.sub },
      );
      await recordAudit({
        adminId: req.user.sub,
        action: "guild.corrections.add",
        guildId: req.params.guildId,
        payload: req.validated.body,
      });
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  "/:guildId/corrections/:correctionId",
  requireGuildAccess,
  requireRole("editor"),
  requireCsrf,
  async (req, res, next) => {
    try {
      const correctionId = Number(req.params.correctionId);
      if (!Number.isFinite(correctionId)) {
        return res.status(400).json({ error: "invalid-correction-id" });
      }

      const success = await correctionsService.deleteCorrectionById(
        req.params.guildId,
        correctionId,
      );
      if (!success) {
        return res.status(404).json({ error: "not-found" });
      }
      await recordAudit({
        adminId: req.user.sub,
        action: "guild.corrections.delete",
        guildId: req.params.guildId,
        payload: { id: correctionId },
      });
      return res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/:guildId/rescan-user",
  requireGuildAccess,
  requireRole("editor"),
  requireCsrf,
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "file-required" });
      }

      const result = await rescanMember(
        req.params.guildId,
        {
          fileBuffer: req.file.buffer,
          fileMime: req.file.mimetype,
          filename: req.file.originalname,
          memberInput: req.body.member || req.body.memberInput,
          metric: req.body.metric,
          weekId: req.body.weekId,
        },
        { userId: req.user.sub },
      );

      await recordAudit({
        adminId: req.user.sub,
        action: "guild.rescan",
        guildId: req.params.guildId,
        payload: { member: req.body.member, metric: result.metric },
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/:guildId/usage",
  requireGuildAccess,
  validateQuery(usageQuerySchema),
  async (req, res, next) => {
    try {
      const result = await usageService.getUsage(req.params.guildId, {
        window: req.validated?.query?.window,
        startDate: req.validated?.query?.startDate,
        endDate: req.validated?.query?.endDate,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/:guildId/health",
  requireGuildAccess,
  async (req, res, next) => {
    try {
      const result = await healthService.getHealth(req.params.guildId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/:guildId/export/corrections.csv",
  requireGuildAccess,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const rows = await correctionsService.fetchCorrectionsForExport(
        req.params.guildId,
      );
      const csv = correctionsService.correctionsToCsv(rows);

      await recordAudit({
        adminId: req.user.sub,
        action: "guild.export.corrections.csv",
        guildId: req.params.guildId,
        payload: { count: rows.length },
      });

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${req.params.guildId}-corrections.csv"`,
      );
      res.setHeader("Cache-Control", "no-store");
      res.send(csv);
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/:guildId/export/corrections.json",
  requireGuildAccess,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const rows = await correctionsService.fetchCorrectionsForExport(
        req.params.guildId,
      );
      await recordAudit({
        adminId: req.user.sub,
        action: "guild.export.corrections.json",
        guildId: req.params.guildId,
        payload: { count: rows.length },
      });
      res.setHeader("Content-Disposition", `attachment; filename="${req.params.guildId}-corrections.json"`);
      res.setHeader("Cache-Control", "no-store");
      res.json(rows);
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/:guildId/export/personality.json",
  requireGuildAccess,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const record = await personalityService.getPersonality(req.params.guildId);
      await recordAudit({
        adminId: req.user.sub,
        action: "guild.export.personality.json",
        guildId: req.params.guildId,
      });
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${req.params.guildId}-personality.json"`,
      );
      res.setHeader("Cache-Control", "no-store");
      res.json(record.profile || {});
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
