#!/usr/bin/env bash

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# PASTE THIS ENTIRE BLOCK INTO BLINK → SSH → NUC

# Repeat on each NUC.

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

mkdir -p /home/slimy/harness-logs

cat << ‘SLIMY_SCRIPT_EOF’ > /usr/local/bin/slimy-run
#!/usr/bin/env bash

# slimy-run — SlimyAI harness automation

# Chains build→QA prompts through Claude Code CLI.

# Usage: slimy-run <mode> [args]

# 

# Modes:

# build-qa “task description”     — directed build + QA (two sessions)

# auto-qa                         — auto-work + QA (two sessions)

# plan-build-qa “idea”            — planner + build + QA (three sessions)

# qa                              — QA only (grade last build)

# health                          — health check (read-only)

# fix-qa                          — fix mode + QA

# build “task description”        — directed build only, no QA

# auto                            — auto-work only, no QA

# 

# Examples:

# slimy-run build-qa “Fix snail_codes table and get bot online”

# slimy-run auto-qa

# slimy-run plan-build-qa “Add AI-powered code review to slimyai-web”

# slimy-run health

set -euo pipefail

# ── Config ──────────────────────────────────────────────

HARNESS_DIR=”/home/slimy”
LOG_DIR=”/home/slimy/harness-logs”
TEMPLATES_DIR=”/home/slimy/harness-kit/prompts”
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# ── Colors (safe for Blink) ─────────────────────────────

RED=’\033[0;31m’
GREEN=’\033[0;32m’
YELLOW=’\033[1;33m’
CYAN=’\033[0;36m’
NC=’\033[0m’

# ── Helpers ─────────────────────────────────────────────

log()  { echo -e “${CYAN}[slimy-run]${NC} $*”; }
ok()   { echo -e “${GREEN}[✓]${NC} $*”; }
warn() { echo -e “${YELLOW}[!]${NC} $*”; }
fail() { echo -e “${RED}[✗]${NC} $*”; exit 1; }

mkdir -p “$LOG_DIR”

# Run a claude session with a prompt, log output

# Usage: run_claude “session-name” “prompt text”

run_claude() {
local name=”$1”
local prompt=”$2”
local logfile=”${LOG_DIR}/${TIMESTAMP}-${name}.log”

```
log "Starting session: ${name}"
log "Log: ${logfile}"
echo "---"

# claude --print runs headless, no interactive TUI
# The wrapper at /usr/local/bin/claude already adds --dangerously-skip-permissions
if echo "$prompt" | claude --print 2>&1 | tee "$logfile"; then
    ok "Session '${name}' completed"
else
    warn "Session '${name}' exited with error (check log)"
fi

echo ""
return 0
```

}

# ── Prompt builders ─────────────────────────────────────

prompt_startup() {
cat <<‘BLOCK’
MANDATORY STARTUP — do all before writing any code:

1. cat /home/slimy/AGENTS.md
1. cat /home/slimy/claude-progress.md
1. cat /home/slimy/QUALITY_CRITERIA.md
1. cat /home/slimy/server-state.md
1. source /home/slimy/init.sh
   BLOCK
   }

prompt_shutdown_build() {
cat <<‘BLOCK’

MANDATORY SHUTDOWN — do all before ending:

1. Update /home/slimy/claude-progress.md with: date, project, what you built, what’s next
1. Do NOT update passes in feature_list.json — leave for QA
1. If you changed server state (services, packages), update /home/slimy/server-state.md
1. git commit in whatever project repo you worked in

Do not ask questions. Execute autonomously. Start now.
BLOCK
}

prompt_shutdown_noqa() {
cat <<‘BLOCK’

MANDATORY SHUTDOWN — do all before ending:

1. Update /home/slimy/claude-progress.md with: date, project, what you did, what’s next
1. Update /home/slimy/feature_list.json if relevant
1. If you changed server state (services, packages), update /home/slimy/server-state.md
1. git commit in whatever project repo you worked in

Do not ask questions. Execute autonomously. Start now.
BLOCK
}

build_directed_prompt() {
local task=”$1”
cat <<EOF
$(prompt_startup)

$(python3 -c “
import json
d = json.load(open(’/home/slimy/feature_list.json’))
incomplete = [f for f in d[‘features’] if not f[‘passes’]]
for f in sorted(incomplete, key=lambda x: {‘critical’:0,‘high’:1,‘medium’:2,‘low’:3}.get(x[‘priority’],9)):
print(f’{f["id"]} [{f["project"]}] [{f["priority"]}] {f["description"]}’)
“ 2>/dev/null || echo “(feature list parse failed — read it manually)”)

YOUR TASK: ${task}

BEFORE CODING — write a sprint contract:
Create /home/slimy/sprint-contract.md with:

- Task description
- 3-7 testable “done” criteria
- Verification method for each (command, endpoint, or UI check)
- Regression list: what must still work after your changes

Build against the contract.
Do NOT set “passes”: true — leave for QA.
$(prompt_shutdown_build)
EOF
}

build_auto_prompt() {
cat <<EOF
$(prompt_startup)

$(python3 -c “
import json
d = json.load(open(’/home/slimy/feature_list.json’))
incomplete = [f for f in d[‘features’] if not f[‘passes’]]
for f in sorted(incomplete, key=lambda x: {‘critical’:0,‘high’:1,‘medium’:2,‘low’:3}.get(x[‘priority’],9)):
print(f’{f["id"]} [{f["project"]}] [{f["priority"]}] {f["description"]}’)
“ 2>/dev/null || echo “(feature list parse failed — read it manually)”)

Pick the first CRITICAL incomplete feature across ALL projects.
cd into that project’s directory. If it has its own init.sh, run it.
If it has its own AGENTS.md, read and follow its project-specific rules.
Work on that ONE feature only.

BEFORE CODING — write a sprint contract:
Create /home/slimy/sprint-contract.md with:

- Feature ID and description (from feature_list.json)
- What “done” looks like: 3-7 concrete testable criteria
- How to verify each criterion (exact command, endpoint to hit, or UI action)
- What files you expect to change
- What should NOT break (regression list)

Build against the contract.
Do NOT set “passes”: true — leave for QA.
$(prompt_shutdown_build)
EOF
}

build_qa_prompt() {
cat <<‘EOF’
MANDATORY STARTUP:

1. cat /home/slimy/AGENTS.md
1. cat /home/slimy/claude-progress.md
1. cat /home/slimy/QUALITY_CRITERIA.md
1. cat /home/slimy/sprint-contract.md
1. source /home/slimy/init.sh

You are a QA EVALUATOR. You did NOT write this code.
Your job is to TEST and GRADE the work described in sprint-contract.md.
You are skeptical by default. Do not give the benefit of the doubt.

STEP 1 — Read the sprint contract. Understand every criterion.

STEP 2 — cd into the project. Run the truth gate (lint/tests).
If the truth gate fails, STOP. Grade: automatic fail.

STEP 3 — Test EVERY criterion from the sprint contract:

- Run the exact verification command/action listed
- Also test at least 2 edge cases per criterion
- Check the regression list: verify nothing previously working is broken
- Note the result for each: PASS, FAIL, or PARTIAL (with explanation)

STEP 4 — Grade using QUALITY_CRITERIA.md scoring:

- Score each of the 5 criteria (Correctness, Completeness, Integration, Code Quality, UX)
- Apply weights, compute the final score
- Check for hard fails (any = automatic rejection)

STEP 5 — Write your report to /home/slimy/qa-report.md:

# QA Report — [DATE]

## Feature: [ID] — [description]

## Project: [project name]

## Verdict: PASS / FAIL

### Contract Criteria Results (each: PASS/FAIL with details)

### Quality Scores (table with weights)

### Bugs Found (file:line, severity)

### Regression Issues

### Recommendation (PASS with specifics, or FAIL with exact fixes needed)

STEP 6 — Act on your verdict:

- If PASS: Update /home/slimy/feature_list.json — set “passes”: true
- If FAIL: Do NOT update passes. List the specific fixes needed.

MANDATORY SHUTDOWN:

1. Update /home/slimy/claude-progress.md: “QA session — [verdict] — [summary]”
1. Ensure qa-report.md is written

Do not ask questions. Be harsh. Start now.
EOF
}

build_planner_prompt() {
local idea=”$1”
cat <<EOF
$(prompt_startup)

You are a PLANNER. You do NOT write code.
Your job is to expand this idea into a buildable spec:

IDEA: ${idea}

Discover the target project:

- Check server-state.md and AGENTS.md for project paths
- cd into the project, read its README, package.json, existing code
- Understand what exists today before speccing new work

Write /home/slimy/plan-spec.md containing:

1. Goal: What the user should be able to do when this is done
1. Scope: Exactly what’s in and what’s out
1. Technical approach: Stack, architecture, key decisions — NOT line-level details
1. Feature breakdown: 2-5 individually shippable chunks, ordered by dependency
1. For each chunk: description, 3-5 testable “done” criteria, priority
1. Risks: What’s most likely to go wrong

Add the feature chunks to /home/slimy/feature_list.json with passes: false.
Be ambitious. If there are opportunities for AI features (Ollama on NUC1, Claude API), include them.

MANDATORY SHUTDOWN:

1. Update /home/slimy/claude-progress.md: “Planning session — [what you specced]”
1. git commit feature_list.json if it changed

Do not write code. Plan only. Start now.
EOF
}

build_health_prompt() {
cat <<EOF
$(prompt_startup)

Your job is STATUS REPORT ONLY. Do not change any code.

For EACH project found by init.sh:

1. cd into the project
1. git status and git log –oneline -5
1. Run the truth gate (lint/tests) and record pass/fail
1. Check if any services should be running (check server-state.md)
1. Note any obvious issues

Check system-wide: pm2 list, docker ps (if applicable), disk usage, port listeners.

Update /home/slimy/claude-progress.md with a full status report.
Update /home/slimy/server-state.md with current service/port info.

Do not make code changes. Report only. Start now.
EOF
}

build_fix_prompt() {
cat <<EOF
$(prompt_startup)

Something is broken. Your job:

1. cd into EACH project repo (check server-state.md for paths)
1. Run that project’s truth gate (lint/tests)
1. Identify all failures across all projects
1. Fix the most critical failures first, one at a time, smallest diffs
1. Re-run truth gate after each fix
1. Do NOT start new features

If /home/slimy/qa-report.md exists, read it — it may contain specific bugs to fix.

BEFORE FIXING — write a sprint contract:
Create /home/slimy/sprint-contract.md with:

- What’s broken (from qa-report.md and/or your own findings)
- Testable “fixed” criteria for each issue
- Regression list

Fix against the contract.
$(prompt_shutdown_build)
EOF
}

# ── Verification helpers ────────────────────────────────

check_contract() {
if [[ -f “${HARNESS_DIR}/sprint-contract.md” ]]; then
ok “sprint-contract.md exists”
return 0
else
warn “sprint-contract.md not found — builder may not have written one”
warn “QA will still run but may grade blind”
return 0
fi
}

show_qa_result() {
local report=”${HARNESS_DIR}/qa-report.md”
echo “”
echo “━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━”
if [[ -f “$report” ]]; then
# Show verdict line prominently
local verdict
verdict=$(grep -i “verdict” “$report” | head -1 || echo “”)
if echo “$verdict” | grep -qi “pass”; then
ok “QA VERDICT: PASS”
elif echo “$verdict” | grep -qi “fail”; then
fail_msg “QA VERDICT: FAIL”
else
warn “QA verdict unclear”
fi
echo “━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━”
echo “”
cat “$report”
else
warn “No qa-report.md found — QA may not have completed”
fi
echo “”
echo “━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━”
log “Logs saved to: ${LOG_DIR}/”
}

fail_msg() { echo -e “${RED}[✗]${NC} $*”; }

# ── Main dispatch ───────────────────────────────────────

usage() {
cat <<‘USAGE’
slimy-run — SlimyAI harness automation

USAGE:
slimy-run build-qa “task description”     Build + QA (two sessions)
slimy-run auto-qa                         Auto-work + QA (two sessions)
slimy-run plan-build-qa “idea”            Plan + build + QA (three sessions)
slimy-run qa                              QA only (grade last build)
slimy-run health                          Health check (read-only)
slimy-run fix-qa                          Fix mode + QA
slimy-run build “task description”        Build only, no QA
slimy-run auto                            Auto-work only, no QA

EXAMPLES:
slimy-run build-qa “Fix the snail_codes table and get bot online”
slimy-run auto-qa
slimy-run plan-build-qa “Add AI sprite generator to the game maker”
slimy-run health

LOGS:
All session output saved to /home/slimy/harness-logs/
QA reports written to /home/slimy/qa-report.md
Sprint contracts at /home/slimy/sprint-contract.md

USAGE
exit 0
}

case “${1:-}” in

```
build-qa)
    [[ -z "${2:-}" ]] && fail "Usage: slimy-run build-qa \"task description\""
    log "Mode: DIRECTED BUILD → QA"
    log "Task: $2"
    echo ""

    run_claude "build" "$(build_directed_prompt "$2")"
    check_contract
    log "Build done. Starting QA session..."
    sleep 2
    run_claude "qa" "$(build_qa_prompt)"
    show_qa_result
    ;;

auto-qa)
    log "Mode: AUTO-WORK → QA"
    echo ""

    run_claude "auto-build" "$(build_auto_prompt)"
    check_contract
    log "Build done. Starting QA session..."
    sleep 2
    run_claude "qa" "$(build_qa_prompt)"
    show_qa_result
    ;;

plan-build-qa)
    [[ -z "${2:-}" ]] && fail "Usage: slimy-run plan-build-qa \"idea description\""
    log "Mode: PLAN → BUILD → QA"
    log "Idea: $2"
    echo ""

    run_claude "planner" "$(build_planner_prompt "$2")"

    if [[ -f "${HARNESS_DIR}/plan-spec.md" ]]; then
        ok "plan-spec.md created"
    else
        warn "plan-spec.md not found — planner may not have written one"
    fi

    log "Plan done. Starting build session..."
    sleep 2
    run_claude "build" "$(build_auto_prompt)"
    check_contract
    log "Build done. Starting QA session..."
    sleep 2
    run_claude "qa" "$(build_qa_prompt)"
    show_qa_result
    ;;

qa)
    log "Mode: QA ONLY"
    echo ""
    run_claude "qa" "$(build_qa_prompt)"
    show_qa_result
    ;;

health)
    log "Mode: HEALTH CHECK (read-only)"
    echo ""
    run_claude "health" "$(build_health_prompt)"
    log "Health check complete."
    log "Check /home/slimy/claude-progress.md for the report."
    ;;

fix-qa)
    log "Mode: FIX → QA"
    echo ""
    run_claude "fix" "$(build_fix_prompt)"
    check_contract
    log "Fix done. Starting QA session..."
    sleep 2
    run_claude "qa" "$(build_qa_prompt)"
    show_qa_result
    ;;

build)
    [[ -z "${2:-}" ]] && fail "Usage: slimy-run build \"task description\""
    log "Mode: BUILD ONLY (no QA)"
    log "Task: $2"
    echo ""
    run_claude "build" "$(build_directed_prompt "$2")"
    ok "Build session complete. Run 'slimy-run qa' to grade it."
    ;;

auto)
    log "Mode: AUTO-WORK (no QA)"
    echo ""
    run_claude "auto-build" "$(build_auto_prompt)"
    ok "Auto-work complete. Run 'slimy-run qa' to grade it."
    ;;

help|--help|-h|"")
    usage
    ;;

*)
    fail "Unknown mode: $1 — run 'slimy-run help' for usage"
    ;;
```

esac

SLIMY_SCRIPT_EOF

chmod +x /usr/local/bin/slimy-run

# Verify

if command -v slimy-run &>/dev/null; then
echo “✓ slimy-run installed at $(which slimy-run)”
echo “✓ Logs dir: /home/slimy/harness-logs/”
echo “”
echo “Quick test — run: slimy-run help”
else
echo “✗ Install failed — check /usr/local/bin/ permissions”
fi
