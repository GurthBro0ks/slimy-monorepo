"use strict";

/**
 * Agent Task Runner Service
 *
 * Manages the lifecycle of agent tasks: creation, status updates, and retrieval.
 * This is the orchestration layer - actual agent execution will be plugged in later.
 *
 * TODO: Implement actual LLM/agent execution
 * TODO: Add task queue with priority handling
 * TODO: Add retry logic for failed tasks
 * TODO: Add webhook notifications for task completion
 */

const database = require("../../lib/database");
const { agentExists } = require("../../agents/registry");

/**
 * Create a new agent task
 *
 * @param {string} agentName - Name of the agent to run
 * @param {Object} input - Input data for the agent task
 * @param {Object} options - Additional options
 * @param {string} [options.triggeredBy] - User or system ID that triggered the task
 * @param {string[]} [options.tags] - Tags for categorizing the task
 * @returns {Promise<Object>} Created task record
 */
async function createAgentTask(agentName, input, options = {}) {
  const { triggeredBy, tags = [] } = options;

  // Validate agent exists
  if (!agentExists(agentName)) {
    throw new Error(`Unknown agent: ${agentName}. Agent not found in registry.`);
  }

  // Validate input
  if (!input || typeof input !== "object") {
    throw new Error("Input must be a valid object");
  }

  const prisma = database.getClient();

  try {
    const task = await prisma.agentTask.create({
      data: {
        agentName,
        status: "pending",
        input,
        triggeredBy: triggeredBy || null,
        tags: tags.length > 0 ? tags.join(",") : null,
      },
    });

    console.log(`[taskRunner] Created task ${task.id} for agent ${agentName}`);

    // TODO: Enqueue task for execution
    // This is where we would add the task to a job queue (Bull, BullMQ, etc.)
    // For now, tasks remain in "pending" state until manually processed

    return formatTaskResponse(task);
  } catch (error) {
    console.error(`[taskRunner] Error creating task for ${agentName}:`, error);
    throw new Error(`Failed to create agent task: ${error.message}`);
  }
}

/**
 * Mark a task as running
 *
 * @param {number} taskId - Task ID
 * @returns {Promise<Object>} Updated task
 */
async function markTaskRunning(taskId) {
  const prisma = database.getClient();

  try {
    const task = await prisma.agentTask.update({
      where: { id: taskId },
      data: {
        status: "running",
        updatedAt: new Date(),
      },
    });

    console.log(`[taskRunner] Task ${taskId} marked as running`);

    // TODO: Start actual agent execution here
    // This is where we would:
    // 1. Load agent definition from registry
    // 2. Initialize appropriate LLM client (Claude, OpenAI, etc.)
    // 3. Execute the task with the input data
    // 4. Handle streaming responses if applicable

    return formatTaskResponse(task);
  } catch (error) {
    if (error.code === "P2025") {
      throw new Error(`Task ${taskId} not found`);
    }
    console.error(`[taskRunner] Error marking task ${taskId} as running:`, error);
    throw new Error(`Failed to update task status: ${error.message}`);
  }
}

/**
 * Mark a task as completed with output
 *
 * @param {number} taskId - Task ID
 * @param {Object} output - Task output data
 * @returns {Promise<Object>} Updated task
 */
async function markTaskCompleted(taskId, output) {
  const prisma = database.getClient();

  // Validate output
  if (!output || typeof output !== "object") {
    throw new Error("Output must be a valid object");
  }

  try {
    const task = await prisma.agentTask.update({
      where: { id: taskId },
      data: {
        status: "completed",
        output,
        error: null, // Clear any previous errors
        updatedAt: new Date(),
      },
    });

    console.log(`[taskRunner] Task ${taskId} completed successfully`);

    // TODO: Send webhook notification or trigger follow-up actions
    // TODO: Update task metrics/analytics

    return formatTaskResponse(task);
  } catch (error) {
    if (error.code === "P2025") {
      throw new Error(`Task ${taskId} not found`);
    }
    console.error(`[taskRunner] Error marking task ${taskId} as completed:`, error);
    throw new Error(`Failed to complete task: ${error.message}`);
  }
}

/**
 * Mark a task as failed with error message
 *
 * @param {number} taskId - Task ID
 * @param {string} errorMessage - Error message describing the failure
 * @returns {Promise<Object>} Updated task
 */
async function markTaskFailed(taskId, errorMessage) {
  const prisma = database.getClient();

  if (!errorMessage || typeof errorMessage !== "string") {
    throw new Error("Error message must be a non-empty string");
  }

  try {
    const task = await prisma.agentTask.update({
      where: { id: taskId },
      data: {
        status: "failed",
        error: errorMessage,
        updatedAt: new Date(),
      },
    });

    console.log(`[taskRunner] Task ${taskId} marked as failed: ${errorMessage}`);

    // TODO: Send error notification
    // TODO: Check if task should be retried
    // TODO: Update failure metrics

    return formatTaskResponse(task);
  } catch (error) {
    if (error.code === "P2025") {
      throw new Error(`Task ${taskId} not found`);
    }
    console.error(`[taskRunner] Error marking task ${taskId} as failed:`, error);
    throw new Error(`Failed to update task status: ${error.message}`);
  }
}

/**
 * Get a single task by ID
 *
 * @param {number} taskId - Task ID
 * @returns {Promise<Object>} Task record
 */
async function getTaskById(taskId) {
  const prisma = database.getClient();

  try {
    const task = await prisma.agentTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    return formatTaskResponse(task);
  } catch (error) {
    console.error(`[taskRunner] Error fetching task ${taskId}:`, error);
    throw error;
  }
}

/**
 * List agent tasks with optional filters
 *
 * @param {Object} filter - Filter options
 * @param {string} [filter.agentName] - Filter by agent name
 * @param {string} [filter.status] - Filter by status
 * @param {string} [filter.triggeredBy] - Filter by who triggered the task
 * @param {number} [filter.limit] - Maximum number of tasks to return
 * @param {number} [filter.offset] - Offset for pagination
 * @returns {Promise<Object>} List of tasks with pagination info
 */
async function listAgentTasks(filter = {}) {
  const {
    agentName,
    status,
    triggeredBy,
    limit = 50,
    offset = 0,
  } = filter;

  const prisma = database.getClient();

  // Build where clause
  const where = {};
  if (agentName) where.agentName = agentName;
  if (status) where.status = status;
  if (triggeredBy) where.triggeredBy = triggeredBy;

  try {
    const [tasks, total] = await Promise.all([
      prisma.agentTask.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: Math.min(limit, 100), // Max 100 per page
        skip: offset,
      }),
      prisma.agentTask.count({ where }),
    ]);

    return {
      tasks: tasks.map(formatTaskResponse),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  } catch (error) {
    console.error("[taskRunner] Error listing tasks:", error);
    throw new Error(`Failed to list tasks: ${error.message}`);
  }
}

/**
 * Get task statistics
 *
 * @param {Object} filter - Filter options
 * @param {string} [filter.agentName] - Filter by agent name
 * @param {Date} [filter.startDate] - Start date for time range
 * @param {Date} [filter.endDate] - End date for time range
 * @returns {Promise<Object>} Task statistics
 */
async function getTaskStats(filter = {}) {
  const { agentName, startDate, endDate } = filter;

  const prisma = database.getClient();

  // Build where clause
  const where = {};
  if (agentName) where.agentName = agentName;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  try {
    const [
      total,
      pending,
      running,
      completed,
      failed,
      byAgent,
    ] = await Promise.all([
      prisma.agentTask.count({ where }),
      prisma.agentTask.count({ where: { ...where, status: "pending" } }),
      prisma.agentTask.count({ where: { ...where, status: "running" } }),
      prisma.agentTask.count({ where: { ...where, status: "completed" } }),
      prisma.agentTask.count({ where: { ...where, status: "failed" } }),
      prisma.agentTask.groupBy({
        by: ["agentName"],
        where,
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
    ]);

    return {
      total,
      byStatus: {
        pending,
        running,
        completed,
        failed,
      },
      successRate: total > 0 ? ((completed / total) * 100).toFixed(2) : 0,
      byAgent: byAgent.map((stat) => ({
        agentName: stat.agentName,
        count: stat._count.id,
      })),
    };
  } catch (error) {
    console.error("[taskRunner] Error getting task stats:", error);
    throw new Error(`Failed to get task statistics: ${error.message}`);
  }
}

/**
 * Format task response for API output
 *
 * @param {Object} task - Raw task from database
 * @returns {Object} Formatted task
 */
function formatTaskResponse(task) {
  return {
    id: task.id,
    agentName: task.agentName,
    status: task.status,
    input: task.input,
    output: task.output,
    error: task.error,
    triggeredBy: task.triggeredBy,
    tags: task.tags ? task.tags.split(",") : [],
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

module.exports = {
  createAgentTask,
  markTaskRunning,
  markTaskCompleted,
  markTaskFailed,
  getTaskById,
  listAgentTasks,
  getTaskStats,
};
