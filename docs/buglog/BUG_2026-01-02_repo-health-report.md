# Feature: Repo Health Report Generator
**Date:** 2026-01-02
**Status:** COMPLETE

---

## PLAN

### Goal
Create a "Repo Health Report" generator that produces:
- `docs/reports/REPORT_<timestamp>_<host>.json`
- `docs/reports/REPORT_<timestamp>_<host>.html` (single-page with Chart.js charts)
- `docs/reports/LATEST_<host>.json` (copy of latest for delta comparison)

### Files to Create/Modify
1. `scripts/report/run.mjs` - Node ESM script (NEW)
2. `package.json` - Add report scripts (MODIFY)
3. `docs/buglog/BUG_2026-01-02_repo-health-report.md` - This file (NEW)

### Report Contents
- Git: branch, HEAD, dirty status, status short
- Health checks: pnpm test, docker compose ps, curl endpoints
- Repo stats: tokei languages, du folder sizes
- Delta: comparison with previous LATEST file

---

## EXECUTION LOG

### Step 1: Create scripts/report/run.mjs
- Created Node ESM script with:
  - Git info collection
  - Health checks (tests, docker, curl endpoints)
  - Repo stats (tokei, du)
  - Delta calculation
  - JSON + HTML generation with Chart.js

### Step 2: Update package.json
- Added scripts:
  - `"report": "node scripts/report/run.mjs"`
  - `"report:local": "REPORT_HOST=local pnpm report"`
  - `"report:nuc2": "REPORT_HOST=nuc2 pnpm report"`

### Step 3: Verification
- Ran `pnpm report:nuc2`
- All tests passed (41 shared-auth, 45 bot, web, admin-api)
- Docker compose status: OK
- Admin health endpoint: OK
- Socket.IO endpoint: OK
- tokei not installed (graceful fallback activated)

---

## COMMANDS EXECUTED

```bash
pnpm report:nuc2
```

### Console Output
```
=== Repo Health Report Generator ===

Timestamp: 2026-01-02_2138
Host: nuc2
Repo: /opt/slimy/slimy-monorepo

Collecting data...
  [git] Collecting git info...
  [health] Running health checks...
    - Running tests...
    - Checking docker compose...
    - Checking admin health endpoint...
    - Checking socket.io endpoint...
  [stats] Collecting repo stats...
    - Running tokei...
    - Warning: tokei not available or failed
    - Calculating folder sizes...
  [delta] Calculating delta...

Written: /opt/slimy/slimy-monorepo/docs/reports/REPORT_2026-01-02_2138_nuc2.json
Written: /opt/slimy/slimy-monorepo/docs/reports/REPORT_2026-01-02_2138_nuc2.html
Written: /opt/slimy/slimy-monorepo/docs/reports/LATEST_nuc2.json

=== Report Summary ===
Branch: nuc2/verify-role-b33e616
HEAD: bfa1495
Dirty: true
Tests: PASS
Docker: OK
Admin Health: OK
Socket.IO: OK

=== Done ===
```

---

## GENERATED FILES

```
docs/reports/REPORT_2026-01-02_2138_nuc2.json  (117 KB)
docs/reports/REPORT_2026-01-02_2138_nuc2.html  (111 KB)
docs/reports/LATEST_nuc2.json                  (117 KB)
```

---

## HOW TO RUN

```bash
# Generate report with auto-detected hostname
pnpm report

# Generate report with specific host label
pnpm report:nuc2   # Uses REPORT_HOST=nuc2
pnpm report:local  # Uses REPORT_HOST=local

# Or manually specify host
REPORT_HOST=myhost pnpm report
```

### Output Files
After running, check `docs/reports/` for:
- `REPORT_<timestamp>_<host>.json` - Raw data
- `REPORT_<timestamp>_<host>.html` - Visual report with charts
- `LATEST_<host>.json` - Copy of latest for delta comparison

---

## NOTES

### Graceful Degradation
- If `tokei` is not installed, languages section will be empty with a warning
- If curl fails (network issues), stores `__ERROR__` in output
- If docker compose fails, stores error but doesn't crash
- If no previous report exists, delta section shows "No previous report"

### Dependencies
- No new npm dependencies required
- Uses Node.js built-ins only
- Chart.js loaded from CDN in HTML output
