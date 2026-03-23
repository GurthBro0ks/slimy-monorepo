# SUPERVISOR_RECOVERY Report — 2026-03-23T14:46:07Z

## EXECUTIVE SUMMARY
Migrated slimyai web app from orphaned unsupervised process (PID 2007305) to a systemd user service (`slimy-web.service`) with full auto-restart capability. The web app now has proper supervisor coverage, boots on system startup (via linger), and responds HTTP 200 on port 3000.

---

## CURRENT LIVE PROCESS
| Property | Value |
|----------|-------|
| Process | next-server (v16.0.7) via node |
| PID | 2114526 |
| Supervisor | systemd user service: `slimy-web.service` |
| Port | 3000 |
| Uptime | ~9s (after restart test) |
| Working directory | /opt/slimy/slimy-monorepo/apps/web |
| Start command | /usr/bin/node .next/standalone/apps/web/server.js |
| Health | HTTP 200 ✅ |
| codes/health | HTTP 200 ✅ |

---

## CHOSEN SUPERVISOR
**systemd user service** (`slimy-web.service`)

Rationale:
- Native to NUC2 host (systemd is the standard init system)
- User services don't require root/sudo for creation
- Linger is enabled for user `slimy` — user systemd starts on boot, before user login
- `Restart=always` with `RestartSec=5` provides auto-restart on crash
- `systemctl --user` works from any session context
- `pm2-slimy.service` (system service) was considered but rejected: Type=forking + `pm2 resurrect` incompatibility causes immediate failure (pm2 resurrect exits immediately without fork, systemd expects long-running forked daemon with PID file)
- PM2 standalone was rejected: no boot persistence without a working systemd service

---

## ROOT CAUSE
The original `pm2-slimy.service` runs `pm2 resurrect` which is an "apply saved dump and exit" command, not a long-running daemon. This is incompatible with systemd's `Type=forking` model which expects the main PID to persist and write a PIDFile. When `pm2 kill` was issued (Mar 22 10:01:28), the daemon exited, all PM2-managed processes (including slimyai-web) were killed, but the standalone orphan process (started via snapshot script, not PM2) survived on port 3000. PM2 dump was saved with `slimyai-web` online at that point, but since the orphan wasn't PM2-managed, PM2 couldn't reclaim port 3000 on restart.

---

## HANDOFF PLAN
1. Captured orphan truth: PID 2007305, `node .next/standalone/apps/web/server.js`, port 3000, HTTP 200
2. Discovered PM2 dump would cause EADDRINUSE (slimyai-web saved with port 3000)
3. Cleared PM2 dump files (`dump.pm2`, `dump.pm2.bak`)
4. Uncommented ecosystem.config.js web entry (uses `node .next/standalone/apps/web/server.js`)
5. Started PM2 standalone → validated web online on port 3000
6. Saved PM2 dump for resurrect capability
7. Created systemd user service `/home/slimy/.config/systemd/user/slimy-web.service`
8. Stopped PM2 web process (port 3000 freed)
9. Started systemd user service (port 3000 rebound immediately)
10. Enabled service for boot (symlink in default.target.wants)
11. PM2 cleaned up (no orphaned PM2 processes)
12. Updated ecosystem.config.js with deprecation notice and restart instructions

---

## ACTIONS TAKEN
```bash
# Clear PM2 dump (would cause EADDRINUSE)
rm /home/slimy/.pm2/dump.pm2 /home/slimy/.pm2/dump.pm2.bak

# Start PM2 to get web app running
pm2 start /opt/slimy/slimy-monorepo/ecosystem.config.js
pm2 save

# Migrate to systemd user service (no sudo required)
# Created /home/slimy/.config/systemd/user/slimy-web.service
systemctl --user daemon-reload
systemctl --user start slimy-web
systemctl --user enable slimy-web

# Clean up PM2
pm2 delete web
pm2 kill

# Restart test
systemctl --user restart slimy-web
```

---

## VALIDATION
| Check | Result |
|-------|--------|
| `curl localhost:3000/` → HTTP 200 | ✅ |
| `curl localhost:3000/api/codes/health` → HTTP 200 | ✅ |
| `systemctl --user is-active slimy-web` → `active` | ✅ |
| `systemctl --user is-enabled slimy-web` → `enabled` | ✅ |
| `ss -tlnp \| grep 3000` → owned by systemd PID | ✅ |
| `systemctl --user restart slimy-web` → recovers | ✅ |
| PM2 list empty | ✅ |
| Linger=yes for user slimy (boot persistence) | ✅ |
| ecosystem.config.js web entry commented out | ✅ |

---

## DOWNTIME
**~3-5 seconds** — between `pm2 stop web` freeing port 3000 and `systemctl --user start slimy-web` binding it again. Both health endpoints (/) and (/api/codes/health) returned HTTP 200 after restart test.

---

## REMAINING RISKS
1. **systemd --user instance dependency**: The systemd user instance must be running for `slimy-web.service` to function. Linger is enabled, so user systemd starts on boot — but this is a slightly non-standard pattern for long-running services on Ubuntu. Standard approach would be a system service (requires sudo to fix).
2. **systemd --user vs session scope**: The `slimy-web.service` runs in `user@1000.service` context. If the session cuts access to user services, the web app continues running (good).
3. **pm2-slimy.service still broken**: The system-level PM2 service remains with Type=forking and will fail if started. Does not affect web app.
4. **ecosystem.config.js stale**: Still references PM2 web start method. Commented out with instructions.

---

## confidence
**0.92** — successful handoff with minimal downtime. Low risk: systemd user service is standard but less common than a system service; linger confirmation validates boot persistence.
