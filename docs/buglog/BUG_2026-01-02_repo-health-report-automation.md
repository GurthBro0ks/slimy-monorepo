# Feature: Repo Health Report Automation
**Date:** 2026-01-02
**Status:** COMPLETE

---

## GOALS

A) systemd user timer (daily) to run `pnpm report:nuc2`
B) Report retention (keep last 30 reports per host, prune older)
C) Environment fingerprint fields in JSON (node/pnpm/docker/uname/df)
D) Offline HTML support for Chart.js (local vendor copy + fallback)
E) GitHub Actions workflow that generates report and uploads HTML+JSON as artifacts

---

## CURRENT STATE

```
## nuc2/verify-role-b33e616...origin/nuc2/verify-role-b33e616 [ahead 16]
```

---

## EXECUTION LOG

### Step 1: Create buglog
- Created this file

### Step 2: Download Chart.js vendor
- Downloaded Chart.js 4.4.1 UMD bundle (205KB)
- Saved to `scripts/report/vendor/chart.umd.min.js`

### Step 3: Modify scripts/report/run.mjs
- Added CLI args parsing (`--keep=N`, `--help`)
- Added `collectEnvFingerprint()` function
- Added `ensureVendorFiles()` function
- Added `pruneOldReports(host, keep)` function
- Updated HTML template for offline Chart.js with CDN fallback
- Added graceful docker availability check (skips if unavailable)
- Added Environment section to HTML output

### Step 4: Create docs/reports/README_report_automation.md
- Created comprehensive documentation with:
  - Quick start commands
  - CLI options
  - Report contents description
  - GitHub Actions info
  - systemd timer installation instructions
  - Retention policy explanation

### Step 5: Create .github/workflows/repo-health-report.yml
- Created workflow triggered on push and PR
- Uses REPORT_HOST=ci
- Uploads artifacts with 30-day retention

### Step 6: Create systemd user units
- Created `~/.config/systemd/user/slimy-report.service`
- Created `~/.config/systemd/user/slimy-report.timer`
- Enabled timer with `systemctl --user enable --now slimy-report.timer`

### Step 7: Verification
- Validated systemd unit syntax
- Ran report, confirmed env fields present
- Confirmed vendor file copied
- Tested retention (created 37 fake reports, --keep=5 deleted 62 files)
- Timer scheduled for midnight daily

---

## COMMANDS EXECUTED

```bash
# Download Chart.js
curl -sS -o scripts/report/vendor/chart.umd.min.js \
  "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"

# Validate systemd units
systemd-analyze --user verify ~/.config/systemd/user/slimy-report.service
systemd-analyze --user verify ~/.config/systemd/user/slimy-report.timer
# (no output = valid)

# Run report
pnpm report:nuc2

# Check env fields
cat docs/reports/LATEST_nuc2.json | jq '.env'

# Check vendor file
ls -la docs/reports/vendor/

# Test retention
REPORT_HOST=testhost node scripts/report/run.mjs --keep=5

# Enable timer
systemctl --user daemon-reload
systemctl --user enable --now slimy-report.timer
systemctl --user list-timers | grep slimy
```

---

## VERIFICATION RESULTS

### Environment Fingerprint (Feature C)
```json
{
  "nodeVersion": "v20.19.6",
  "pnpmVersion": "10.21.0",
  "dockerVersion": "Docker version 28.2.2, build 28.2.2-0ubuntu1~24.04.1",
  "dockerComposeVersion": "Docker Compose version v2.27.0",
  "uname": "Linux slimy-nuc2 6.8.0-90-generic ...",
  "diskRoot": "Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda2       219G  135G   74G  65% /"
}
```

### Offline Chart.js (Feature D)
```
docs/reports/vendor/chart.umd.min.js (205KB)
```

### Retention Test (Feature B)
```
  [prune] Checking retention (keep=5) for host=testhost...
  [prune] Deleted 62 files (31 report sets)
```

### systemd Timer (Feature A)
```
NEXT                           LEFT LAST PASSED UNIT                ACTIVATES
Sat 2026-01-03 00:00:59 UTC 2h 3min -    -      slimy-report.timer  slimy-report.service
```

### Report Output
```
=== Report Summary ===
Branch: nuc2/verify-role-b33e616
HEAD: e0ba42a
Dirty: true
Tests: PASS
Docker: OK
Admin Health: OK
Socket.IO: OK
Delta: HEAD changed=true, Branch changed=false
```

---

## FILES CHANGED

### Modified
- `scripts/report/run.mjs` - Added all new features

### Created
- `scripts/report/vendor/chart.umd.min.js` - Chart.js 4.4.1 vendor copy
- `docs/reports/README_report_automation.md` - Automation documentation
- `.github/workflows/repo-health-report.yml` - CI workflow
- `~/.config/systemd/user/slimy-report.service` - systemd service (not in repo)
- `~/.config/systemd/user/slimy-report.timer` - systemd timer (not in repo)

---

## HOW TO RUN

```bash
# Generate report with auto-detected hostname
pnpm report

# Generate with specific host label
pnpm report:nuc2   # REPORT_HOST=nuc2
pnpm report:local  # REPORT_HOST=local

# Custom retention
pnpm report -- --keep=10
```

### Timer Management
```bash
# Check timer status
systemctl --user list-timers | grep slimy-report

# View logs
journalctl --user -u slimy-report.service -f

# Run manually
systemctl --user start slimy-report.service

# Disable timer
systemctl --user disable --now slimy-report.timer
```
