const fs = require("fs");
const path = require("path");

function loadEnv(relativePath) {
  const envPath = path.resolve(__dirname, relativePath);
  if (!fs.existsSync(envPath)) {
    return {};
  }

  const envVars = {};
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) {
      continue;
    }
    const idx = line.indexOf("=");
    if (idx === -1) {
      continue;
    }
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!key) {
      continue;
    }
    envVars[key] = value;
  }
  return envVars;
}

const adminApiEnv = loadEnv("apps/admin-api/.env");

module.exports = {
  apps: [
    {
      name: "web",
      cwd: "./apps/web",
      script: "pnpm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
      },
    },
    {
      name: "admin-ui",
      cwd: "./apps/admin-ui",
      script: "pnpm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3081,
        HOSTNAME: "0.0.0.0",
      },
    },
    {
      name: "admin-api",
      cwd: "./apps/admin-api",
      script: "pnpm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3080,
        ...adminApiEnv,
      },
    },
  ],
};
