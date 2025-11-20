"use strict";

const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { requireAuth } = require("../middleware/auth");
const { isValidWebhookUrl } = require("../services/webhooks/sender");

const prisma = new PrismaClient();

/**
 * GET /api/webhooks
 * List webhooks for a guild
 * Query params: guildId (required)
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    const { guildId } = req.query;

    if (!guildId) {
      return res.status(400).json({
        error: "Missing required query parameter: guildId",
      });
    }

    // TODO: Add RBAC check to verify user has access to this guild

    const webhooks = await prisma.webhook.findMany({
      where: { guildId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { deliveries: true },
        },
      },
    });

    // Don't expose secret in response
    const webhooksResponse = webhooks.map((webhook) => ({
      id: webhook.id,
      guildId: webhook.guildId,
      name: webhook.name,
      targetUrl: webhook.targetUrl,
      enabled: webhook.enabled,
      eventTypes: webhook.eventTypes,
      createdAt: webhook.createdAt,
      updatedAt: webhook.updatedAt,
      deliveryCount: webhook._count.deliveries,
      hasSecret: !!webhook.secret,
    }));

    res.json({ webhooks: webhooksResponse });
  } catch (error) {
    console.error("Error fetching webhooks:", error);
    res.status(500).json({ error: "Failed to fetch webhooks" });
  }
});

/**
 * GET /api/webhooks/:id
 * Get a specific webhook by ID
 */
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const webhookId = parseInt(id, 10);

    if (isNaN(webhookId)) {
      return res.status(400).json({ error: "Invalid webhook ID" });
    }

    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
      include: {
        _count: {
          select: { deliveries: true },
        },
      },
    });

    if (!webhook) {
      return res.status(404).json({ error: "Webhook not found" });
    }

    // TODO: Add RBAC check to verify user has access to this guild

    // Don't expose secret in response
    const webhookResponse = {
      id: webhook.id,
      guildId: webhook.guildId,
      name: webhook.name,
      targetUrl: webhook.targetUrl,
      enabled: webhook.enabled,
      eventTypes: webhook.eventTypes,
      createdAt: webhook.createdAt,
      updatedAt: webhook.updatedAt,
      deliveryCount: webhook._count.deliveries,
      hasSecret: !!webhook.secret,
    };

    res.json({ webhook: webhookResponse });
  } catch (error) {
    console.error("Error fetching webhook:", error);
    res.status(500).json({ error: "Failed to fetch webhook" });
  }
});

/**
 * POST /api/webhooks
 * Create a new webhook
 * Body: { guildId, name, targetUrl, eventTypes, enabled?, secret? }
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const { guildId, name, targetUrl, eventTypes, enabled, secret } = req.body;

    // Validation
    if (!guildId || !name || !targetUrl || !eventTypes) {
      return res.status(400).json({
        error: "Missing required fields: guildId, name, targetUrl, eventTypes",
      });
    }

    // Validate URL
    if (!isValidWebhookUrl(targetUrl)) {
      return res.status(400).json({
        error: "Invalid targetUrl. Must be a valid HTTP or HTTPS URL",
      });
    }

    // Validate event types format
    if (typeof eventTypes !== "string" || eventTypes.trim() === "") {
      return res.status(400).json({
        error: "eventTypes must be a non-empty comma-separated string",
      });
    }

    // TODO: Add RBAC check to verify user has access to create webhooks for this guild

    const webhook = await prisma.webhook.create({
      data: {
        guildId,
        name: name.trim(),
        targetUrl: targetUrl.trim(),
        eventTypes: eventTypes.trim(),
        enabled: enabled !== undefined ? enabled : true,
        secret: secret || null,
      },
    });

    // Don't expose secret in response
    const webhookResponse = {
      id: webhook.id,
      guildId: webhook.guildId,
      name: webhook.name,
      targetUrl: webhook.targetUrl,
      enabled: webhook.enabled,
      eventTypes: webhook.eventTypes,
      createdAt: webhook.createdAt,
      updatedAt: webhook.updatedAt,
      hasSecret: !!webhook.secret,
    };

    res.status(201).json({ webhook: webhookResponse });
  } catch (error) {
    console.error("Error creating webhook:", error);
    res.status(500).json({ error: "Failed to create webhook" });
  }
});

/**
 * PATCH /api/webhooks/:id
 * Update a webhook
 * Body: { name?, targetUrl?, eventTypes?, enabled?, secret? }
 */
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const webhookId = parseInt(id, 10);

    if (isNaN(webhookId)) {
      return res.status(400).json({ error: "Invalid webhook ID" });
    }

    const { name, targetUrl, eventTypes, enabled, secret } = req.body;

    // Check if webhook exists
    const existingWebhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
    });

    if (!existingWebhook) {
      return res.status(404).json({ error: "Webhook not found" });
    }

    // TODO: Add RBAC check to verify user has access to this guild

    // Build update data
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (targetUrl !== undefined) {
      if (!isValidWebhookUrl(targetUrl)) {
        return res.status(400).json({
          error: "Invalid targetUrl. Must be a valid HTTP or HTTPS URL",
        });
      }
      updateData.targetUrl = targetUrl.trim();
    }
    if (eventTypes !== undefined) {
      if (typeof eventTypes !== "string" || eventTypes.trim() === "") {
        return res.status(400).json({
          error: "eventTypes must be a non-empty comma-separated string",
        });
      }
      updateData.eventTypes = eventTypes.trim();
    }
    if (enabled !== undefined) updateData.enabled = enabled;
    if (secret !== undefined) updateData.secret = secret || null;

    const webhook = await prisma.webhook.update({
      where: { id: webhookId },
      data: updateData,
    });

    // Don't expose secret in response
    const webhookResponse = {
      id: webhook.id,
      guildId: webhook.guildId,
      name: webhook.name,
      targetUrl: webhook.targetUrl,
      enabled: webhook.enabled,
      eventTypes: webhook.eventTypes,
      createdAt: webhook.createdAt,
      updatedAt: webhook.updatedAt,
      hasSecret: !!webhook.secret,
    };

    res.json({ webhook: webhookResponse });
  } catch (error) {
    console.error("Error updating webhook:", error);
    res.status(500).json({ error: "Failed to update webhook" });
  }
});

/**
 * DELETE /api/webhooks/:id
 * Delete a webhook
 */
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const webhookId = parseInt(id, 10);

    if (isNaN(webhookId)) {
      return res.status(400).json({ error: "Invalid webhook ID" });
    }

    // Check if webhook exists
    const existingWebhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
    });

    if (!existingWebhook) {
      return res.status(404).json({ error: "Webhook not found" });
    }

    // TODO: Add RBAC check to verify user has access to this guild

    await prisma.webhook.delete({
      where: { id: webhookId },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting webhook:", error);
    res.status(500).json({ error: "Failed to delete webhook" });
  }
});

/**
 * GET /api/webhooks/:id/deliveries
 * Get delivery history for a webhook
 * Query params: limit (default 50), offset (default 0)
 */
router.get("/:id/deliveries", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const webhookId = parseInt(id, 10);
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;

    if (isNaN(webhookId)) {
      return res.status(400).json({ error: "Invalid webhook ID" });
    }

    // Check if webhook exists
    const existingWebhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
    });

    if (!existingWebhook) {
      return res.status(404).json({ error: "Webhook not found" });
    }

    // TODO: Add RBAC check to verify user has access to this guild

    const deliveries = await prisma.webhookDelivery.findMany({
      where: { webhookId },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 100), // Max 100 at a time
      skip: offset,
    });

    const total = await prisma.webhookDelivery.count({
      where: { webhookId },
    });

    res.json({
      deliveries,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching webhook deliveries:", error);
    res.status(500).json({ error: "Failed to fetch webhook deliveries" });
  }
});

module.exports = router;
