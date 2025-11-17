"use strict";

/**
 * Audit Log Routes
 *
 * Provides API endpoints for viewing audit log entries.
 * Audit logs track all events published through the event bus.
 */

const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { apiHandler } = require('../lib/errors');
const database = require('../lib/database');

const router = express.Router();

// All audit log routes require authentication
router.use(requireAuth);

/**
 * GET /api/audit-log/recent
 *
 * Get recent audit log entries with optional filtering.
 *
 * Requires: Authentication (member role or higher)
 *
 * Query parameters:
 *   - limit: number (optional) - Maximum number of entries to return (default: 100, max: 1000)
 *   - offset: number (optional) - Offset for pagination (default: 0)
 *   - eventType: string (optional) - Filter by event type
 *   - userId: string (optional) - Filter by user ID
 *   - guildId: string (optional) - Filter by guild ID
 *   - startDate: string (optional) - Filter by start date (ISO 8601)
 *   - endDate: string (optional) - Filter by end date (ISO 8601)
 *   - success: boolean (optional) - Filter by success status
 *
 * Response:
 *   - ok: boolean
 *   - logs: array - Array of audit log entries
 *   - pagination: object - Pagination info
 *     - limit: number
 *     - offset: number
 *     - total: number (if available)
 *
 * Access control:
 *   - Admin role: Can view all audit logs
 *   - Member role: Can view logs for their own user ID or guilds they belong to
 */
router.get('/recent', requireRole('member'), apiHandler(async (req, res) => {
  const {
    limit: rawLimit,
    offset: rawOffset,
    eventType,
    userId,
    guildId,
    startDate,
    endDate,
    success: rawSuccess,
  } = req.query;

  // Parse and validate query parameters
  const limit = Math.min(parseInt(rawLimit) || 100, 1000);
  const offset = parseInt(rawOffset) || 0;
  const success = rawSuccess === 'true' ? true : rawSuccess === 'false' ? false : undefined;

  // Access control: non-admin users can only view their own logs or guild logs they belong to
  const isAdmin = req.user.role === 'admin';
  const requestUserId = req.user.id;

  // Build where clause
  const where = {};

  if (eventType) where.eventType = eventType;
  if (success !== undefined) where.success = success;

  // Apply access control
  if (!isAdmin) {
    // Non-admin users can only see their own events or events for guilds they belong to
    if (userId && userId !== requestUserId) {
      return {
        ok: false,
        error: 'forbidden',
        message: 'You can only view your own audit logs',
      };
    }
    // If userId is specified, use it; otherwise default to current user
    where.userId = userId || requestUserId;
  } else {
    // Admin can filter by any userId
    if (userId) where.userId = userId;
  }

  // Guild filter (both admin and non-admin can use this)
  if (guildId) where.guildId = guildId;

  // Date range filter
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  // Fetch audit logs
  await database.initialize();
  const prisma = database.getClient();

  const [logs, totalCount] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
      select: {
        id: true,
        eventType: true,
        action: true,
        userId: true,
        guildId: true,
        payload: true,
        timestamp: true,
        createdAt: true,
        success: true,
        errorMessage: true,
        user: {
          select: {
            id: true,
            username: true,
            globalName: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    ok: true,
    logs,
    pagination: {
      limit,
      offset,
      total: totalCount,
      hasMore: offset + limit < totalCount,
    },
  };
}, { routeName: 'audit-log/recent' }));

/**
 * GET /api/audit-log/stats
 *
 * Get aggregate statistics for audit logs.
 *
 * Requires: Authentication (admin role)
 *
 * Query parameters:
 *   - eventType: string (optional) - Filter by event type
 *   - userId: string (optional) - Filter by user ID
 *   - guildId: string (optional) - Filter by guild ID
 *   - startDate: string (optional) - Filter by start date (ISO 8601)
 *   - endDate: string (optional) - Filter by end date (ISO 8601)
 *
 * Response:
 *   - ok: boolean
 *   - stats: object - Aggregate statistics
 *     - totalEvents: number
 *     - eventsByType: array
 *     - eventsByDay: array (if date range specified)
 */
router.get('/stats', requireRole('admin'), apiHandler(async (req, res) => {
  const {
    eventType,
    userId,
    guildId,
    startDate,
    endDate,
  } = req.query;

  // Build where clause
  const where = {};
  if (eventType) where.eventType = eventType;
  if (userId) where.userId = userId;
  if (guildId) where.guildId = guildId;

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  // Fetch statistics
  await database.initialize();
  const prisma = database.getClient();

  const [totalEvents, eventsByType] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.groupBy({
      by: ['eventType'],
      where,
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    }),
  ]);

  return {
    ok: true,
    stats: {
      totalEvents,
      eventsByType: eventsByType.map(stat => ({
        eventType: stat.eventType,
        count: stat._count.id,
      })),
    },
  };
}, { routeName: 'audit-log/stats' }));

module.exports = router;
