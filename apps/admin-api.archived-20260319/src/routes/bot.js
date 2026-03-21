"use strict";

const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { requireCsrf } = require("../middleware/csrf");

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
    let payload;
    if (contentType.includes("application/json")) {
      try {
        payload = await response.json();
      } catch (err) {
        console.error("[bot] JSON parsing failed", {
          status: response.status,
          contentType,
          error: err.message
        });
        // Return error instead of silently using empty object
        return res.status(502).json({
          error: "invalid-json-response",
          message: "Bot service returned malformed JSON"
        });
      }
    } else {
      payload = await response.text();
    }

    if (!response.ok) {
      return res.status(response.status).send(payload);
    }

    return res.status(200).send(payload);
  } catch (err) {
    console.error("[bot] rescan proxy error:", err);
    return res.status(502).json({ error: "bot_unreachable" });
  }
});

module.exports = router;
