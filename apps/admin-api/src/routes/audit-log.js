"use strict";

const express = require("express");
const { z } = require("zod");

const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");
const { validateBody, validateQuery } = require("../middleware/validate");
const database = require("../lib/database");
const { NotFoundError, ValidationError } = require("../lib/errors");
const { apiHandler } = require("../lib/errors");

const router = express.Router();

// Validation schemas
const createAuditLogSchema = z.object({
  userId: z.string().optional().nullable(),
  guildId: z.string().optional().nullable(),
  action: z.string().min(1, "action is required"),
  resourceType: z.string().min(1, "resourceType is required"),
  resourceId: z.string().min(1, "resourceId is required"),
  details: z.record(z.any()).optional().nullable(),
  metadata: z.record(z.any()).optional().nullable(),
  ipAddress: z.string().optional().nullable(),
  userAgent: z.string().optional().nullable(),
  sessionId: z.string().optional().nullable(),
  requestId: z.string().optional().nullable(),
  success: z.boolean().optional().default(true),
  errorMessage: z.string().optional().nullable(),
  timestamp: z.string().datetime().optional().nullable(),
});

const listAuditLogsSchema = z.object({
  userId: z.string().optional(),
  guildId: z.string().optional(),
  action: z.string().optional(),
  resourceType: z.string().optional(),
  resourceId: z.string().optional(),
  success: z.enum(["true", "false"]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(1000).optional().default(100),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

// Middleware to extract request metadata
function attachRequestMetadata(req, res, next) {
  req.auditMetadata = {
    ipAddress: req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || req.ip,
    userAgent: req.headers["user-agent"],
    sessionId: req.session?.id,
    requestId: req.id,
  };
  next();
}

// Apply auth middleware to all routes
router.use(requireAuth);
router.use(attachRequestMetadata);

/**
 * POST /api/audit-log
 * Create a new audit log entry
 */
router.post(
  "/",
  validateBody(createAuditLogSchema),
  apiHandler(async (req, res) => {
    if (!database.isConfigured()) {
      throw new ValidationError("Database not configured");
    }

    const payload = req.validated.body;

    // Merge request metadata with payload (payload takes precedence)
    const auditData = {
      userId: payload.userId ?? req.user?.id ?? null,
      action: payload.action,
      resourceType: payload.resourceType,
      resourceId: payload.resourceId,
      details: payload.details || {},
      ipAddress: payload.ipAddress ?? req.auditMetadata.ipAddress,
      userAgent: payload.userAgent ?? req.auditMetadata.userAgent,
      sessionId: payload.sessionId ?? req.auditMetadata.sessionId,
      requestId: payload.requestId ?? req.auditMetadata.requestId,
      success: payload.success,
      errorMessage: payload.errorMessage,
    };

    const auditLog = await database.createAuditLog(auditData);

    return {
      ok: true,
      auditLog: {
        id: auditLog.id,
        userId: auditLog.userId,
        action: auditLog.action,
        resourceType: auditLog.resourceType,
        resourceId: auditLog.resourceId,
        details: auditLog.details,
        timestamp: auditLog.timestamp.toISOString(),
        success: auditLog.success,
      },
    };
  }, { routeName: "audit-log/create" })
);

/**
 * GET /api/audit-log
 * List audit log entries with filtering and pagination
 */
router.get(
  "/",
  requireRole("admin"),
  validateQuery(listAuditLogsSchema),
  apiHandler(async (req, res) => {
    if (!database.isConfigured()) {
      throw new ValidationError("Database not configured");
    }

    const filters = {
      userId: req.validated.query.userId,
      action: req.validated.query.action,
      resourceType: req.validated.query.resourceType,
      resourceId: req.validated.query.resourceId,
      success: req.validated.query.success === "true" ? true : req.validated.query.success === "false" ? false : undefined,
      startDate: req.validated.query.startDate,
      endDate: req.validated.query.endDate,
      limit: req.validated.query.limit,
      offset: req.validated.query.offset,
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

    const auditLogs = await database.getAuditLogs(filters);

    return {
      ok: true,
      logs: auditLogs.map(log => ({
        id: log.id,
        userId: log.userId,
        user: log.user ? {
          id: log.user.id,
          username: log.user.username,
          globalName: log.user.globalName,
        } : null,
        action: log.action,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        details: log.details,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        sessionId: log.sessionId,
        requestId: log.requestId,
        timestamp: log.timestamp.toISOString(),
        success: log.success,
        errorMessage: log.errorMessage,
      })),
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        hasMore: auditLogs.length === filters.limit,
      },
    };
  }, { routeName: "audit-log/list" })
);

/**
 * GET /api/audit-log/stats
 * Get audit log statistics
 */
router.get(
  "/stats",
  requireRole("admin"),
  validateQuery(z.object({
    userId: z.string().optional(),
    action: z.string().optional(),
    resourceType: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  })),
  apiHandler(async (req, res) => {
    if (!database.isConfigured()) {
      throw new ValidationError("Database not configured");
    }

    const filters = {
      userId: req.validated.query.userId,
      action: req.validated.query.action,
      resourceType: req.validated.query.resourceType,
      startDate: req.validated.query.startDate,
      endDate: req.validated.query.endDate,
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

    const stats = await database.getAuditLogStats(filters);

    return {
      ok: true,
      stats,
    };
  }, { routeName: "audit-log/stats" })
);

/**
 * GET /api/audit-log/:id
 * Get a specific audit log entry by ID
 */
router.get(
  "/:id",
  requireRole("admin"),
  apiHandler(async (req, res) => {
    if (!database.isConfigured()) {
      throw new ValidationError("Database not configured");
    }

    const prisma = database.getClient();
    const auditLog = await prisma.auditLog.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            globalName: true,
            discordId: true,
          },
        },
      },
    });

    if (!auditLog) {
      throw new NotFoundError("Audit log entry not found");
    }

    return {
      ok: true,
      log: {
        id: auditLog.id,
        userId: auditLog.userId,
        user: auditLog.user ? {
          id: auditLog.user.id,
          username: auditLog.user.username,
          globalName: auditLog.user.globalName,
          discordId: auditLog.user.discordId,
        } : null,
        action: auditLog.action,
        resourceType: auditLog.resourceType,
        resourceId: auditLog.resourceId,
        details: auditLog.details,
        ipAddress: auditLog.ipAddress,
        userAgent: auditLog.userAgent,
        sessionId: auditLog.sessionId,
        requestId: auditLog.requestId,
        timestamp: auditLog.timestamp.toISOString(),
        success: auditLog.success,
        errorMessage: auditLog.errorMessage,
      },
    };
  }, { routeName: "audit-log/get" })
);

module.exports = router;
