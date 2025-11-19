"use strict";

const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { requireCsrf } = require("../middleware/csrf");
const { ConfigurationError, ExternalServiceError } = require("../lib/errors");

const router = express.Router();

const BOT_RESCAN_URL = process.env.BOT_RESCAN_URL || null;

router.post("/rescan", requireAuth, requireCsrf, async (req, res, next) => {
  try {
    if (!BOT_RESCAN_URL) {
      throw new ConfigurationError("Bot rescan URL is not configured");
    }

    const response = await fetch(BOT_RESCAN_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(req.body || {}),
    });

    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json().catch(() => ({}))
      : await response.text();

    if (!response.ok) {
      return res.status(response.status).send(payload);
    }

    return res.status(200).send(payload);
  } catch (err) {
    if (err.name === 'ConfigurationError') {
      return next(err);
    }
    console.error("[bot] rescan proxy error:", err);
    next(new ExternalServiceError("bot", "Bot service is currently unreachable"));
  }
});

module.exports = router;
