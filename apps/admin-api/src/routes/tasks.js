"use strict";

const express = require("express");

const { requireAuth } = require("../middleware/auth");
const { requireCsrf } = require("../middleware/csrf");
const { requireGuildAccess, requireRole } = require("../middleware/rbac");
const { tasksLimiter } = require("../middleware/rate-limit");
const { recordAudit } = require("../services/audit");
const { startTask, getTask } = require("../services/task-runner");
const { SUPPORTED_TASKS, buildTaskOptions } = require("../services/tasks");
const { BadRequestError, NotFoundError, AuthorizationError } = require("../lib/errors");

function sendEvent(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

const guildTaskRouter = express.Router();
guildTaskRouter.use(requireAuth);

guildTaskRouter.post(
  "/:guildId/tasks/:taskName",
  requireGuildAccess,
  requireRole("admin"),
  requireCsrf,
  tasksLimiter,
  async (req, res, next) => {
    try {
      const { guildId, taskName } = req.params;
      const normalizedTask = taskName.toLowerCase();

      if (!SUPPORTED_TASKS.has(normalizedTask)) {
        throw new BadRequestError("Unsupported task type");
      }

      const options = buildTaskOptions(normalizedTask, guildId, req.body || {});

      await recordAudit({
        adminId: req.user.sub,
        action: `guild.task.${normalizedTask}`,
        guildId,
        payload: options,
      });

      const { taskId } = startTask(normalizedTask, guildId, options, req.user.sub);
      res.json({ taskId });
    } catch (err) {
      next(err);
    }
  },
);

const taskStreamRouter = express.Router();
taskStreamRouter.use(requireAuth);

taskStreamRouter.get("/tasks/:taskId/stream", (req, res, next) => {
  try {
    const { taskId } = req.params;
    const record = getTask(taskId);
    if (!record) {
      throw new NotFoundError("Task not found");
    }

    let hasAccess = false;
    if (record.guildId === null || record.guildId === "__global__") {
      hasAccess = req.user?.role === "owner";
    } else {
      hasAccess = req.user?.guilds?.some(
        (guild) => guild.id === record.guildId,
      );
    }
    if (!hasAccess) {
      throw new AuthorizationError("Access denied to this task");
    }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const sendExisting = () => {
    for (const entry of record.events) {
      sendEvent(res, entry.event, entry.data);
    }
  };

  sendExisting();

  const onLog = (payload) => sendEvent(res, "log", payload);
  const onError = (payload) => sendEvent(res, "error", payload);
  const onEnd = (payload) => {
    sendEvent(res, "end", payload);
    cleanup();
  };

  const cleanup = () => {
    record.emitter.removeListener("log", onLog);
    record.emitter.removeListener("error", onError);
    record.emitter.removeListener("end", onEnd);
    res.end();
  };

  record.emitter.on("log", onLog);
  record.emitter.on("error", onError);
  record.emitter.on("end", onEnd);

  req.on("close", cleanup);

  if (record.done) {
    // Task completed before stream established; ensure connection closes
    cleanup();
  }
  } catch (err) {
    next(err);
  }
});

module.exports = {
  guildTaskRouter,
  taskStreamRouter,
};
