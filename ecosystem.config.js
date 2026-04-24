// PM2 Ecosystem — SlimyAI NUC1
//
// Bot env vars are loaded via dotenv/config at runtime from apps/bot/.env.
// No env_file directive needed — the TS entrypoint handles it.
//
// Usage:
//   pm2 start ecosystem.config.js
//   pm2 save
//
// After reboot (if pm2 startup is configured):
//   pm2 resurrect

module.exports = {
  apps: [
    {
      name: 'slimy-bot-v2',
      script: 'apps/bot/dist/index.js',
      cwd: '/opt/slimy/slimy-monorepo',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/home/slimy/logs/bot-error.log',
      out_file: '/home/slimy/logs/bot-out.log',
      log_file: '/home/slimy/logs/bot-combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 5000,
    },
  ],
};
