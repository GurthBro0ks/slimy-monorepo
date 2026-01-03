# CONTINUITY LEDGER

## Goal (success criteria)
- Maintain compaction-safe continuity for the Slimy monorepo (Codex/agents can resume work correctly).
- Keep prod builds clean (no `localhost`/loopback in public-facing configs).
- Prepare shared Settings + Memory so Discord (/commands) and Web UI stay in sync.

## Constraints / Non-negotiables
- **No localhost in prod**: Production artifacts must not reference `localhost`, `127.0.0.1`, or internal service DNS in any `NEXT_PUBLIC_*` or other client-visible output.
- **Dev overrides only**: Localhost/loopback belongs in dev-only compose override files (ex: `docker-compose.dev.yml`) or local env—not in base prod defaults.
- **Flight Recorder**: Any non-trivial fix/change gets a buglog entry in `docs/buglog/` with commands + evidence.
- **UI debug/status rule**: Every UI page change should include a temporary debug/status area/button.

## Key decisions
- **Agent Rules**: Use `AGENTS.md` at repo root + per-folder overrides.
- **Continuity Strategy**:
  - `CONTINUITY.md` = canonical *current* state (short).
  - `docs/buglog/` = detailed evidence + timelines.
- **Shared Settings & Memory** (incoming):
  - One canonical `UserSettings` per user and `GuildSettings` per guild (auto-init on first use).
  - Discord bot commands and website UI both read/write the same settings via `admin-api` (or a dedicated shared service behind it).
  - “Memory” starts as structured summaries/state in DB (not raw chat logs by default), then can evolve to Memori or another engine later.

## State

### Done
- Admin UI prod hardening: no localhost public URLs; dev-only override supported; build guardrails to prevent loopback in `NEXT_PUBLIC_*`.
- Added verification scripts for “no localhost” regression (and CI step if present).
- Settings+Memory v0: shared contracts + admin-api persistence/endpoints + regression check.
- Settings+Memory v0 hardening: tightened authz + kind allowlist (blocks cross-user access; blocks `project_state` for `scopeType=user` for non-admins).
- Settings Sync Clients v0.1: bot + admin-ui wired to central settings/memory endpoints (markdown toggle, widget toggle, `profile_summary` write); memory kind policy centralized in `@slimy/contracts`; internal bot auth token support added; CI runs v0.1 verify + no-localhost client source scan.
- Settings Sync Events v0.2: settings update audit trail + cursor endpoint; events written on settings updates; bot + admin-ui consume changes on-demand; CI runs v0.2 regression.
- Web Settings UI v0.3: `apps/web` `/settings` + `/club/[guildId]/settings` JSON editors calling the same admin-api endpoints/contracts; web verify script scans built client artifacts for loopback; client login redirects use `/api/auth/login` (no baked `NEXT_PUBLIC_ADMIN_API_BASE`).
- Web Settings UI v0.31: added “Basic Settings” panels above the JSON editors (theme/chat/snail + widget/channels) while keeping JSON as the advanced/source-of-truth view.
- Web Settings UI v0.32: settings pages polished with save state machine, diff preview, reset, and stale-change warning (via settings change cursor) + v0.32 verify script.
- Web Settings UI v0.33: settings discoverability + drafts/unsaved guards + improved diff + memory panel + v0.33 verify script (CI-safe).
- Web Settings Activity v0.34: added Settings Activity widget (recent change events) on `/status` (user scope) + `/club` (guild scope) + v0.34 verify script (CI-safe).
- Web Active Guild Scope v0.35: persisted `activeGuildId` in central UserSettings + `/settings` picker + activity widget scope switcher + v0.35 verify script (CI-safe).
- Web Guild Identity v0.36: added cached guildId→name/icon identity layer and updated Active Club + Settings Activity UIs to show human-friendly labels/icons + v0.36 verify script (CI-safe).
- Web Settings 500 fix v0.37: admin-api shared guilds now accepts `DISCORD_BOT_TOKEN` fallback; web `/api/discord/guilds` hardened + `/club` resolves active guild with graceful fallback + v0.37 verify script (CI-safe).
- Web Club routing polish v0.38: `/club` explicit auth/no-club states + URL override “Set as Active Club”; `/settings` Active Club picker manual guild-id recovery; Settings Activity fallbacks + v0.38 verify script (CI-safe).
- AGENTS.md + CONTINUITY checks enforced in CI.
- Local preflight: `scripts/verify/compose-ports-available.sh` detects host port collisions before `docker compose up`.
- CI guardrail: `scripts/verify/compose-config-valid.sh` ensures `docker compose config` succeeds (catches compose/env/YAML issues).
- Bot image fix: ensure runtime deps (incl `discord.js`) are included; added local verify `scripts/verify/bot-runtime-deps.sh`.
- Admin-api migration hardening: run `prisma migrate deploy` on container startup (prevents settings/memory endpoints 500ing when DB migrations are missing).
- Prod DB recovery (nuc2): resolved failed Prisma migration `20251213160000_align_admin_api_schema` and applied missing central settings/memory/event migrations so `slimy-admin-api` stays up.
- Prisma drift fix: aligned `apps/admin-api/prisma/schema.prisma` with short varchar columns used in existing migrations (prevents `migrate diff` drift alarms).
- NUC2 compose hardening: docker Caddy service is profile-gated (systemd Caddy is canonical) to avoid port/ACME conflicts.
- Admin-ui auth proxy hardening: `admin-ui` discord callback proxy honors `ADMIN_API_INTERNAL_URL` even when it is loopback, and no longer leaks upstream fetch error messages to clients.
- Web chat hardening (chat-iframe-wrapper): added `/chat` as an iframe wrapper around `apps/web/public/slimechat/index.html` (legacy UI quarantined) with required debug/status box + iframe load status + cache-busting query param; backed up previous `apps/web/app/chat/page.tsx`.
- Discord OAuth redirect_uri hardening: `apps/admin-ui` authorize URL now uses `DISCORD_REDIRECT_URI` directly (no `/api/admin-api` prefix drift) with a debug endpoint; added `/api/auth/callback` alias and updated compose/docs defaults to `https://admin.slimyai.xyz/api/auth/callback` (dev: `http://localhost:3001/api/auth/callback`).
- Admin UI Practical Recos v2 (2026-01-02): chat status truth-gated + debug/status panel behind `localStorage.slimyDebug=1` + minimal error boundary/async guards (buglog: `docs/buglog/BUG_2026-01-02_practical_recos_v2_report_driven.md`).

### Now
- Keep hard safety rails green (no loopback in public output; no secrets in memory).
- Ops note (nuc2): `docker compose` reads `.env` and can silently override OAuth redirects; keep `DISCORD_REDIRECT_URI` on the canonical `https://admin.slimyai.xyz/api/auth/callback` (verify via `/api/auth/discord/authorize-url?debug=1`).
- Admin panel stabilization (2026-01-02): fix Socket.IO chat connectivity, settings URL/proxy prefixing (`/api/admin-api`), guild availability/botInstalled gating, and `active-guild` 400 retry loop; then small UI typo + minimal anti-cascade guards.
- Admin panel stabilization (2026-01-02): investigate `active-guild` `503` + `/api/guilds` stuck + chat connect/disconnect loop cascade (buglog: `docs/buglog/BUG_2026-01-02_activeguild_503_guilds_stuck_chat_loop.md`).
- Investigate `discord-callback-self-redirect-loop`: `/api/auth/callback` 302 loops back to itself after successful Discord authorization (Chrome `ERR_TOO_MANY_REDIRECTS`).
- Flight Recorder v3 (2026-01-03): report fields verified (dirtyFiles/diffStat, tokei notice, checklist); ran `pnpm report:nuc2` at `2026-01-03_1056`; unauth truth-gate evidence captured; auth+/chat evidence still UNCONFIRMED.
- NOTE (2026-01-03): Chromium installed on nuc2; unauth truth-gate captured via headless CDP; auth+/chat still requires manual login evidence.
- Flight Recorder v4 (2026-01-03): Discord guilds 429 (cache/backoff) investigation started; evidence gate pending in `docs/buglog/BUG_2026-01-03_discord_guilds_429_cache_backoff.md`.
- Flight Recorder v4 (2026-01-03): guilds 429 browser evidence duplicated into `docs/buglog/assets/2026-01-03_discord_guilds_429_cache_backoff_v2/browser/` for protocol naming; buglog updated to reference v2 assets.
- Flight Recorder v4 (2026-01-03): Discord guilds 429 fixed via shared cache + coalescing + cooldown; verified 200 + cache headers; evidence in v2 assets path.
- Flight Recorder v4 (2026-01-03): added guilds cache observability + bot-check caching + report regression probe (unauth by default, auth via `REPORT_ADMIN_COOKIE`); browser evidence still UNCONFIRMED.

### Next
- Web Settings UI: polish/UX and deep links (keep non-chat scope).
- Add “MemoryProvider” abstraction behind admin-api (DB v0 -> Memori later) without contract changes.

## Open questions (UNCONFIRMED if needed)
- UNCONFIRMED: Whether “memory” should later move from primary DB to a dedicated service container (after v0).

## Working set (files/ids/commands)
- Root: `CONTINUITY.md`, `AGENTS.md`
- Per-folder: `apps/*/AGENTS.md`, `packages/AGENTS.md`, `scripts/AGENTS.md`, `docs/AGENTS.md`
- Verify scripts: `scripts/verify/*`
- Common commands:
  - `docker compose up -d --build`
  - `pnpm -w test` / `pnpm -w lint` (when available)
  - `scripts/verify/*` (when touching env/auth/build outputs)
