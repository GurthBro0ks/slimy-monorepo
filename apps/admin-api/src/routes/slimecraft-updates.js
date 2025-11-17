"use strict";

/**
 * Slime.craft Updates Routes
 *
 * Handles CRUD operations for Slime.craft server updates/notices:
 * - GET /latest - Retrieve recent updates
 * - GET /pinned - Retrieve pinned updates
 * - POST / - Create a new update (admin/club only)
 * - PATCH /:id - Update an existing update (admin/club only)
 * - DELETE /:id - Delete an update (admin only)
 */

const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const { requireCsrf } = require("../middleware/csrf");
const database = require("../../lib/database");
const { apiHandler } = require("../lib/errors");

const router = express.Router();

/**
 * GET /api/slimecraft/updates/latest
 *
 * Retrieve the most recent updates, ordered by creation date descending.
 * Pinned updates appear first.
 *
 * Query parameters:
 *   - limit: number (optional, default: 10) - Maximum number of updates to return
 *
 * Response:
 *   - ok: boolean
 *   - updates: array - Array of update objects
 */
router.get("/latest", apiHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const maxLimit = Math.min(limit, 100); // Cap at 100

  if (!database.isConfigured()) {
    return { ok: true, updates: [] };
  }

  const updates = await database.query(
    `SELECT id, type, title, body, pinned, created_by, created_at, updated_at
     FROM slimecraft_updates
     ORDER BY pinned DESC, created_at DESC
     LIMIT ?`,
    [maxLimit]
  );

  return {
    ok: true,
    updates: updates.map(formatUpdate),
  };
}, { routeName: "slimecraft-updates/latest" }));

/**
 * GET /api/slimecraft/updates/pinned
 *
 * Retrieve only pinned updates, ordered by creation date descending.
 *
 * Response:
 *   - ok: boolean
 *   - updates: array - Array of pinned update objects
 */
router.get("/pinned", apiHandler(async (req, res) => {
  if (!database.isConfigured()) {
    return { ok: true, updates: [] };
  }

  const updates = await database.query(
    `SELECT id, type, title, body, pinned, created_by, created_at, updated_at
     FROM slimecraft_updates
     WHERE pinned = TRUE
     ORDER BY created_at DESC`
  );

  return {
    ok: true,
    updates: updates.map(formatUpdate),
  };
}, { routeName: "slimecraft-updates/pinned" }));

/**
 * POST /api/slimecraft/updates
 *
 * Create a new update. Requires admin or club role.
 *
 * Request body:
 *   - type: string (optional, default: "info") - Type of update (info, warning, outage)
 *   - title: string (optional) - Update title
 *   - body: string (required) - Main content
 *   - pinned: boolean (optional, default: false) - Whether to pin the update
 *
 * Response:
 *   - ok: boolean
 *   - update: object - Created update object
 */
router.post("/", requireAuth, requireCsrf, requireRole("club"), express.json(), apiHandler(async (req, res) => {
  const { type, title, body, pinned } = req.body;

  if (!body || typeof body !== 'string' || body.trim().length === 0) {
    res.status(400).json({ error: "missing_body", message: "Update body is required" });
    return;
  }

  if (!database.isConfigured()) {
    res.status(503).json({ error: "database_unavailable" });
    return;
  }

  const updateType = type && typeof type === 'string' ? type : 'info';
  const updateTitle = title && typeof title === 'string' ? title : null;
  const updatePinned = pinned === true;
  const createdBy = req.user?.id || null;

  const result = await database.query(
    `INSERT INTO slimecraft_updates (type, title, body, pinned, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [updateType, updateTitle, body.trim(), updatePinned, createdBy]
  );

  const insertId = result.insertId;
  const created = await database.one(
    `SELECT id, type, title, body, pinned, created_by, created_at, updated_at
     FROM slimecraft_updates
     WHERE id = ?`,
    [insertId]
  );

  return {
    ok: true,
    update: formatUpdate(created),
  };
}, { routeName: "slimecraft-updates/create" }));

/**
 * PATCH /api/slimecraft/updates/:id
 *
 * Update an existing update. Requires admin or club role.
 *
 * Path parameters:
 *   - id: number - Update ID
 *
 * Request body (all optional):
 *   - type: string - Type of update
 *   - title: string - Update title (can be null to remove)
 *   - body: string - Main content
 *   - pinned: boolean - Whether to pin the update
 *
 * Response:
 *   - ok: boolean
 *   - update: object - Updated update object
 */
router.patch("/:id", requireAuth, requireCsrf, requireRole("club"), express.json(), apiHandler(async (req, res) => {
  const { id } = req.params;
  const { type, title, body, pinned } = req.body;

  if (!database.isConfigured()) {
    res.status(503).json({ error: "database_unavailable" });
    return;
  }

  // Check if update exists
  const existing = await database.one(
    `SELECT id FROM slimecraft_updates WHERE id = ?`,
    [id]
  );

  if (!existing) {
    res.status(404).json({ error: "update_not_found" });
    return;
  }

  // Build dynamic update query
  const updates = [];
  const values = [];

  if (type !== undefined && typeof type === 'string') {
    updates.push('type = ?');
    values.push(type);
  }

  if (title !== undefined) {
    updates.push('title = ?');
    values.push(title === null ? null : String(title));
  }

  if (body !== undefined && typeof body === 'string' && body.trim().length > 0) {
    updates.push('body = ?');
    values.push(body.trim());
  }

  if (pinned !== undefined && typeof pinned === 'boolean') {
    updates.push('pinned = ?');
    values.push(pinned);
  }

  if (updates.length === 0) {
    res.status(400).json({ error: "no_updates_provided" });
    return;
  }

  values.push(id);

  await database.query(
    `UPDATE slimecraft_updates
     SET ${updates.join(', ')}
     WHERE id = ?`,
    values
  );

  const updated = await database.one(
    `SELECT id, type, title, body, pinned, created_by, created_at, updated_at
     FROM slimecraft_updates
     WHERE id = ?`,
    [id]
  );

  return {
    ok: true,
    update: formatUpdate(updated),
  };
}, { routeName: "slimecraft-updates/update" }));

/**
 * DELETE /api/slimecraft/updates/:id
 *
 * Delete an update. Requires admin role.
 *
 * Path parameters:
 *   - id: number - Update ID
 *
 * Response:
 *   - ok: boolean
 */
router.delete("/:id", requireAuth, requireCsrf, requireRole("admin"), apiHandler(async (req, res) => {
  const { id } = req.params;

  if (!database.isConfigured()) {
    res.status(503).json({ error: "database_unavailable" });
    return;
  }

  // Check if update exists
  const existing = await database.one(
    `SELECT id FROM slimecraft_updates WHERE id = ?`,
    [id]
  );

  if (!existing) {
    res.status(404).json({ error: "update_not_found" });
    return;
  }

  await database.query(
    `DELETE FROM slimecraft_updates WHERE id = ?`,
    [id]
  );

  return { ok: true };
}, { routeName: "slimecraft-updates/delete" }));

/**
 * Format a raw database update row into a client-friendly object.
 *
 * @param {object} row - Raw database row
 * @returns {object} Formatted update object
 */
function formatUpdate(row) {
  if (!row) return null;

  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    pinned: Boolean(row.pinned),
    createdBy: row.created_by,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

module.exports = router;
