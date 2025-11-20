"use strict";

const promClient = require("prom-client");

// Create a Registry to register the metrics
const register = new promClient.Registry();

// Add default metrics (CPU, memory, event loop lag, etc.)
promClient.collectDefaultMetrics({ register });

const startedAt = new Date();

// ===== PROMETHEUS COUNTERS & GAUGES =====

// Total HTTP requests counter
const totalRequestsCounter = new promClient.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

// Chat messages counter
const chatMessagesCounter = new promClient.Counter({
  name: "chat_messages_total",
  help: "Total number of chat messages sent",
  registers: [register],
});

// Images processed counter
const imagesProcessedCounter = new promClient.Counter({
  name: "image_analysis_total",
  help: "Total number of images analyzed/processed",
  registers: [register],
});

// Errors counter
const errorsCounter = new promClient.Counter({
  name: "errors_total",
  help: "Total number of errors encountered",
  labelNames: ["type"],
  registers: [register],
});

// HTTP request duration histogram
const httpRequestDuration = new promClient.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

// Active connections gauge
const activeConnectionsGauge = new promClient.Gauge({
  name: "active_connections",
  help: "Number of active connections",
  registers: [register],
});

// Database queries counter
const dbQueriesCounter = new promClient.Counter({
  name: "database_queries_total",
  help: "Total number of database queries executed",
  registers: [register],
});

// Database query duration histogram
const dbQueryDuration = new promClient.Histogram({
  name: "database_query_duration_seconds",
  help: "Duration of database queries in seconds",
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// Database connections gauge
const dbConnectionsGauge = new promClient.Gauge({
  name: "database_connections",
  help: "Number of active database connections",
  registers: [register],
});

// Uptime gauge
const uptimeGauge = new promClient.Gauge({
  name: "process_uptime_seconds",
  help: "Number of seconds the process has been running",
  registers: [register],
});

// Update uptime every 10 seconds
setInterval(() => {
  uptimeGauge.set(Math.floor((Date.now() - startedAt.getTime()) / 1000));
}, 10000);

// ===== LEGACY METRICS (for backward compatibility) =====

let requestCount = 0;
let imagesProcessed = 0;
let chatMessages = 0;
let errorCount = 0;

// Response time tracking (sliding window of last 1000 requests)
const responseTimes = [];
const RESPONSE_TIME_WINDOW = 1000;

// HTTP status code distribution
const statusCodes = {};

// Database query metrics
let dbQueryCount = 0;
let dbQueryTotalTime = 0;
let dbConnectionCount = 0;

// Performance metrics
let activeConnections = 0;

// ===== RECORDING FUNCTIONS =====

function recordRequest() {
  requestCount += 1;
}

function recordImages(count = 1) {
  const numImages = Number(count) || 0;
  imagesProcessed += numImages;
  imagesProcessedCounter.inc(numImages);
}

function recordChatMessage() {
  chatMessages += 1;
  chatMessagesCounter.inc();
}

function recordResponseTime(durationMs) {
  responseTimes.push({
    timestamp: Date.now(),
    duration: durationMs,
  });

  // Keep only recent responses
  if (responseTimes.length > RESPONSE_TIME_WINDOW) {
    responseTimes.shift();
  }
}

function recordStatusCode(statusCode) {
  statusCodes[statusCode] = (statusCodes[statusCode] || 0) + 1;
}

function recordError(type = "unknown") {
  errorCount += 1;
  errorsCounter.inc({ type });
}

function recordDatabaseQuery(durationMs) {
  dbQueryCount += 1;
  dbQueryTotalTime += durationMs;
  dbQueriesCounter.inc();
  dbQueryDuration.observe(durationMs / 1000); // Convert to seconds
}

function recordDatabaseConnection(delta) {
  dbConnectionCount += delta;
  dbConnectionsGauge.set(dbConnectionCount);
}

function recordActiveConnection(delta) {
  activeConnections += delta;
  activeConnectionsGauge.set(activeConnections);
}

// ===== HELPER FUNCTIONS =====

function getAverageResponseTime() {
  if (responseTimes.length === 0) return 0;
  const sum = responseTimes.reduce((acc, rt) => acc + rt.duration, 0);
  return Math.round(sum / responseTimes.length);
}

function getResponseTimePercentile(percentile) {
  if (responseTimes.length === 0) return 0;

  const sorted = [...responseTimes].sort((a, b) => a.duration - b.duration);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)].duration;
}

function getAverageDatabaseQueryTime() {
  if (dbQueryCount === 0) return 0;
  return Math.round(dbQueryTotalTime / dbQueryCount);
}

function getErrorRate() {
  if (requestCount === 0) return 0;
  return (errorCount / requestCount) * 100;
}

function getMemoryUsage() {
  const memUsage = process.memoryUsage();
  return {
    rss: Math.round(memUsage.rss / 1024 / 1024), // MB
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
    external: Math.round(memUsage.external / 1024 / 1024), // MB
  };
}

function getCpuUsage() {
  const cpuUsage = process.cpuUsage();
  return {
    user: Math.round(cpuUsage.user / 1000), // ms
    system: Math.round(cpuUsage.system / 1000), // ms
  };
}

function snapshot() {
  return {
    // Basic info
    startedAt: startedAt.toISOString(),
    uptimeSec: Math.floor((Date.now() - startedAt.getTime()) / 1000),

    // Request metrics
    requests: requestCount,
    activeConnections,
    imagesProcessed,
    chatMessages,

    // Performance metrics
    responseTime: {
      average: getAverageResponseTime(),
      p50: getResponseTimePercentile(50),
      p95: getResponseTimePercentile(95),
      p99: getResponseTimePercentile(99),
    },

    // Error metrics
    errors: errorCount,
    errorRatePercent: getErrorRate(),

    // HTTP status distribution
    statusCodes: { ...statusCodes },

    // Database metrics
    database: {
      connections: dbConnectionCount,
      queries: dbQueryCount,
      averageQueryTime: getAverageDatabaseQueryTime(),
    },

    // System metrics
    memory: getMemoryUsage(),
    cpu: getCpuUsage(),

    // Recent activity (last 5 minutes)
    recentRequests: responseTimes.filter(
      (rt) => Date.now() - rt.timestamp < 5 * 60 * 1000
    ).length,
  };
}

// Middleware for tracking HTTP metrics
function metricsMiddleware(req, res, next) {
  const startTime = Date.now();

  // Record active connection
  recordActiveConnection(1);
  recordRequest();

  // Track response
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    recordResponseTime(duration);
    recordStatusCode(res.statusCode);

    // Extract route pattern (if available)
    const route = req.route?.path || req.path || "unknown";
    const method = req.method;
    const statusCode = String(res.statusCode);

    // Record Prometheus metrics
    totalRequestsCounter.inc({ method, route, status_code: statusCode });
    httpRequestDuration.observe(
      { method, route, status_code: statusCode },
      duration / 1000 // Convert to seconds
    );

    // Record error if status >= 500
    if (res.statusCode >= 500) {
      recordError("http_5xx");
    } else if (res.statusCode >= 400) {
      recordError("http_4xx");
    }

    // Release active connection
    recordActiveConnection(-1);
  });

  next();
}

// Export Prometheus registry
function getPrometheusMetrics() {
  return register.metrics();
}

module.exports = {
  // Recording functions
  recordRequest,
  recordImages,
  recordChatMessage,
  recordResponseTime,
  recordStatusCode,
  recordError,
  recordDatabaseQuery,
  recordDatabaseConnection,
  recordActiveConnection,

  // Snapshot (legacy JSON format)
  snapshot,

  // Middleware
  metricsMiddleware,

  // Prometheus
  register,
  getPrometheusMetrics,
};
