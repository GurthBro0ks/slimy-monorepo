# Trader Domain Stabilization (NUC2)

**Date**: 2026-01-10
**Host**: slimy-nuc2
**Branch**: feat/trader-ui-private @ e92162c
**Status**: Complete

## Goal

- Make `trader.slimyai.xyz` survive service restarts (persist boot config).
- Ensure the “real” web upstream serves `/trader` on the main deployment.
- Remove the temporary standalone Next server on `:3002` (preferred), or manage it if unavoidable.

## Safety / Rules

- Validate configs before reload/restart.
- Backup `/etc/caddy/Caddyfile` before changes.
- Log commands + key outputs, no secrets.

## Phase 1 — Baseline

### Current behavior
- `curl -I https://trader.slimyai.xyz/` => `HTTP/2 200`
- `curl -I https://trader.slimyai.xyz/trader` => `HTTP/2 307` to `/trader/login?returnTo=/trader`

### Who owns 80/443
- `sudo ss -ltnp | egrep ':(80|443)\b'`:
  - `:80` and `:443` owned by `caddy` (pid `1381`)

### Identify Caddy runtime
- `systemctl status caddy --no-pager`:
  - systemd `caddy.service` active (pid `1381`)
  - ExecStart uses `--config /etc/caddy/Caddyfile`
- `systemctl cat caddy | sed -n '1,220p'`:
  - ExecStart: `/usr/bin/caddy run --environ --config /etc/caddy/Caddyfile`
  - ExecReload: `/usr/bin/caddy reload --config /etc/caddy/Caddyfile --force`

### Current upstream situation
- `sudo ss -ltnp | egrep ':(3000|3002)\b'`:
  - `:3002` owned by `next-server` (pid `2906754`)  **(temporary hack)**
  - `:3000` owned by `docker-proxy` (pids `2504`, `2511`) **(main web)**
- `/etc/caddy/Caddyfile` check:
  - `sudo grep -n "trader\.slimyai\.xyz" /etc/caddy/Caddyfile` => no matches (not persisted)
- Docker CLI check:
  - `timeout 10 docker ps ...` => timed out (Docker API unresponsive)

## Phase 2 — Persist Caddy Config

### Backup + replace boot config
- Backup(s) created:
  - `sudo ls -la /etc/caddy/Caddyfile*`
    - `/etc/caddy/Caddyfile.bak.2026-01-10_121223`
    - `/etc/caddy/Caddyfile.bak.2026-01-10_124230`

- Validate repo config before copying:
  - `sudo caddy validate --config infra/docker/Caddyfile.slimy-nuc2`
    - `Valid configuration`

- Persist to boot path + reload:
  - `sudo cp -a infra/docker/Caddyfile.slimy-nuc2 /etc/caddy/Caddyfile`
  - `sudo systemctl reload caddy || sudo systemctl restart caddy`

- Confirm trader block is present in boot config:
  - `sudo grep -n "trader\.slimyai\.xyz" /etc/caddy/Caddyfile`
    - `101:trader.slimyai.xyz {`

## Phase 3 — Fix Real Upstream (`:3000` serves `/trader`)

### Service manager detection / upstream reality
- Caddy is systemd:
  - `systemctl status caddy --no-pager`

- Docker was unresponsive during cutover (web was previously docker-proxy on `:3000`):
  - `timeout 10 docker ps` => timed out / hung

### Fix approach: host-fallback systemd for web + admin-api
Because Docker was unhealthy, moved the “real” upstream to host-managed systemd services:
- Web (Next.js) on `:3000`:
  - `slimy-web-host.service`
- Admin API on `:3080`:
  - `slimy-admin-api-host.service`

Verification:
- Ports:
  - `sudo ss -ltnp | egrep ':(3000|3080)\b'`
    - `:3000` owned by `next-server ...`
    - `:3080` owned by `node`
- Trader routes now exist on main upstream:
  - `curl -I http://127.0.0.1:3000/trader` => `307` to `/trader/login?...`

## Phase 4 — Switch Back + Remove `:3002`

### Switch trader site back to main upstream
- `/etc/caddy/Caddyfile` `trader.slimyai.xyz` now proxies:
  - web routes -> `127.0.0.1:3000`
  - trader `/api/*` (non-web) -> `127.0.0.1:3080`

Excerpt:
- `sudo sed -n '95,125p' /etc/caddy/Caddyfile`
  - `trader.slimyai.xyz { ... reverse_proxy ... 127.0.0.1:3000 ... reverse_proxy ... 127.0.0.1:3080 ... }`

### Remove temporary standalone `:3002`
- `sudo ss -ltnp | grep ':3002'` => no listener after stopping the standalone process

## Database Recovery (MySQL)

### Symptom
- Trader auth login was returning `500` due to DB connection failures (MySQL was down).

### Root cause
- Database volume (`/var/lib/docker/volumes/slimy-db-data/_data`) was initialized by MySQL **8.4.7** (LTS).
  - `sudo head -n 1 /var/lib/docker/volumes/slimy-db-data/_data/mysql_upgrade_history`
    - `version: 8.4.7`
- Host package install initially used Ubuntu MySQL **8.0.44** and failed with:
  - `Invalid MySQL server downgrade: Cannot downgrade from 80407 to 80044`

### Fix
1) Allow MySQL to access former docker volume path:
   - AppArmor local override:
     - `sudo cat /etc/apparmor.d/local/usr.sbin.mysqld`
       - allows `/var/lib/docker/volumes/slimy-db-data/_data/**`
   - Ensure `mysqld` can traverse `/var/lib/docker` (permission fix):
     - `sudo chmod o+x /var/lib/docker` (was `710`, now `711`)

2) Upgrade MySQL server binary to match data directory version:
   - Installed `mysql-apt-config` (8.4 LTS selected) and upgraded `mysql-server` to `8.4.7` from `repo.mysql.com`.
   - `mysqld --version` => `Ver 8.4.7`

3) Start MySQL and verify listener:
   - `sudo systemctl start mysql`
   - `sudo ss -ltnp | grep ':3306'`
     - `LISTEN ... 0.0.0.0:3306 ... mysqld`

### Notes
- APT repo maintenance during this work:
  - `caddy-stable.list` temporarily disabled due to expired signing key (renamed to `caddy-stable.list.disabled`) to allow `apt-get update`.
  - A temporary MySQL repo list with an expired key was removed/disabled in favor of `mysql-apt-config`.

## Phase 5 — Final Proof

### TLS + routing
- `curl -I https://trader.slimyai.xyz/` => `HTTP/2 200`
- `curl -I https://trader.slimyai.xyz/trader` => `HTTP/2 307` to `/trader/login?returnTo=/trader`

### Auth endpoint sanity
- `curl -I https://trader.slimyai.xyz/trader/auth/me` => `HTTP/2 401`
- `POST https://trader.slimyai.xyz/trader/auth/login` (dummy creds) => `400` (no longer `500`)

### Restart persistence test
- `sudo caddy validate --config /etc/caddy/Caddyfile` => `Valid configuration`
- `sudo systemctl restart caddy`
- `curl -I https://trader.slimyai.xyz/` => `HTTP/2 200`

## Prisma + Invite Smoke (Cutover Completion)

### Prisma (web) — aborted to prevent data loss
- `cd apps/web && pnpm prisma generate` => OK
- `cd apps/web && pnpm prisma db push`
  - WARNING wanted to drop non-empty tables (`users`, `guilds`, `user_guilds`, etc.)
  - Answered `N` at prompt => `Push cancelled.`
  - Decision: do **not** run `db push` from `apps/web` against the shared prod DB.

### Prisma (admin-api) — safe sync completed
- The only remaining mismatch was two legacy tables that exist in DB:
  - `guild_settings_central` (1 row)
  - `user_settings` (1 row)
- Updated Prisma schema to model these tables (no DB changes):
  - `apps/admin-api/prisma/schema.prisma`
    - Added models: `UserSettings`, `GuildSettingsCentral`
    - Added back-relations on `User` / `Guild`
- Then applied non-destructive sync:
  - `cd apps/admin-api && pnpm prisma validate`
  - `cd apps/admin-api && pnpm prisma db push`
    - `Your database is now in sync with your Prisma schema.`

### Invite tool smoke test (code redacted)
- `pnpm tsx scripts/trader_invite_create.ts --note "cutover-test"`
  - `TRADER INVITE CODE CREATED` (plaintext invite code redacted)
