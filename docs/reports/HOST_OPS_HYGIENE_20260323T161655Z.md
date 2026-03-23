# HOST_OPS_HYGIENE Report — 2026-03-23T16:16:55Z

## EXECUTIVE SUMMARY

All ambiguities resolved or documented. Canonical paths, supervisor, and PM2 residue are now clearly established. No live service interruption. One informational update to `server-state.md` applied. No sudo-required changes to live services.

---

## CANONICAL REPO PATH

**Conclusion: `/opt/slimy/slimy-monorepo` is canonical. `/home/slimy/slimy-monorepo` is a convenience symlink.**

Evidence:
- `file /home/slimy/slimy-monorepo` → `symbolic link to /opt/slimy/slimy-monorepo`
- `file /opt/slimy/slimy-monorepo` → `directory`
- `ls -la /opt/slimy/slimy-monorepo/.git` → valid git repository
- AGENTS.md already documents this correctly (Live code: `/opt/slimy/slimy-monorepo/`, symlink: `/home/slimy/slimy-monorepo`)

**For future agents:** Always use `/opt/slimy/slimy-monorepo` for git operations, builds, and service working directories. `/home/slimy/slimy-monorepo` resolves to the same directory and is safe to use as a path, but `/opt/slimy/slimy-monorepo` is the canonical form.

---

## LIVE SERVICE TRUTH

| Property | Value |
|----------|-------|
| Web app | Running on port 3000 |
| PID | 2114526 |
| Process | `next-server (v16.0.7)` |
| Supervisor | systemd --user service: `slimy-web.service` |
| Working dir | `/opt/slimy/slimy-monorepo/apps/web` |
| Start command | `/usr/bin/node .next/standalone/apps/web/server.js` |
| Health | HTTP 200 on `/` and `/api/codes/health` |
| Uptime | ~1h 30min (as of report time) |

---

## SYSTEMD USER SERVICE TRUTH

**`slimy-web.service`** (systemd --user, user-level):

| Property | Value |
|----------|-------|
| Path | `/home/slimy/.config/systemd/user/slimy-web.service` |
| Type | simple |
| WorkingDirectory | `/opt/slimy/slimy-monorepo/apps/web` |
| ExecStart | `/usr/bin/node .next/standalone/apps/web/server.js` |
| Restart | always (RestartSec=5) |
| Status | active (running) |
| Enabled | yes (boot-persistent via linger) |
| MainPID | 2114526 |

**Operational commands:**
```bash
systemctl --user status slimy-web   # view status
systemctl --user restart slimy-web  # restart web
systemctl --user stop slimy-web     # stop web
journalctl --user -u slimy-web      # view logs
```

---

## PM2 RESIDUE TRUTH

### PM2 Daemon
- PM2 daemon is running (`pm2 list` returns empty process list)
- No PM2-managed applications exist
- PM2 is not authoritative for web on NUC2

### `/etc/systemd/system/pm2-slimy.service` (SYSTEM-LEVEL)

| Property | Value |
|----------|-------|
| Path | `/etc/systemd/system/pmpm2-slimy.service` |
| Type | forking (INCOMPATIBLE — root cause) |
| ExecStart | `/home/slimy/.npm-global/lib/node_modules/pm2/bin/pm2 resurrect` |
| Status | failed (Result: protocol) — since Mon 2026-03-23 14:42:18 UTC |
| Enabled | yes (but broken) |
| Root cause | `pm2 resurrect` is an "apply saved dump and exit" command, not a persistent daemon. systemd Type=forking expects a long-running forked process with a PIDFile. The resurrect command exits immediately (code=exited, status=0/SUCCESS), causing systemd to detect protocol failure and repeatedly restart. |

### `ecosystem.config.js`
- Already has a deprecation notice at top of file
- Web entry is commented out with instructions
- Does not threaten the live service

### Assessment
PM2 is not authoritative for web. The broken `pm2-slimy.service` is a stale system-level service that was never properly configured for PM2's non-forking daemon model. It does not affect web availability. However, it generates systemd failure noise and could confuse future agents.

---

## SAFE CHANGES APPLIED

1. **`/home/slimy/server-state.md`** — Updated:
   - Added explicit symlink resolution note for slimy-monorepo path
   - Added canonical supervisor note (`systemd --user slimy-web.service`)
   - Added PM2 status note (daemon running but empty, pm2-slimy.service broken)
   - Updated timestamp to 2026-03-23T16:20:00Z
   - No functional change — purely informational clarification

---

## SUDO-REQUIRED FOLLOW-UP

### `pm2-slimy.service` remediation

If the operator wants to eliminate the systemd failure noise from `pm2-slimy.service`, the following sudo-level action is required:

**Option A — Disable the service (preferred if PM2 is not needed system-wide):**
```bash
sudo systemctl disable pm2-slimy
sudo systemctl stop pm2-slimy
sudo systemctl daemon-reload
```

**Option B — Fix the service for PM2 resurrect (if PM2 system-wide management is desired):**
```bash
# File: /etc/systemd/system/pm2-slimy.service
# Current: Type=forking
# Required: Type=simple
# Also change: ExecStart should be 'pm2 resurrect' as a foreground command
# Note: pm2 resurrect is NOT a long-running daemon — it runs and exits.
# A proper PM2 system service requires a different approach (e.g., PM2 daemon as ExecStart).
```

**Validation command (after fix):**
```bash
systemctl status pm2-slimy  # should show active (running) or exited cleanly
```

**Rollback note:** Reverting to the broken state just requires `sudo systemctl reenable pm2-slimy` or restoring the file from git.

---

## EXACT NEXT RECOMMENDATION

No immediate action required. The system is stable:

1. **Live service**: Web is supervised by systemd --user, PID 2114526, HTTP 200
2. **Repo path**: Canonical truth is `/opt/slimy/slimy-monorepo` (symlink at `/home/slimy/slimy-monorepo`)
3. **PM2 residue**: Documented but not dangerous; `ecosystem.config.js` has deprecation notice
4. **Optional sudo fix**: Disable or fix `pm2-slimy.service` to eliminate systemd failure noise

Future agents should use `systemctl --user` for web management, not PM2.

---

## confidence

**0.95** — all path and supervisor ambiguities resolved with direct evidence. PM2 residue fully documented. No live service changes made.
