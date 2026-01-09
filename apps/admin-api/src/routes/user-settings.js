"use strict";

const express = require("express");
const { z } = require("zod");
const path = require("path");
const { requireAuth, requireRole } = require("../middleware/auth");
const { readJson, writeJson } = require("../lib/store");

const USER_SETTINGS_ROOT = path.join(process.cwd(), "data", "user-settings");

const router = express.Router();

const UserSettingsSchema = z
  .object({
    theme: z.enum(["neon", "classic", "system"]).optional(),
    chat: z
      .object({
        markdown: z.boolean().optional(),
        profanityFilter: z.boolean().optional(),
      })
      .optional(),
    snail: z
      .object({
        avatarId: z.string().optional(),
        vibe: z.string().optional(),
      })
      .optional(),
    trader: z
      .object({
        access: z.boolean().optional(),
        mode: z.enum(["shadow", "live"]).optional(),
      })
      .optional(),
  })
  .passthrough();

function defaultUserSettings() {
  return {
    theme: "system",
    chat: {
      markdown: true,
      profanityFilter: false,
    },
    snail: {},
    trader: {
      access: false,
      mode: "shadow",
    },
  };
}

async function loadUserSettings(userId) {
  const file = path.join(USER_SETTINGS_ROOT, `${userId}.json`);
  const existing = await readJson(file, null);
  if (!existing) return defaultUserSettings();

  const defaults = defaultUserSettings();
  return {
    ...defaults,
    ...existing,
    chat: { ...defaults.chat, ...(existing.chat || {}) },
    snail: { ...defaults.snail, ...(existing.snail || {}) },
    trader: { ...defaults.trader, ...(existing.trader || {}) },
  };
}

async function saveUserSettings(userId, payload) {
  const file = path.join(USER_SETTINGS_ROOT, `${userId}.json`);
  await writeJson(file, payload);
  return payload;
}

// GET /api/me/settings - Get current user's settings
router.get(
  "/me/settings",
  requireAuth,
  async (req, res) => {
    try {
      const userId = req.user?.discordId || req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "unauthorized" });
      }
      const settings = await loadUserSettings(userId);
      res.json({ ok: true, settings });
    } catch (err) {
      console.error("[user-settings GET /me/settings] failed", err);
      res.status(500).json({ error: "server_error" });
    }
  },
);

// PUT /api/me/settings - Update current user's settings
router.put(
  "/me/settings",
  requireAuth,
  express.json(),
  async (req, res) => {
    try {
      const userId = req.user?.discordId || req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "unauthorized" });
      }

      const parsed = UserSettingsSchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({
          error: "invalid_input",
          details: parsed.error.issues,
        });
      }

      const current = await loadUserSettings(userId);
      const next = {
        ...current,
        ...parsed.data,
        chat: { ...current.chat, ...(parsed.data.chat || {}) },
        snail: { ...current.snail, ...(parsed.data.snail || {}) },
        trader: { ...current.trader, ...(parsed.data.trader || {}) },
      };

      await saveUserSettings(userId, next);
      res.json({ ok: true, settings: next });
    } catch (err) {
      console.error("[user-settings PUT /me/settings] failed", err);
      res.status(500).json({ error: "server_error" });
    }
  },
);

// GET /api/users/:userId/settings - Get user settings by ID (admin only)
router.get(
  "/users/:userId/settings",
  requireRole("admin"),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const settings = await loadUserSettings(userId);
      res.json({ ok: true, settings });
    } catch (err) {
      console.error("[user-settings GET /users/:userId/settings] failed", err);
      res.status(500).json({ error: "server_error" });
    }
  },
);

// PUT /api/users/:userId/settings - Update user settings by ID (admin only)
router.put(
  "/users/:userId/settings",
  requireRole("admin"),
  express.json(),
  async (req, res) => {
    try {
      const { userId } = req.params;

      const parsed = UserSettingsSchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({
          error: "invalid_input",
          details: parsed.error.issues,
        });
      }

      const current = await loadUserSettings(userId);
      const next = {
        ...current,
        ...parsed.data,
        chat: { ...current.chat, ...(parsed.data.chat || {}) },
        snail: { ...current.snail, ...(parsed.data.snail || {}) },
        trader: { ...current.trader, ...(parsed.data.trader || {}) },
      };

      await saveUserSettings(userId, next);
      res.json({ ok: true, settings: next });
    } catch (err) {
      console.error("[user-settings PUT /users/:userId/settings] failed", err);
      res.status(500).json({ error: "server_error" });
    }
  },
);

module.exports = router;
