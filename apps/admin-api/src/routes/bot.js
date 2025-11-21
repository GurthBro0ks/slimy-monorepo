"use strict";

const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { requireCsrf } = require("../middleware/csrf");
const { recordAudit } = require("../services/audit");

const router = express.Router();

const BOT_RESCAN_URL = process.env.BOT_RESCAN_URL || null;

router.post("/rescan", requireAuth, requireCsrf, async (req, res) => {
  if (!BOT_RESCAN_URL) {
    return res.status(501).json({ error: "rescan_unconfigured" });
  }

  try {
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
      // Record audit log for failed rescan attempt
      await recordAudit({
        adminId: req.user?.sub || req.user?.id,
        action: "bot.rescan",
        guildId: req.body?.guildId || null,
        payload: {
          status: "failed",
          statusCode: response.status,
        },
      }).catch(err => {
        console.error("[bot] audit log failed:", err);
      });

      return res.status(response.status).send(payload);
    }

    // Record audit log for successful rescan
    await recordAudit({
      adminId: req.user?.sub || req.user?.id,
      action: "bot.rescan",
      guildId: req.body?.guildId || null,
      payload: {
        status: "success",
      },
    }).catch(err => {
      console.error("[bot] audit log failed:", err);
    });

    return res.status(200).send(payload);
  } catch (err) {
    console.error("[bot] rescan proxy error:", err);

    // Record audit log for error
    await recordAudit({
      adminId: req.user?.sub || req.user?.id,
      action: "bot.rescan",
      guildId: req.body?.guildId || null,
      payload: {
        status: "error",
        error: err.message,
      },
    }).catch(auditErr => {
      console.error("[bot] audit log failed:", auditErr);
    });

    return res.status(502).json({ error: "bot_unreachable" });
  }
});

module.exports = router;
