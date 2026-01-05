# BUG 2026-01-03 — Practical Recos v3 (report + DebugDock + truth-gate)

## Symptom / context
- Repo Health Report shows `Dirty: true` but does not show *which* files are dirty.
- `tokei` missing produces a warning but the HTML language section is confusing/empty.
- Need report-driven verification that chat truth-gating stays truthful (no phantom `/socket.io` on unauth/non-chat pages; real evidence on chat page when it actually connects).
- DebugDock “Copy Debug” needs to be evidence-first (timestamp/route/build/auth/chat/requestIds/last socket event).
- ErrorBoundary + guards must not hide real issues; need minimal “reportable error capture” (observe-only).

## Plan
1) Capture baseline evidence (git state, current report output, key endpoints, browser/network truth check).
2) Report: add dirty files + diffStat (truncated, no full diffs), add tokei-missing UX, add truth-gate checklist section.
3) DebugDock: expand “Copy Debug” payload + add window error/unhandledrejection capture (in-memory only).
4) Verify: run tests + `pnpm report:nuc2`, capture before/after report artifacts + excerpts + screenshots.

## Baseline snapshot (no code changes yet)

### A) Git + repo cleanliness
```bash
cd /opt/slimy/slimy-monorepo
git rev-parse HEAD
```
Output:
```text
4c80a5b5903ea4f9c270c027dbbe7b22fddb195e
```

```bash
git status --porcelain=v1
```
Output (excerpt):
```text
?? apps/web/app/chat/page.backup-2025-12-28.tsx
?? apps/web/public/slimechat/
?? docs/buglog/BUG_2025-12-28_caddy-502-admin-api-migration-loop.md
?? docs/buglog/BUG_2025-12-28_chat-iframe-wrapper.md
?? docs/buglog/BUG_2025-12-28_discord-invalid-redirect-uri.md
?? docs/buglog/BUG_2025-12-28_discord-oauth-redirect-uri.md
?? docs/buglog/BUG_2025-12-31_admin-guilds-empty_ws-proxy_caddy-2019.md
?? docs/buglog/BUG_2025-12-31_oauth-callback-self-redirect-prod.md
?? docs/buglog/BUG_2025-12-31_post-login-wrong-domain.md
?? docs/buglog/assets/
?? docs/reports/LATEST_nuc2.json
?? docs/reports/REPORT_2026-01-02_2138_nuc2.html
?? docs/reports/REPORT_2026-01-02_2138_nuc2.json
?? docs/reports/REPORT_2026-01-02_2154_nuc2.html
?? docs/reports/REPORT_2026-01-02_2154_nuc2.json
?? docs/reports/REPORT_2026-01-02_2208_nuc2.html
?? docs/reports/REPORT_2026-01-02_2208_nuc2.json
?? docs/reports/REPORT_2026-01-02_2228_nuc2.html
?? docs/reports/REPORT_2026-01-02_2228_nuc2.json
?? docs/reports/REPORT_2026-01-02_2243_nuc2.html
?? docs/reports/REPORT_2026-01-02_2243_nuc2.json
?? docs/reports/REPORT_2026-01-03_0001_nuc2.html
?? docs/reports/REPORT_2026-01-03_0001_nuc2.json
?? docs/reports/REPORT_2026-01-03_0007_nuc2.html
?? docs/reports/REPORT_2026-01-03_0007_nuc2.json
?? docs/reports/vendor/
```

```bash
git diff --stat
```
Output:
```text
(no output)
```

### B) Current report run (baseline artifact)
```bash
pnpm report:nuc2
```
Output (excerpt):
```text
=== Repo Health Report Generator ===

Timestamp: 2026-01-03_0031
Host: nuc2
Repo: /opt/slimy/slimy-monorepo
Retention: keep=30

Collecting data...
  [git] Collecting git info...
  [env] Collecting environment fingerprint...
  [health] Running health checks...
    - Running tests...
    - Checking docker availability...
    - Checking docker compose...
    - Checking admin health endpoint...
    - Checking socket.io endpoint...
  [stats] Collecting repo stats...
    - Running tokei...
    - Warning: tokei not available or failed
    - Calculating folder sizes...
  [delta] Calculating delta...

Written: /opt/slimy/slimy-monorepo/docs/reports/REPORT_2026-01-03_0031_nuc2.json
Written: /opt/slimy/slimy-monorepo/docs/reports/REPORT_2026-01-03_0031_nuc2.html
Written: /opt/slimy/slimy-monorepo/docs/reports/LATEST_nuc2.json

=== Report Summary ===
Branch: nuc2/verify-role-b33e616
HEAD: 4c80a5b
Dirty: true
Tests: PASS
Docker: OK
Admin Health: OK
Socket.IO: OK
```

```bash
ls -lh docs/reports/REPORT_*_nuc2.json docs/reports/REPORT_*_nuc2.html docs/reports/LATEST_nuc2.json | tail -n 10
```
Output:
```text
-rw-rw-r-- 1 slimy slimy 101K Jan  2 22:28 docs/reports/REPORT_2026-01-02_2228_nuc2.html
-rw-rw-r-- 1 slimy slimy  97K Jan  2 22:28 docs/reports/REPORT_2026-01-02_2228_nuc2.json
-rw-rw-r-- 1 slimy slimy 101K Jan  2 22:43 docs/reports/REPORT_2026-01-02_2243_nuc2.html
-rw-rw-r-- 1 slimy slimy  97K Jan  2 22:43 docs/reports/REPORT_2026-01-02_2243_nuc2.json
-rw-rw-r-- 1 slimy slimy 110K Jan  3 00:02 docs/reports/REPORT_2026-01-03_0001_nuc2.html
-rw-rw-r-- 1 slimy slimy 115K Jan  3 00:02 docs/reports/REPORT_2026-01-03_0001_nuc2.json
-rw-rw-r-- 1 slimy slimy 110K Jan  3 00:08 docs/reports/REPORT_2026-01-03_0007_nuc2.html
-rw-rw-r-- 1 slimy slimy 115K Jan  3 00:08 docs/reports/REPORT_2026-01-03_0007_nuc2.json
-rw-rw-r-- 1 slimy slimy 101K Jan  3 00:32 docs/reports/REPORT_2026-01-03_0031_nuc2.html
-rw-rw-r-- 1 slimy slimy  97K Jan  3 00:32 docs/reports/REPORT_2026-01-03_0031_nuc2.json
```

### C) Key endpoints (baseline excerpts)
```bash
curl -sS https://admin.slimyai.xyz/api/health | head -c 2000; echo
```
Output:
```json
{"status":"ok","uptime":9064,"timestamp":"2026-01-03T00:31:08.438Z","version":"1.0.0"}
```

```bash
curl -sS https://admin.slimyai.xyz/api/diag | head -c 2000; echo
```
Output:
```json
{"ok":true,"authenticated":false}
```

```bash
# NOTE: URL must be quoted because it contains '&'
curl -sS -i 'https://admin.slimyai.xyz/socket.io/?EIO=4&transport=polling' | head -n 40
```
Output (excerpt):
```text
HTTP/2 200
access-control-allow-credentials: true
cache-control: no-store
content-type: text/plain; charset=UTF-8
via: 1.1 Caddy
content-length: 118

0{"sid":"67fYP4SD2hwCXRMqAAAQ","upgrades":["websocket"],"pingInterval":25000,"pingTimeout":20000,"maxPayload":1000000}
```

### D) Browser (Incognito) baseline truth test
- UNCONFIRMED: not captured yet in this buglog (DevTools Network “no socket.io on /login”, DebugDock “Copy Debug” baseline paste, screenshots).
- Note: automated browser capture via the built-in Chrome DevTools tool is blocked here because no Chrome executable is installed (`/opt/google/chrome/chrome` missing).

## Files changed
- `CONTINUITY.md`
- `scripts/report/run.mjs`
- `apps/admin-ui/lib/socket.js`
- `apps/admin-ui/lib/slimy-debug.js`
- `apps/admin-ui/components/debug/DebugDock.tsx`
- `docs/buglog/BUG_2026-01-03_practical_recos_v3_report_debug_truthgate.md`
- `docs/buglog/assets/2026-01-03_practical_recos_v3_report_debug_truthgate/browser/README.md`

## Commands run (with outputs)
- See “Baseline snapshot” section, plus:
  - `pnpm report:nuc2` (baseline report for browser section)
  - Chromium install: `sudo apt-get update && sudo apt-get install -y chromium-browser`
  - Admin-ui deploy: `DOCKER_BUILDKIT=0 docker compose -f infra/docker/docker-compose.slimy-nuc2.yml build admin-ui` + `docker compose ... up -d --no-deps --force-recreate admin-ui`
  - Unauth evidence capture (headless CDP): wrote `unauth_*` assets under `docs/buglog/assets/2026-01-03_practical_recos_v3_report_debug_truthgate/browser/`

## Verification evidence
- Baseline report artifacts: `docs/reports/REPORT_2026-01-03_0031_nuc2.json`, `docs/reports/REPORT_2026-01-03_0031_nuc2.html`, `docs/reports/LATEST_nuc2.json`
- Endpoint excerpts: `/api/health`, `/api/diag`, `/socket.io/?EIO=4&transport=polling`
- Unauth truth-gate artifacts: `docs/buglog/assets/2026-01-03_practical_recos_v3_report_debug_truthgate/browser/unauth_network_evidence.json`, `docs/buglog/assets/2026-01-03_practical_recos_v3_report_debug_truthgate/browser/unauth_copydebug.txt`, `docs/buglog/assets/2026-01-03_practical_recos_v3_report_debug_truthgate/browser/unauth_network.png`, `docs/buglog/assets/2026-01-03_practical_recos_v3_report_debug_truthgate/browser/unauth_console.png`

---

## Changes applied (smallest safe diffs)

### A) Report dirty files + diffStat (truncated, no diffs)
- Added `git.dirtyFiles` (porcelain v1, top 50), `git.diffStat` (staged/unstaged, top 50 lines) to report JSON.
- HTML now shows “Dirty files (top N)” and “Diff stat” panels when dirty.
- Fixed a subtle parsing issue: report runner previously trimmed leading whitespace from command output, which corrupts `git status --porcelain` lines that start with a leading space.

### B) tokei missing UX
- `stats.languages.error = "tokei_unavailable"` and `stats.languages.hint` when tokei is missing.
- HTML shows “Language chart unavailable: tokei_unavailable” with the install hint instead of an empty chart.

### C) Truth-gate checklist in report (manual)
- HTML includes a “Truth Gate Checklist (Manual)” section describing what to verify for unauth vs auth + `/chat` evidence expectations.

### D/E) DebugDock evidence payload + non-invasive error capture
- “Copy Debug” payload now includes requestIds (health/diag/auth-me/discord-guilds), chat lastEvent (name/ts), and last 3 captured window errors/unhandledrejections (in-memory only).

## Verification (post-change)

### Tests
```bash
pnpm -C apps/admin-ui test
```
Output (excerpt):
```text
[PASS] normalizeOrigin tests
[PASS] authorize-url canonical redirect_uri
[PASS] oauth post-login redirect tripwires
```

```bash
pnpm -C apps/admin-api test
```
Result: PASS (with warning about a worker process not exiting gracefully; likely open handles/timers).

### Report run (post-change)
```bash
pnpm report:nuc2
```
Artifacts:
- `docs/reports/REPORT_2026-01-03_0043_nuc2.json`
- `docs/reports/REPORT_2026-01-03_0043_nuc2.html`
- `docs/reports/LATEST_nuc2.json`

JSON evidence excerpts:
```js
git.dirtyFiles[0] = { status: " M", path: "CONTINUITY.md" }
stats.languages.error = "tokei_unavailable"
```

HTML evidence (grep excerpts):
- “Dirty files (top …)” present
- “Truth Gate Checklist (Manual)” present
- “Language chart unavailable: tokei_unavailable” present

### Dirty=true field population probe (theatre check)
Goal: ensure `git.dirtyFiles` and `git.diffStat` are populated (not empty theatre) when the repo is dirty.

```bash
cd /opt/slimy/slimy-monorepo
echo "# dirty check $(date -Is)" >> docs/buglog/_dirty_probe.md
pnpm report:nuc2
```
Artifacts:
- `docs/reports/REPORT_2026-01-03_0050_nuc2.json`
- `docs/reports/REPORT_2026-01-03_0050_nuc2.html`

```bash
node -e '
const r=require("./docs/reports/LATEST_nuc2.json");
console.log("dirty:", r.git?.dirty);
console.log("dirtyFiles sample:", (r.git?.dirtyFiles||[]).slice(0,5));
console.log("diffStat sample:", (r.git?.diffStat||"").split("\n").slice(0,8).join("\n"));
'
```
Output:
```text
dirty: true
dirtyFiles sample: [
  { status: ' M', path: 'CONTINUITY.md' },
  {
    status: ' M',
    path: 'apps/admin-ui/components/debug/DebugDock.tsx'
  },
  { status: ' M', path: 'apps/admin-ui/lib/slimy-debug.js' },
  { status: ' M', path: 'apps/admin-ui/lib/socket.js' },
  { status: ' M', path: 'scripts/report/run.mjs' }
]
diffStat sample: --- unstaged ---
CONTINUITY.md                                |  1 +
 apps/admin-ui/components/debug/DebugDock.tsx | 54 ++++++++++++++---
 apps/admin-ui/lib/slimy-debug.js             | 81 +++++++++++++++++++++++++
 apps/admin-ui/lib/socket.js                  | 21 ++++++-
 scripts/report/run.mjs                       | 90 +++++++++++++++++++++++++---
 5 files changed, 230 insertions(+), 17 deletions(-)
```

Cleanup:
```bash
git checkout -- docs/buglog/_dirty_probe.md 2>/dev/null || rm -f docs/buglog/_dirty_probe.md
```

### Quick HTML sanity check (tokei notice + truth gate checklist)
```bash
ls -1t docs/reports/REPORT_*_nuc2.html | head -n 1 | xargs -I{} sh -c '
echo "FILE: {}"
grep -n "Truth Gate Checklist" "{}" | head
grep -n "Language chart unavailable" "{}" | head
'
```
Output:
```text
FILE: docs/reports/REPORT_2026-01-03_0050_nuc2.html
260:      <!-- Truth Gate Checklist -->
262:        <h2>Truth Gate Checklist (Manual)</h2>
276:          <p class="meta"><span class="fail">Language chart unavailable:</span> <code>tokei_unavailable</code></p>
```

## Browser truth-gate evidence (truth-gated; evidence-first)

### Baseline report (no code changes)
```bash
cd /opt/slimy/slimy-monorepo
pnpm report:nuc2
```
Artifacts:
- `docs/reports/REPORT_2026-01-03_1056_nuc2.json`
- `docs/reports/REPORT_2026-01-03_1056_nuc2.html`
- `docs/reports/LATEST_nuc2.json`

Output (excerpt):
```text
Timestamp: 2026-01-03_1056
Host: nuc2
Dirty: true
Tests: PASS
Docker: OK
Admin Health: OK
Socket.IO: OK
```

### Browser tooling note (nuc2)
Operator installed Chromium to enable manual captures:
```bash
sudo apt-get update
sudo apt-get install -y chromium-browser
chromium-browser --version
```
Output (excerpt):
```text
Chromium 143.0.7499.146 snap
```
Note: the install emitted an `apt-get update` warning about an expired Caddy repo signing key (`EXPKEYSIG ... Caddy Web Server`). This did not block the Chromium install.

### UNAUTH truth assertion (PASS)
URL:
- `https://admin.slimyai.xyz/login?returnTo=%2Fchat`

Evidence capture method:
- Headless Chromium via CDP (local), collecting `Network.*` events + screenshots + “Copy Debug” payload.

Commands (excerpt):
```bash
nohup /usr/bin/chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-address=127.0.0.1 --remote-debugging-port=9222 \
  --remote-allow-origins=* --user-data-dir=/tmp/slimy-truthgate-chrome about:blank \
  >/tmp/slimy-truthgate-chrome.log 2>&1 &
```

Evidence files:
- `docs/buglog/assets/2026-01-03_practical_recos_v3_report_debug_truthgate/browser/unauth_network.png`
- `docs/buglog/assets/2026-01-03_practical_recos_v3_report_debug_truthgate/browser/unauth_console.png`
- `docs/buglog/assets/2026-01-03_practical_recos_v3_report_debug_truthgate/browser/unauth_copydebug.txt`
- `docs/buglog/assets/2026-01-03_practical_recos_v3_report_debug_truthgate/browser/unauth_network_evidence.json`

Key evidence excerpt (`unauth_network_evidence.json`):
```json
{
  "ts": "2026-01-03T02:25:10Z",
  "interestingRequests": [],
  "interestingWebSockets": [],
  "totals": { "wsCreated": 0 }
}
```

DebugDock evidence excerpt (`unauth_copydebug.txt`):
- `authMe.status="unauth"` + `code=401` + `requestId` present
- `requestIds.*` present (health/diag/authMe)
- `chat.state="idle"`, `chat.lastEventName=null`
- `errors=[]`

Hard FAIL condition:
- Any `/socket.io` polling request or WS upgrade appears while unauthenticated.

### DebugDock Copy Debug payload (regression found + fixed)
Finding:
- Initial capture showed “Copy Debug” missing `requestIds` and `errors` (and `authMe.requestId`), indicating the running `slimy-admin-ui` container image was behind the repo changes.

Pre-deploy evidence (archived):
- `docs/buglog/assets/2026-01-03_practical_recos_v3_report_debug_truthgate/browser/unauth_network_20260103T022328Z_predeploy.png`
- `docs/buglog/assets/2026-01-03_practical_recos_v3_report_debug_truthgate/browser/unauth_console_20260103T022328Z_predeploy.png`
- `docs/buglog/assets/2026-01-03_practical_recos_v3_report_debug_truthgate/browser/unauth_copydebug.txt_20260103T022328Z_predeploy.txt`
- `docs/buglog/assets/2026-01-03_practical_recos_v3_report_debug_truthgate/browser/unauth_network_evidence.json_20260103T022328Z_predeploy.json`

Fix (deploy only; no new features):
```bash
cd /opt/slimy/slimy-monorepo
DOCKER_BUILDKIT=0 docker compose -f infra/docker/docker-compose.slimy-nuc2.yml build admin-ui
docker compose -f infra/docker/docker-compose.slimy-nuc2.yml up -d --no-deps --force-recreate admin-ui
docker inspect -f '{{.State.Health.Status}}' slimy-admin-ui
```
Result:
- `slimy-admin-ui` became `healthy`
- Post-deploy unauth “Copy Debug” now includes required fields (see `unauth_copydebug.txt`)

### AUTH + /chat realtime assertion (expected: PASS; UNCONFIRMED until screenshots/paste added)
URL:
- `https://admin.slimyai.xyz/chat`

Required evidence files:
- `auth_chat_network.png`
- `auth_chat_ws_or_polling.png` (must show polling open packet `0{...}` OR WS `101 Switching Protocols`)
- `auth_chat_console.png`
- `auth_chat_copydebug.txt`

Hard FAIL conditions:
- UI says connected but Network shows no realtime at all.
- `/socket.io` requests exist but never show open packet / WS 101 (always 4xx/5xx).
- DebugDock “Copy Debug” missing required fields (timestamp/route/buildId, auth/me status + requestId, requestIds incl `/api/discord/guilds` when applicable, chat lastEvent (or explicit none), last 3 window errors arrays).

### Truth Gate status
- UNAUTH `/login?returnTo=%2Fchat`: PASS (0 socket/engine.io attempts; chat idle; Copy Debug includes requestIds/errors)
- AUTH + `/chat`: FAIL (evidence missing; manual Discord OAuth login required to capture the `auth_chat_*` assets listed above)

### Screenshots / assets
- Evidence folder: `docs/buglog/assets/2026-01-03_practical_recos_v3_report_debug_truthgate/browser/` (see README in folder)
