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
- Pending

## Verification
- Pending

## Files Changed
- `docs/buglog/BUG_2026-01-02_practical_recos_v2_report_driven.md`

## Commands Run (selected)
Baseline report:
- `pnpm report:nuc2`
  - Written: `docs/reports/REPORT_2026-01-02_2208_nuc2.json`
  - Written: `docs/reports/REPORT_2026-01-02_2208_nuc2.html`
  - Written: `docs/reports/LATEST_nuc2.json`
  - Summary: Tests PASS, Docker OK, Admin Health OK, Socket.IO OK

Repo status (baseline):
- `git status --porcelain=v1`
  - Untracked (excerpt): `docs/reports/*`, `docs/buglog/*`, `apps/web/public/slimechat/`
