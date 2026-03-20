"use strict";
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { readAuth } = require("./middleware/auth");
const requestIdMiddleware = require("./middleware/request-id");
const { requestLogger } = require("./lib/logger");
const { errorHandler, notFoundHandler } = require("./middleware/error-handler");
const routes = require("./routes");
const { UPLOADS_DIR } = require("./services/uploads");

const app = express();
app.set("trust proxy", 1);
app.disable("etag");

const CORS_ORIGIN = process.env.CORS_ORIGIN;
if (!CORS_ORIGIN) {
  throw new Error("Missing required environment variable: CORS_ORIGIN");
}

app.use(helmet());
app.use(requestIdMiddleware);
app.use(requestLogger);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));
app.use(morgan("combined"));
app.use((_, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// Request logging and ID tracking
app.use(requestLogger);

// Auth resolution
app.use(readAuth);

// Routes
app.use("/", routes);

// Static file serving
app.use(
  "/api/uploads/files",
  express.static(UPLOADS_DIR, {
    setHeaders: (res) => {
      res.set("Cache-Control", "public, max-age=604800, immutable");
    },
  }),
);

// 404 handler - must come before error handler
app.use(notFoundHandler);

// Error handler - must be last
app.use(errorHandler);

module.exports = app;
