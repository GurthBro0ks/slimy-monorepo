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
  ],
};
