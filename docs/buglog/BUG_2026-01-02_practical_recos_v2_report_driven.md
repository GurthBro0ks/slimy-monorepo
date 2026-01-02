# BUGLOG: Practical Recommendations (v2, report-driven)

Date: 2026-01-02
Slug: practical_recos_v2_report_driven

## Symptom / Context
- Domain under test: `https://admin.slimyai.xyz`
- Stack: `apps/admin-ui` (Next.js), `apps/admin-api` (Express), Caddy reverse proxy
- Goal:
  - A) Chat UI must be truthful (no “connecting/connected” unless real transport attempts exist).
  - B) Add a reliable debug/status panel on every admin-ui page (behind a flag).
  - C) Reduce React minified errors by preventing API failures/unmounted updates from cascading.
  - D) Verification must include Repo Health Report deltas + browser evidence.
  - E) Optional: wire realtime chat only if clearly intended + server-side exists; otherwise explicitly disable.

## Plan
1) Capture baseline Repo Health Report + baseline browser/network/console evidence.
2) Implement minimal admin-ui changes:
   - Truth-gated chat status
   - Debug/status overlay (flagged by `localStorage.slimyDebug=1`)
   - Minimal async/unmount guardrails + stable fallbacks to prevent cascades
3) Re-run Repo Health Report and compare deltas.
4) Re-capture browser evidence and document results.

## Baseline Snapshot (no fixes applied yet)

### Git
- `git rev-parse HEAD`: `2cb40aa05b4f5a23b373285c9e1580ba07e84c59`
- Notes:
  - Repo was already dirty due to existing untracked buglogs + reports under `docs/` (see Commands section).

### Repo Health Report (baseline)
Command:
- `pnpm report:nuc2`

Outputs (written by the report tool):
- `docs/reports/REPORT_2026-01-02_2208_nuc2.json`
- `docs/reports/REPORT_2026-01-02_2208_nuc2.html`
- `docs/reports/LATEST_nuc2.json`

Summary (from report stdout):
- Tests: PASS
- Docker: OK
- Admin Health: OK
- Socket.IO: OK

### Manual truth-serum baseline (browser)
Target pages:
- `https://admin.slimyai.xyz/guilds`
- `https://admin.slimyai.xyz/chat`

Evidence:
- Browser automation used Playwright-in-Docker (host lacks a local Chrome binary).
- Screenshots:
  - `docs/buglog/assets/2026-01-02_practical_recos_v2_report_driven/baseline/guilds.png`
  - `docs/buglog/assets/2026-01-02_practical_recos_v2_report_driven/baseline/chat.png`
- Network/console capture:
  - `docs/buglog/assets/2026-01-02_practical_recos_v2_report_driven/baseline/guilds.json`
  - `docs/buglog/assets/2026-01-02_practical_recos_v2_report_driven/baseline/chat.json`
  - `docs/buglog/assets/2026-01-02_practical_recos_v2_report_driven/baseline/guilds.console.txt`
  - `docs/buglog/assets/2026-01-02_practical_recos_v2_report_driven/baseline/chat.console.txt`

Findings (unauthenticated session):
- `/guilds`: no websocket activity observed; console shows 401 + redirect log.
- `/chat`: a websocket attempt is made and then closes quickly:
  - `wss://admin.slimyai.xyz/socket.io/?EIO=4&transport=websocket`
  - console shows 401 + redirect log.

## Fixes
### Fix A: Chat UI truthfulness + no fake status
What changed:
- Chat socket status is now tracked centrally and only reports:
  - `connecting` after creating a Socket.IO client
  - `connected` only after a real `connect` event
  - `error`/`disconnected` only after real events
  - `not configured` (UI label) when no socket attempt exists
- Prevent unauthenticated pages from initiating a chat socket connection (stops “vibes” websocket attempts before redirect).

Files:
- `apps/admin-ui/lib/socket.js`
- `apps/admin-ui/components/SlimeChatBar.jsx`
- `apps/admin-ui/pages/chat/index.js`
- `apps/admin-ui/components/Layout.js`

### Fix B: Debug/status panel on every page (behind a flag)
What changed:
- Debug panel is hidden by default; enable via:
  - `localStorage.setItem('slimyDebug','1')`
- Panel includes:
  - route
  - `NODE_ENV` + Next `buildId`
  - `/api/auth/me` status + timestamp
  - active guild id (session + route)
  - chat socket status + last error
  - admin-api health/diag status
  - `Copy Debug` button (compact JSON payload)

Files:
- `apps/admin-ui/components/debug/DebugDock.tsx`
- `apps/admin-ui/lib/slimy-debug.js`

### Fix C: Guardrails to reduce React cascades
What changed:
- Added a global (minimal) error boundary wrapper around pages so rendering failures don’t white-screen the entire app.
- Added cancellation guards to chat callbacks and defensive message handling.

Files:
- `apps/admin-ui/pages/_app.js`
- `apps/admin-ui/components/SlimeChatBar.jsx`
- `apps/admin-ui/pages/chat/index.js`

## Verification
### Repo Health Report (after)
Command:
- `pnpm report:nuc2`

Outputs:
- `docs/reports/REPORT_2026-01-02_2243_nuc2.json`
- `docs/reports/REPORT_2026-01-02_2243_nuc2.html`
- `docs/reports/LATEST_nuc2.json`

Delta summary vs baseline report (`docs/reports/REPORT_2026-01-02_2208_nuc2.json`):
- Head: `2cb40aa` → `a8f468e` (code changes landed)
- Tests: OK → OK
- Docker: OK → OK
- Admin Health: OK → OK
- Socket.IO: OK → OK

### Browser evidence (post-deploy)
Automation: Playwright-in-Docker, with debug enabled via `localStorage.slimyDebug=1`.

Screenshots:
- `/guilds`: `docs/buglog/assets/2026-01-02_practical_recos_v2_report_driven/postdeploy/guilds.png`
- `/chat`: `docs/buglog/assets/2026-01-02_practical_recos_v2_report_driven/postdeploy/chat.png`

Network/console captures:
- `/guilds`: `docs/buglog/assets/2026-01-02_practical_recos_v2_report_driven/postdeploy/guilds.json`
- `/chat`: `docs/buglog/assets/2026-01-02_practical_recos_v2_report_driven/postdeploy/chat.json`

Key evidence:
- Unauthenticated `/chat` no longer makes a `/socket.io` websocket attempt before redirect (baseline did); now `websockets=[]` in `postdeploy/chat.json`.
- DebugDock is visible on `/guilds` and `/chat` when enabled (see screenshots).

### Tests/Lint
- `pnpm -C apps/admin-ui test`: PASS
- `pnpm -C apps/admin-ui lint`: warnings only (`@typescript-eslint/no-explicit-any`), exit code 0

## Files Changed
- `apps/admin-ui/components/Layout.js`
- `apps/admin-ui/components/SlimeChatBar.jsx`
- `apps/admin-ui/components/debug/DebugDock.tsx`
- `apps/admin-ui/lib/slimy-debug.js`
- `apps/admin-ui/lib/socket.js`
- `apps/admin-ui/pages/_app.js`
- `apps/admin-ui/pages/chat/index.js`
- `docs/buglog/BUG_2026-01-02_practical_recos_v2_report_driven.md`

## Commands Run (selected)
Baseline report:
- `pnpm report:nuc2`
  - Written: `docs/reports/REPORT_2026-01-02_2208_nuc2.json`
  - Written: `docs/reports/REPORT_2026-01-02_2208_nuc2.html`
  - Written: `docs/reports/LATEST_nuc2.json`
  - Summary: Tests PASS, Docker OK, Admin Health OK, Socket.IO OK

Baseline browser evidence (Playwright-in-Docker):
- `docker run ... mcr.microsoft.com/playwright:latest ... pw_evidence.mjs .../baseline`
  - Screenshot: `docs/buglog/assets/2026-01-02_practical_recos_v2_report_driven/baseline/chat.png`
  - Notable: websocket attempt observed before redirect:
    - `wss://admin.slimyai.xyz/socket.io/?EIO=4&transport=websocket`

Build + deploy (nuc2 docker compose):
- `docker compose -f infra/docker/docker-compose.slimy-nuc2.yml build admin-ui`
- `docker compose -f infra/docker/docker-compose.slimy-nuc2.yml up -d admin-ui`
- `docker compose -f infra/docker/docker-compose.slimy-nuc2.yml ps`
  - `slimy-admin-ui` healthy after restart

Post-deploy browser evidence:
- `docker run ... mcr.microsoft.com/playwright:latest ... pw_evidence_after.mjs .../postdeploy`

Tests:
- `pnpm -C apps/admin-ui test`

Lint:
- `pnpm -C apps/admin-ui lint`

Commit:
- `git commit -m "fix(admin-ui): truthful chat status + debug panel + react guardrails (report-driven)"`

After report:
- `pnpm report:nuc2`
  - Written: `docs/reports/REPORT_2026-01-02_2243_nuc2.json`
  - Written: `docs/reports/REPORT_2026-01-02_2243_nuc2.html`
  - Written: `docs/reports/LATEST_nuc2.json`

Repo status (baseline):
- `git status --porcelain=v1`
  - Untracked (excerpt): `docs/reports/*`, `docs/buglog/*`, `apps/web/public/slimechat/`
