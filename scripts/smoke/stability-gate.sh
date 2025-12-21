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
# Usage: ./scripts/smoke/stability-gate.sh [--full]
# Exit codes:
#   0 - All checks passed
#   1 - One or more checks failed
#   2 - Preflight failure

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

TS="$(date +%F_%H-%M-%S)"
REPORT="/tmp/STABILITY_REPORT_${TS}_admin-oauth-guildgate.md"

FULL=0
for arg in "$@"; do
  case "$arg" in
    --full) FULL=1 ;;
    -h|--help)
      echo "Usage: $0 [--full]"
      echo "  --full  Runs deeper checks (pnpm smoke:docker + extended HTTP probes)"
      exit 0
      ;;
    *)
      echo "ERROR: Unknown argument: $arg" >&2
      echo "Usage: $0 [--full]" >&2
      exit 2
      ;;
  esac
done

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
    -e 's/(slimy_admin=)[^;[:space:]]+/\1[REDACTED]/gi' \
    -e 's/(set-cookie: [^=]+=)[^;[:space:]]+/\1[REDACTED]/gi'
}

# Execute command, log to report with redaction
run() {
  local cmd="$*"
  echo -e "\n## $cmd\n\`\`\`" >> "$REPORT"
  bash -lc "$cmd" 2>&1 | redact | tee -a "$REPORT"
  echo -e "\`\`\`\n" >> "$REPORT"
}

curl_check() {
  local url="$1"
  local name="$2"
  local max_lines="${3:-20}"
  local out=""

  echo -e "\n## $name: $url\n\`\`\`" >> "$REPORT"

  if ! out="$(curl -fsS -D- -o /dev/null "$url" 2>&1)"; then
    log "[FAIL] $name unreachable: $url" | tee -a "$REPORT"
    if printf '%s\n' "$out" | grep -qiE 'Failed to connect|Connection refused|Could not resolve host|timed out'; then
      log "       Hint: docker compose ps | rg -n '(admin-ui|web|admin-api)'" | tee -a "$REPORT"
      log "       Hint: check ports (:3001 admin-ui, :3000 web, :3080 admin-api)" | tee -a "$REPORT"
    fi
    log "       curl error (redacted):" | tee -a "$REPORT"
    printf '%s\n' "$out" | redact | tee -a "$REPORT"
    echo -e "\`\`\`\n" >> "$REPORT"
    return 1
  fi

  printf '%s\n' "$out" | redact | sed -n "1,${max_lines}p" | tee -a "$REPORT"
  echo -e "\`\`\`\n" >> "$REPORT"
}

expect_status() {
  local url="$1"
  local name="$2"
  shift 2
  local ok=" $* "
  local out=""
  local code=""

  echo -e "\n## PROBE: $name\n- URL: $url\n- Expected: $*\n\`\`\`" >> "$REPORT"

  if ! out="$(curl -sS -o /dev/null -w '%{http_code}' "$url" 2>&1)"; then
    code="000"
    log "$name $url -> $code" | tee -a "$REPORT"
    log "[FAIL] $name unreachable: $url" | tee -a "$REPORT"
    if printf '%s\n' "$out" | grep -qiE 'Failed to connect|Connection refused|Could not resolve host|timed out'; then
      log "       Hint: docker compose ps | rg -n '(admin-ui|web|admin-api)'" | tee -a "$REPORT"
      log "       Hint: check ports (:3001 admin-ui, :3000 web, :3080 admin-api)" | tee -a "$REPORT"
    fi
    log "       curl error (redacted):" | tee -a "$REPORT"
    printf '%s\n' "$out" | redact | tee -a "$REPORT"
    echo -e "\`\`\`\n" >> "$REPORT"
    return 1
  fi

  code="$out"
  log "$name $url -> $code" | tee -a "$REPORT"
  echo -e "\`\`\`\n" >> "$REPORT"

  if [[ "$ok" != *" $code "* ]]; then
    log "[FAIL] $name unexpected status $code (expected:$ok)" | tee -a "$REPORT"
    return 1
  fi
}

# Fail if pattern IS found in URL response (works correctly with set -e)
assert_absent() {
  local url="$1"
  local pattern="$2"
  echo -e "\n## ASSERT ABSENT: $pattern in $url\n\`\`\`" >> "$REPORT"
  if curl -fsS "$url" | grep -E "$pattern" >/dev/null; then
    log "[FAIL] Found forbidden pattern: $pattern" | tee -a "$REPORT"
    echo -e "\`\`\`\n" >> "$REPORT"
    exit 1
  fi
  log "[PASS] Pattern absent: $pattern" | tee -a "$REPORT"
  echo -e "\`\`\`\n" >> "$REPORT"
}

# ================================
# PREFLIGHT CHECKS
# ================================

preflight() {
  log "Preflight: Checking dependencies..."

  if ! command -v curl >/dev/null 2>&1; then
    log "ERROR: curl not found"
    exit 2
  fi

  if ! command -v docker >/dev/null 2>&1; then
    log "ERROR: docker not found"
    exit 2
  fi

  if ! docker compose ps >/dev/null 2>&1; then
    log "ERROR: docker compose not working"
    exit 2
  fi

  log "Preflight: OK"
}

# ================================
# INITIALIZE REPORT
# ================================

initialize_report() {
  {
    echo "# Stability Report: admin oauth + guild gate"
    echo "- Timestamp: $(date -Is)"
    echo "- Repo: ${ROOT_DIR}"
    echo ""
  } > "$REPORT"

  log "Report initialized: $REPORT"
}

# ================================
# MAIN CHECKS
# ================================

baseline_sanity() {
  log ""
  log "================================"
  log "A) BASELINE SANITY"
  log "================================"

  run "git status -sb"
  run "git rev-parse --abbrev-ref HEAD"
  run "node -v; pnpm -v"
  run "docker compose ps"
}

service_health() {
  log ""
  log "================================"
  log "B) SERVICE HEALTH"
  log "================================"

  curl_check "http://localhost:3001/" "admin-ui" 15
  curl_check "http://localhost:3080/api/health" "admin-api health" 25
}

full_mode_checks() {
  if [ "${FULL}" -ne 1 ]; then
    return 0
  fi

  log ""
  log "================================"
  log "E) FULL MODE (DEEPER CHECKS)"
  log "================================"

  run "pnpm smoke:docker"

  expect_status "http://localhost:3001/" "admin-ui /" 200
  expect_status "http://localhost:3001/guilds" "admin-ui /guilds" 200 302
  expect_status "http://localhost:3000/" "web /" 200
  expect_status "http://localhost:3080/api/health" "admin-api /api/health" 200
  expect_status "http://localhost:3080/api/auth/me" "admin-api /api/auth/me" 200 401
}

critical_behavior_checks() {
  log ""
  log "================================"
  log "C) CRITICAL BEHAVIOR CHECKS"
  log "================================"

  # C1: Canonical OAuth entrypoint must produce redirect_uri to admin-ui callback.
  # Allow localhost for dev stacks, or admin.slimyai.xyz for production-like stacks.
  log ""
  log "C1: OAuth authorize-url redirect_uri..."
  run "curl -fsS -D- -o /dev/null 'http://localhost:3001/api/auth/discord/authorize-url' | grep -i '^Location:' | grep -E 'redirect_uri=(http%3A%2F%2Flocalhost%3A3001|https%3A%2F%2Fadmin\\.slimyai\\.xyz(%3A443)?)%2Fapi%2Fauth%2Fdiscord%2Fcallback'"

  # C2: Legacy login endpoint must bounce to canonical authorize-url
  log ""
  log "C2: Legacy login redirect..."
  echo -e "\n## C2: Legacy login redirect\n\`\`\`" >> "$REPORT"
  if curl -fsS -D- -o /dev/null 'http://localhost:3001/api/admin-api/api/auth/login?returnTo=%2Fdashboard' | grep -E 'HTTP/[12]\.[01] 302' >/dev/null; then
    log "[PASS] Status 302" | tee -a "$REPORT"
  else
    log "[FAIL] Not 302" | tee -a "$REPORT"
    echo -e "\`\`\`\n" >> "$REPORT"
    exit 1
  fi
  echo -e "\`\`\`\n" >> "$REPORT"

  # C3: No leaked old callback / :3000 patterns in rendered homepage
  log ""
  log "C3: Homepage forbidden strings..."
  assert_absent "http://localhost:3001/" "api/admin-api/api/auth/callback|localhost:3000"

  # C4: /snail must be personal (no guild picker text)
  log ""
  log "C4: /snail personal page..."
  assert_absent "http://localhost:3001/snail" "Select a Guild|Choose a guild"
}

package_tests() {
  log ""
  log "================================"
  log "D) PACKAGE TESTS"
  log "================================"

  run "pnpm --filter @slimy/admin-api test"
  run "pnpm --filter @slimy/admin-ui build"
}

pre_commit_safety() {
  log ""
  log "================================"
  log "F) PRE-COMMIT SAFETY"
  log "================================"

  run "git diff --name-only"
  run "git diff --cached --name-only || true"

  # Abort if any env files got staged (paranoia)
  if git diff --cached --name-only | grep -E '(^|/)\\.env(\\.|$)' >/dev/null; then
    log "[FAIL] Refusing: .env-like files are staged. Unstage them and retry."
    git diff --cached --name-only
    exit 1
  fi

  if git diff --cached --name-only | grep -E '(^|/)docs/ops/STABILITY_REPORT_.*\\.md$' >/dev/null; then
    log "[FAIL] Refusing: stability reports are staged. Unstage them and retry."
    git diff --cached --name-only
    exit 1
  fi

  # Abort if obvious secrets appear in staged diff (best-effort heuristic)
  if git diff --cached | grep -E 'DISCORD_CLIENT_SECRET|CLIENT_SECRET|BOT_TOKEN|JWT_SECRET|DATABASE_URL=.*@' >/dev/null; then
    log "[FAIL] Refusing: possible secret detected in staged diff."
    exit 1
  fi

  log "[PASS] Safety checks passed"

  # Exit early if nothing staged (verification-only mode)
  if git diff --cached --quiet; then
    log ""
    log "No staged changes detected. Exiting successfully (verification-only)."
    exit 0
  fi
}

branch_safety() {
  log ""
  log "================================"
  log "G) BRANCH SAFETY"
  log "================================"

  BRANCH="$(git rev-parse --abbrev-ref HEAD)"
  log "Current branch: $BRANCH"

  if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
    NEWBR="nuc2/stability-${TS}"
    log "On main/master, creating new branch: $NEWBR"
    run "git checkout -b '$NEWBR'"
    BRANCH="$NEWBR"
  fi

  echo "$BRANCH" > /tmp/stability-gate-branch.txt
}

commit_and_push() {
  log ""
  log "================================"
  log "H) COMMIT + PUSH"
  log "================================"

  BRANCH="$(cat /tmp/stability-gate-branch.txt)"

  run "git diff --cached --name-only"
  run "git commit -m 'stability: oauth redirect + guild gate verification'"
  run "git push -u origin HEAD"

  log ""
  log "SUCCESS."
  log "Report: $REPORT"
  log "Branch: $BRANCH"
  log "PR (create in browser): https://github.com/GurthBro0ks/slimy-monorepo/pull/new/${BRANCH}"
}

# ================================
# MAIN
# ================================

main() {
  preflight
  initialize_report
  baseline_sanity
  service_health
  critical_behavior_checks
  package_tests
  full_mode_checks
  pre_commit_safety
  branch_safety
  commit_and_push
}

main "$@"
