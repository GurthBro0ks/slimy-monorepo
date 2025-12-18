# BUG 2025-12-18: Stability Gate polish + `--full` mode

Protocol: Flight Recorder: STABILITY GATE POLISH (Friendly Errors + `--full` mode)

## CONTEXT
- Repo: `/opt/slimy/slimy-monorepo`
- Script: `scripts/smoke/stability-gate.sh`
- Goal: polish UX for unreachable local services + add optional `--full` deeper checks

## A) BASELINE EVIDENCE (no code changes)

```text
## Baseline evidence: 2025-12-18T18:14:22+00:00

$ git status -sb
## nuc2/verify-role-b33e616...origin/nuc2/verify-role-b33e616

$ git log -1 --oneline
328784a docs: add verification results to stability gate buglog

$ rg -n "FULL|--full|smoke:docker|curl: \(7\)|Failed to connect|PORT 3001|admin-ui|SERVICE HEALTH" scripts/smoke/stability-gate.sh || true
143:  log "B) SERVICE HEALTH"
192:  run "pnpm --filter @slimy/admin-ui build"

$ sed -n '1,120p' scripts/smoke/stability-gate.sh
#!/usr/bin/env bash
set -euo pipefail

# Cleanup handler: copy report to docs/ops only on failure
cleanup_report() {
  local exit_code=$?

  # Only process if REPORT variable is set and file exists
  if [ -n "${REPORT:-}" ] && [ -f "$REPORT" ]; then
    if [ $exit_code -ne 0 ]; then
      # FAILURE: Copy report to persistent location
      local final_report="docs/ops/$(basename "$REPORT")"
      mkdir -p docs/ops 2>/dev/null || true
      if cp "$REPORT" "$final_report" 2>/dev/null; then
        log "Report archived (FAILURE): $final_report" >&2
      else
        log "WARNING: Could not archive report to $final_report" >&2
        log "Temp report available at: $REPORT" >&2
      fi
    else
      # SUCCESS: Report stays in /tmp
      log "Report available (SUCCESS): $REPORT"
    fi
  fi
}

trap cleanup_report EXIT

# Stability Gate: OAuth Redirect + Guild Gate Verification
#
# Verifies that OAuth redirect behavior and guild gating logic haven't regressed.
# If all checks pass, optionally creates a commit and pushes to origin.
#
# Usage: ./scripts/smoke/stability-gate.sh
# Exit codes:
#   0 - All checks passed
#   1 - One or more checks failed
#   2 - Preflight failure

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

TS="$(date +%F_%H-%M-%S)"
REPORT="/tmp/STABILITY_REPORT_${TS}_admin-oauth-guildgate.md"

# ================================
# HELPER FUNCTIONS
# ================================

log() {
  printf '%s\n' "$*"
}

# Redact secrets from output
redact() {
  sed -E \
    -e 's/(client_secret=)[^&[:space:]]+/\1[REDACTED]/gi' \
    -e 's/(authorization: Bearer )[A-Za-z0-9._-]+/\1[REDACTED]/gi' \
    -e 's/(slimy_admin=)[^;[:space:]]+/\1[REDACTED]/gi'
}

# Execute command, log to report with redaction
run() {
  local cmd="$*"
  echo -e "\n## $cmd\n\`\`\`" >> "$REPORT"
  bash -lc "$cmd" 2>&1 | redact | tee -a "$REPORT"
  echo -e "\`\`\`\n" >> "$REPORT"
}
```

## B) PLAN

- Add arg parsing near the top: support `--full` plus `-h|--help`.
- Introduce `curl_check` wrapper for required local services (esp. `admin-ui` `:3001`) that:
  - prints a friendly hint when the service is unreachable
  - includes the raw curl error output (redacted) for evidence
  - returns non-zero so `set -e` keeps fail-fast intact and the EXIT trap archives the report.
- Add `--full` deeper checks (without changing default FAST behavior):
  - run `pnpm smoke:docker`
  - add extra HTTP probes with expected status codes (no auth).
- Tighten “repo hygiene” behavior:
  - PASS: report stays in `/tmp`
  - FAIL: report copied to `docs/ops/`
  - never stage `.env*` or stability reports
  - exit `0` “verification only” when nothing is staged.

## C) CHANGES

### Before snippets (targets)

```bash
service_health() {
  run "curl -fsS -D- -o /dev/null http://localhost:3001/ | sed -n '1,15p'"
  run "curl -fsS -D- -o /dev/null http://localhost:3080/api/health | sed -n '1,20p'"
}
```

```bash
pre_commit_safety() {
  # Stage everything EXCEPT .env* and stability reports
  git add -A -- . \\
    ':(exclude).env' \\
    ':(exclude).env.*' \\
    ':(exclude)**/.env' \\
    ':(exclude)**/.env.*' \\
    ':(exclude)docs/ops/STABILITY_REPORT_*.md' 2>/dev/null || true
}
```

### After snippets

```bash
# Usage: ./scripts/smoke/stability-gate.sh [--full]

FULL=0
for arg in "$@"; do
  case "$arg" in
    --full) FULL=1 ;;
    -h|--help)
      echo "Usage: $0 [--full]"
      echo "  --full  Runs deeper checks (pnpm smoke:docker + extended HTTP probes)"
      exit 0
      ;;
  esac
done
```

```bash
curl_check "http://localhost:3001/" "admin-ui" 15
curl_check "http://localhost:3080/api/health" "admin-api health" 25
```

```bash
if [ "${FULL}" -ne 1 ]; then
  return 0
fi

run "pnpm smoke:docker"

expect_status "http://localhost:3001/" "admin-ui /" 200
expect_status "http://localhost:3001/guilds" "admin-ui /guilds" 200 302
expect_status "http://localhost:3000/" "web /" 200
expect_status "http://localhost:3080/api/health" "admin-api /api/health" 200
expect_status "http://localhost:3080/api/auth/me" "admin-api /api/auth/me" 200 401
```

```bash
# Exit early if nothing staged (verification-only mode)
if git diff --cached --quiet; then
  log "No staged changes detected. Exiting successfully (verification-only)."
  exit 0
fi
```

Note: `pnpm smoke:docker` needed hardening against port-races (competing stacks reclaiming ports while images build).
The smoke script now pre-builds images before freeing ports and doing `docker compose up`.

## D) VERIFICATION OUTPUTS

### D1) Default mode

Captured:
- Raw: `/tmp/BUG_2025-12-18_stability-gate-polish-fullmode_VERIFY_D1_default.txt`
- Sanitized (`\\r` removed): `/tmp/BUG_2025-12-18_stability-gate-polish-fullmode_VERIFY_D1_default_SAN.txt`

Excerpt:

```text
## D1 Default mode: 2025-12-18T18:20:47+00:00

$ ./scripts/smoke/stability-gate.sh
Preflight: Checking dependencies...
Preflight: OK
Report initialized: /tmp/STABILITY_REPORT_2025-12-18_18-20-47_admin-oauth-guildgate.md
...
No staged changes detected. Exiting successfully (verification-only).
Report available (SUCCESS): /tmp/STABILITY_REPORT_2025-12-18_18-20-47_admin-oauth-guildgate.md
...
$ git diff --cached --name-only

$ ls -la /tmp/STABILITY_REPORT_*_admin-oauth-guildgate.md | tail -n 3
-rw-rw-r-- 1 slimy slimy 23247 Dec 18 18:21 /tmp/STABILITY_REPORT_2025-12-18_18-20-47_admin-oauth-guildgate.md
```

### D2) Failure-archive behavior (safe simulation)

Captured:
- Raw: `/tmp/BUG_2025-12-18_stability-gate-polish-fullmode_VERIFY_D2_failarchive.txt`
- Sanitized (`\\r` removed): `/tmp/BUG_2025-12-18_stability-gate-polish-fullmode_VERIFY_D2_failarchive_SAN.txt`

Excerpt:

```text
...
================================
B) SERVICE HEALTH
================================
[FAIL] admin-ui unreachable: http://localhost:3001/
       Hint: docker compose ps | rg -n '(admin-ui|web|admin-api)'
       Hint: check ports (:3001 admin-ui, :3000 web, :3080 admin-api)
       curl error (redacted):
curl: (7) Failed to connect to localhost port 3001 after 0 ms: Couldn't connect to server

Report archived (FAILURE): docs/ops/STABILITY_REPORT_2025-12-18_18-21-49_admin-oauth-guildgate.md
```

### D3) Full mode

Captured:
- Raw: `/tmp/BUG_2025-12-18_stability-gate-polish-fullmode_VERIFY_D3_full_SUCCESS.txt`
- Sanitized (`\\r` removed): `/tmp/BUG_2025-12-18_stability-gate-polish-fullmode_VERIFY_D3_full_SUCCESS_SAN.txt`

Excerpt:

```text
## D3 Full mode (SUCCESS): 2025-12-18T18:53:21+00:00

$ ./scripts/smoke/stability-gate.sh --full
Preflight: Checking dependencies...
Preflight: OK
Report initialized: /tmp/STABILITY_REPORT_2025-12-18_18-53-21_admin-oauth-guildgate.md
...
PASS: Docker baseline smoke test
admin-ui / http://localhost:3001/ -> 200
admin-ui /guilds http://localhost:3001/guilds -> 200
web / http://localhost:3000/ -> 200
admin-api /api/health http://localhost:3080/api/health -> 200
admin-api /api/auth/me http://localhost:3080/api/auth/me -> 401
...
No staged changes detected. Exiting successfully (verification-only).
Report available (SUCCESS): /tmp/STABILITY_REPORT_2025-12-18_18-53-21_admin-oauth-guildgate.md
```
