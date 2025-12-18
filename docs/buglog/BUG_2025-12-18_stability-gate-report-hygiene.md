# BUG: Stability Gate Report + Staging Hygiene

**Date:** 2025-12-18
**Branch:** `nuc2/verify-role-b33e616`
**HEAD Commit:** `fe54f8b chore: ignore generated stability reports`
**Target:** `scripts/smoke/stability-gate.sh`

## Problem Statement

The stability gate script has several hygiene issues:

1. **Report files may trigger git warnings** - While `docs/ops/STABILITY_REPORT_*.md` is in `.gitignore` (line 28), the staging command doesn't suppress ignored-file warnings
2. **Commit messages reference ignored files** - Line 229 includes `'Report: ${REPORT}'` in commit message, referencing a file that's ignored
3. **No early-exit for verification-only runs** - If no actual code changes exist (only test verification), script still attempts to commit/push
4. **Reports pollute docs/ops/ even on PASS** - Clean successful runs leave report files in tracked directories

## Current State Analysis

### Report Path Configuration (Lines 17-19)
```bash
TS="$(date +%F_%H-%M-%S)"
REPORT="docs/ops/STABILITY_REPORT_${TS}_admin-oauth-guildgate.md"
mkdir -p docs/ops
```

- Report written directly to `docs/ops/`
- Directory always created
- No conditional behavior based on test outcome

### Git Staging (Lines 180-183)
```bash
# Stage everything EXCEPT .env*
log ""
log "Staging changes (excluding .env*)..."
git add -A -- . ':(exclude).env' ':(exclude).env.*' ':(exclude)**/.env' ':(exclude)**/.env.*'
```

**Issues:**
- No explicit exclusion for `docs/ops/STABILITY_REPORT_*.md`
- No `-c advice.addIgnoredFile=false` to suppress warnings
- Relies solely on `.gitignore` (line 28: `docs/ops/STABILITY_REPORT_*.md`)

### Commit Message (Line 229)
```bash
run "git commit -m 'stability: oauth redirect + guild gate verification' -m 'Report: ${REPORT}'"
```

**Issues:**
- Second message line references an ignored file path
- Unnecessarily couples commit to report file location

### Error Handling
- Uses `set -euo pipefail` (line 1)
- No trap handler for EXIT
- No conditional report persistence based on exit code

### Post-Staging Flow
After staging (line 183), script immediately proceeds to commit (line 229) with no check for:
- `git diff --cached --quiet` (empty staging area)
- Could cause empty commits in verification-only scenarios

## Verification Commands Used

```bash
cd /opt/slimy/slimy-monorepo
git status -sb
# Output: ## nuc2/verify-role-b33e616...origin/nuc2/verify-role-b33e616

git log -1 --oneline
# Output: fe54f8b chore: ignore generated stability reports

grep -n "STABILITY_REPORT" .gitignore
# Output: 28:docs/ops/STABILITY_REPORT_*.md

sed -n '17,19p' scripts/smoke/stability-gate.sh
# Report path setup

sed -n '180,183p' scripts/smoke/stability-gate.sh
# Git staging command

sed -n '229p' scripts/smoke/stability-gate.sh
# Commit message with report reference
```

## Proposed Solution

1. **Dual report paths with trap handler:**
   - Write to `/tmp/STABILITY_REPORT_${TS}_admin-oauth-guildgate.md` during execution
   - On EXIT trap: if exit code != 0, copy to `docs/ops/`
   - On success: leave in `/tmp`, print temp path

2. **Enhanced staging exclusions:**
   - Add explicit `':(exclude)docs/ops/STABILITY_REPORT_*.md'`
   - Suppress ignored-file warnings with `-c advice.addIgnoredFile=false`
   - Keep existing `.env*` exclusions

3. **Early-exit for empty staging:**
   - After staging, check `git diff --cached --quiet`
   - If empty: log "verification only" and exit 0
   - Prevents empty commits

4. **Clean commit messages:**
   - Remove `-m 'Report: ${REPORT}'` from commit command
   - Keep only: `'stability: oauth redirect + guild gate verification'`
   - Report path already logged at end of script

## Risk Assessment

- **LOW RISK**: Changes are surgical and preserve all existing safety checks
- **BACKWARDS COMPATIBLE**: Script behavior unchanged for normal failure cases
- **TESTABLE**: Can verify with dry-run and actual execution
- **REVERSIBLE**: All changes in single file with git history

---

## Implementation Results (2025-12-18 18:02 UTC)

### Changes Applied

All proposed changes were successfully implemented:

1. **EXIT trap handler** (lines 4-27): Copies report to `docs/ops/` only on failure
2. **Report path changed** (line 44): Now writes to `/tmp/STABILITY_REPORT_${TS}_admin-oauth-guildgate.md`
3. **Enhanced staging** (lines 207-212): Added explicit stability report exclusion + warning suppression
4. **Early-exit logic** (lines 229-234): Exits 0 if nothing staged after exclusions
5. **Clean commit message** (line 265): Removed report path reference from commit

### Verification Results

**Syntax Check:**
```bash
bash -n scripts/smoke/stability-gate.sh  # ✓ PASS (no errors)
```

**Functional Test (Success Scenario):**
```bash
./scripts/smoke/stability-gate.sh
# Exit code: 0 ✓
# Report location: /tmp/STABILITY_REPORT_2025-12-18_18-01-24_admin-oauth-guildgate.md ✓
# Report NOT in docs/ops/ ✓
# Commit message: "stability: oauth redirect + guild gate verification" (no report path) ✓
# Files committed: docs/buglog/BUG_2025-12-18_stability-gate-report-hygiene.md, scripts/smoke/stability-gate.sh ✓
```

**Trap Handler Test (Failure Scenarios):**
- Failed runs (17:57:46, 17:59:15): Reports correctly copied to `docs/ops/` ✓
- Reports available in both `/tmp/` and `docs/ops/` for failed runs ✓

**Git Commit:**
- Commit: `52be8d3f08a34735614861f11246203d62a45c8c`
- Branch: `nuc2/verify-role-b33e616`
- Pushed: ✓
- Changes: 158 insertions, 6 deletions (2 files changed)

### Key Behavior Changes

| Aspect | Before | After |
|--------|--------|-------|
| **Report location (success)** | `docs/ops/` | `/tmp/` (not tracked) |
| **Report location (failure)** | `docs/ops/` | Copied to `docs/ops/` by trap |
| **Staging behavior** | Relies on `.gitignore` | Explicit exclusion + .gitignore |
| **Empty staging** | Would attempt commit | Exits 0 with "verification only" message |
| **Commit message** | Includes report path | Clean, no report reference |

### Edge Cases Verified

1. **Backup file false positive**: Removed backup before run to avoid self-referential secret detection
2. **Secret detection**: Still works correctly (paranoia checks preserved)
3. **Trap activation**: Correctly fires on both success (exit 0) and failure (exit != 0)

---

**End of Buglog**
