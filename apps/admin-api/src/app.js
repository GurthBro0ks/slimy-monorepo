"use strict";
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { readAuth } = require("./middleware/auth");
const { metricsMiddleware, errorLoggingMiddleware } = require("./middleware/metrics");
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

// Metrics tracking middleware
app.use(metricsMiddleware);

app.use(readAuth);
app.use("/", routes);
app.use(
  "/api/uploads/files",
  express.static(UPLOADS_DIR, {
    setHeaders: (res) => {
      res.set("Cache-Control", "public, max-age=604800, immutable");
    },
  }),
);

// Error logging middleware (must be after routes)
app.use(errorLoggingMiddleware);

module.exports = app;
