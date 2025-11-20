"use strict";

/**
 * Agent Task Management API Routes
 *
 * Provides REST API endpoints for managing AI agents and their tasks.
 */

const express = require("express");
const router = express.Router();
const { getAllAgents, getAgentByName } = require("../agents/registry");
const {
  createAgentTask,
  getTaskById,
  listAgentTasks,
  getTaskStats,
  markTaskRunning,
  markTaskCompleted,
  markTaskFailed,
} = require("../services/agents/taskRunner");

/**
 * GET /api/agents
 * List all available agents from the registry
 */
router.get("/", async (req, res) => {
  try {
    const agents = getAllAgents();
    res.json({
      ok: true,
      agents,
      count: agents.length,
    });
  } catch (error) {
    console.error("[agents] Error listing agents:", error);
    res.status(500).json({
      ok: false,
      error: "Failed to list agents",
      message: error.message,
    });
  }
});

/**
 * GET /api/agents/:name
 * Get a specific agent definition
 */
router.get("/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const agent = getAgentByName(name);

    if (!agent) {
      return res.status(404).json({
        ok: false,
        error: "agent_not_found",
        message: `Agent '${name}' not found in registry`,
      });
    }

    res.json({
      ok: true,
      agent,
    });
  } catch (error) {
    console.error("[agents] Error fetching agent:", error);
    res.status(500).json({
      ok: false,
      error: "Failed to fetch agent",
      message: error.message,
    });
  }
});

/**
 * POST /api/agents/tasks
 * Create a new agent task
 *
 * Body: { agentName, input, tags?, triggeredBy? }
 */
router.post("/tasks", async (req, res) => {
  try {
    const { agentName, input, tags, triggeredBy } = req.body;

    // Validation
    if (!agentName) {
      return res.status(400).json({
        ok: false,
        error: "missing_agent_name",
        message: "agentName is required",
      });
    }

    if (!input) {
      return res.status(400).json({
        ok: false,
        error: "missing_input",
        message: "input is required",
      });
    }

    if (typeof input !== "object" || Array.isArray(input)) {
      return res.status(400).json({
        ok: false,
        error: "invalid_input",
        message: "input must be a valid object",
      });
    }

    const task = await createAgentTask(agentName, input, {
      tags: tags || [],
      triggeredBy: triggeredBy || null,
    });

    res.status(201).json({
      ok: true,
      task,
    });
  } catch (error) {
    console.error("[agents] Error creating task:", error);

    if (error.message.includes("Unknown agent")) {
      return res.status(400).json({
        ok: false,
        error: "invalid_agent",
        message: error.message,
      });
    }

    res.status(500).json({
      ok: false,
      error: "Failed to create task",
      message: error.message,
    });
  }
});

/**
 * GET /api/agents/tasks
 * List agent tasks with optional filters
 *
 * Query params: agentName?, status?, triggeredBy?, limit?, offset?
 */
router.get("/tasks", async (req, res) => {
  try {
    const { agentName, status, triggeredBy, limit, offset } = req.query;

    const result = await listAgentTasks({
      agentName: agentName || undefined,
      status: status || undefined,
      triggeredBy: triggeredBy || undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });

    res.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    console.error("[agents] Error listing tasks:", error);
    res.status(500).json({
      ok: false,
      error: "Failed to list tasks",
      message: error.message,
    });
  }
});

/**
 * GET /api/agents/tasks/stats
 * Get task statistics
 *
 * Query params: agentName?, startDate?, endDate?
 */
router.get("/tasks/stats", async (req, res) => {
  try {
    const { agentName, startDate, endDate } = req.query;

    const stats = await getTaskStats({
      agentName: agentName || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });

    res.json({
      ok: true,
      stats,
    });
  } catch (error) {
    console.error("[agents] Error fetching task stats:", error);
    res.status(500).json({
      ok: false,
      error: "Failed to fetch task statistics",
      message: error.message,
    });
  }
});

/**
 * GET /api/agents/tasks/:id
 * Get a specific task by ID
 */
router.get("/tasks/:id", async (req, res) => {
  try {
    const taskId = parseInt(req.params.id, 10);

    if (isNaN(taskId)) {
      return res.status(400).json({
        ok: false,
        error: "invalid_task_id",
        message: "Task ID must be a valid number",
      });
    }

    const task = await getTaskById(taskId);

    res.json({
      ok: true,
      task,
    });
  } catch (error) {
    console.error(`[agents] Error fetching task ${req.params.id}:`, error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        ok: false,
        error: "task_not_found",
        message: error.message,
      });
    }

    res.status(500).json({
      ok: false,
      error: "Failed to fetch task",
      message: error.message,
    });
  }
});

/**
 * PATCH /api/agents/tasks/:id/status
 * Update task status (for manual control/testing)
 *
 * Body: { status: "running" | "completed" | "failed", output?, error? }
 */
router.patch("/tasks/:id/status", async (req, res) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    const { status, output, error } = req.body;

    if (isNaN(taskId)) {
      return res.status(400).json({
        ok: false,
        error: "invalid_task_id",
        message: "Task ID must be a valid number",
      });
    }

    if (!status) {
      return res.status(400).json({
        ok: false,
        error: "missing_status",
        message: "status is required",
      });
    }

    let task;
    switch (status) {
      case "running":
        task = await markTaskRunning(taskId);
        break;
      case "completed":
        if (!output) {
          return res.status(400).json({
            ok: false,
            error: "missing_output",
            message: "output is required when marking task as completed",
          });
        }
        task = await markTaskCompleted(taskId, output);
        break;
      case "failed":
        if (!error) {
          return res.status(400).json({
            ok: false,
            error: "missing_error",
            message: "error is required when marking task as failed",
          });
        }
        task = await markTaskFailed(taskId, error);
        break;
      default:
        return res.status(400).json({
          ok: false,
          error: "invalid_status",
          message: "status must be one of: running, completed, failed",
        });
    }

    res.json({
      ok: true,
      task,
    });
  } catch (error) {
    console.error(`[agents] Error updating task ${req.params.id} status:`, error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        ok: false,
        error: "task_not_found",
        message: error.message,
      });
    }

    res.status(500).json({
      ok: false,
      error: "Failed to update task status",
      message: error.message,
    });
  }
});

module.exports = router;
