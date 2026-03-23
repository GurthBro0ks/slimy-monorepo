// STALE — slimyai-web was crash-looping (EADDRINUSE) because port 3000
// was already occupied by the standalone next-server orphan process.
// PM2 list is empty (crash-loop was manually stopped 2026-03-23).
// The live app runs as orphaned PID 2007305 on port 3000 — do NOT PM2-start
// another process on port 3000 while that orphan is alive.
//
// If you need to re-PM2-manage the web app:
// 1. Kill the orphaned next-server (PID 2007305)
// 2. Remove this comment and uncomment the app config below
// 3. pm2 start ecosystem.config.js

// module.exports = {
//   apps: [
//     {
//       name: "web",
//       cwd: "./apps/web",
//       script: "pnpm",
//       args: "start",
//       env: {
//         NODE_ENV: "production",
//         PORT: 3000,
//         HOSTNAME: "0.0.0.0",
//       },
//     },
//   ],
// };
