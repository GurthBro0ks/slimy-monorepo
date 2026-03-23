// DEPRECATED — slimyai-web is now supervised by systemd user service
// (slimy-web.service) instead of PM2.
// Systemd service: systemctl --user [start|stop|restart|status] slimy-web
// PM2 crash-loop removed 2026-03-23: live app moved from orphaned next-server
// (PID 2007305, killed) to systemd-supervised instance.
//
// If you need to re-PM2-manage the web app:
// 1. sudo systemctl --user stop slimy-web
// 2. sudo systemctl --user disable slimy-web
// 3. pm2 start ecosystem.config.js  (uncomment app entry below)
// 4. pm2 save
//
// module.exports = {
//   apps: [
//     {
//       name: "web",
//       cwd: "/opt/slimy/slimy-monorepo/apps/web",
//       script: "node",
//       args: ".next/standalone/apps/web/server.js",
//       env: {
//         NODE_ENV: "production",
//         PORT: 3000,
//         HOSTNAME: "0.0.0.0",
//       },
//     },
//   ],
// };
