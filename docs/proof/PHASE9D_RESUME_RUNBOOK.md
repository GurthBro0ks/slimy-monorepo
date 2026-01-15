# Phase 9D: Resumable Manual-UI Runbook

**Version**: 2.0 (Resume + Skip Logic)
**Last Updated**: 2026-01-15

## Overview

The Phase 9D resumable wrapper (`scripts/run_phase9d_manual_resumable.sh`) executes the complete Owner Bootstrap and Invite System verification with robust resumability features:

- **Resumable execution**: Automatically detects and skips completed phases
- **Proof continuity**: Reuse existing proof directories or create new ones
- **Manual phase support**: Waits for human confirmation on UI verification steps
- **STOP-ON-FAIL**: Halts immediately on any gate failure with clear error messages
- **Security compliant**: Never logs secrets, tokens, cookies, or plaintext credentials

## Phase Structure

The wrapper executes 8 phases (0-7):

| Phase | Name | Type | Description |
|-------|------|------|-------------|
| 0 | Git Setup | Automated | Verifies repo structure and captures git state |
| 1 | Discovery | Automated | Locates key files and redacts environment variables |
| 2 | Database | Automated | Verifies MySQL connectivity |
| 3 | Prisma | Automated | Generates client and deploys migrations |
| 4 | Auth Check | **MANUAL** | Human verifies auth persistence via browser |
| 5 | Bootstrap | Automated | Adds owner email to OwnerAllowlist |
| 6 | UI Verify | **MANUAL** | Human verifies invite system and access control |
| 7 | Closeout | Automated | Generates final summary and captures git state |

## Quick Start

### Fresh Execution

Start a new verification run (creates new proof directory):

```bash
cd /opt/slimy/slimy-monorepo
./scripts/run_phase9d_manual_resumable.sh
```

The script will:
1. Create a proof directory: `/tmp/proof_phase9d_manual_<TIMESTAMP>`
2. Execute phases 0-3 automatically
3. Pause at Phase 4 and prompt for manual verification
4. Continue after you create `HUMAN_CONFIRMED.txt`
5. Execute Phase 5 (bootstrap)
6. Pause at Phase 6 for manual UI verification
7. Complete with Phase 7 closeout

### Resume Execution

Resume from an existing proof directory (skips completed phases):

```bash
cd /opt/slimy/slimy-monorepo
ROOT_PROOF=/tmp/proof_phase9d_manual_20260115T123456Z ./scripts/run_phase9d_manual_resumable.sh
```

The script will:
- Detect which phases are complete (have `DONE.txt` + required files)
- Print `SKIP PHASE N (already complete)` for finished phases
- Resume execution from the first incomplete phase

### With Dev Server

Start the dev server automatically for Phase 4 testing:

```bash
cd /opt/slimy/slimy-monorepo
START_DEV_SERVER=1 ./scripts/run_phase9d_manual_resumable.sh
```

**Note**: The script will start `pnpm dev` in the background and stop it on exit.

### Custom Owner Email

Override the default owner email:

```bash
cd /opt/slimy/slimy-monorepo
OWNER_EMAIL="admin@example.com" ./scripts/run_phase9d_manual_resumable.sh
```

Default: `crypto@slimyai.xyz`

### Custom Base URL

Override the default base URL for curl checks:

```bash
cd /opt/slimy/slimy-monorepo
BASE_URL="https://trader.slimyai.xyz" ./scripts/run_phase9d_manual_resumable.sh
```

Default: `http://127.0.0.1:3001`

## Manual Phase Instructions

### Phase 4: Auth Persistence Check

When the script pauses at Phase 4, it will display:

```
========================================
HUMAN ACTION REQUIRED: Phase 4: Auth Persistence Check
========================================

Please complete the manual steps described in:
  /tmp/proof_phase9d_manual_<TIMESTAMP>/phase4_auth/ui_notes.txt

When finished, create the confirmation file:
  touch /tmp/proof_phase9d_manual_<TIMESTAMP>/phase4_auth/HUMAN_CONFIRMED.txt

Waiting for confirmation...
```

**Manual Steps:**

1. Ensure web app is running on http://127.0.0.1:3001
   - If not: `cd apps/web && pnpm dev`
2. Open browser to http://127.0.0.1:3001
3. Verify app loads successfully
4. Check DevTools > Application > Cookies
5. Confirm session cookies exist (slimy_session, connect.sid, etc.)
6. Optionally login via Discord and verify session persists

**Confirm completion:**

```bash
touch /tmp/proof_phase9d_manual_<TIMESTAMP>/phase4_auth/HUMAN_CONFIRMED.txt
```

### Phase 6: Manual UI Verification

When the script pauses at Phase 6, it will display similar instructions.

**Manual Steps:**

1. **Owner Dashboard Access** (as crypto@slimyai.xyz)
   - Login to http://127.0.0.1:3001
   - Navigate to /owner (owner panel)
   - Confirm page loads (no 403 Forbidden)
   - Verify owner controls visible

2. **Create Invite**
   - In /owner panel, create new invite
   - Copy invite code (DO NOT log to files)
   - Close modal to hide token

3. **Use Invite as New User** (as gurth@slimyai.xyz)
   - Open incognito browser
   - Navigate to signup with invite code
   - Create account as gurth@slimyai.xyz
   - Verify login succeeds

4. **Non-Owner Access Control** (as gurth@slimyai.xyz)
   - Visit http://127.0.0.1:3001/owner
   - Confirm 403 Forbidden page displayed

5. **Invite Reuse Prevention** (optional)
   - Try using same invite code again
   - Confirm "invite used" error

**Confirm completion:**

```bash
touch /tmp/proof_phase9d_manual_<TIMESTAMP>/phase6_manual_verify/HUMAN_CONFIRMED.txt
```

## Phase Completion Detection

Each phase is considered complete when:

1. `DONE.txt` exists in phase directory
2. All required evidence files exist and are non-empty
3. Required files pass content validation

### Required Files Per Phase

| Phase | Required Files | Validation |
|-------|---------------|------------|
| 0 | `repo_path.txt`, `git_status.txt`, `git_branch.txt` | Non-empty |
| 1 | `summary.txt`, `env_redacted.txt` | Non-empty |
| 2 | `pg_isready.txt` | Contains "accepting connections" |
| 3 | `prisma_migrate.log`, `schema_excerpt.txt` | Contains "OwnerAllowlist" and "OwnerInvite" |
| 4 | `ui_notes.txt`, `HUMAN_CONFIRMED.txt` | Both exist |
| 5 | `bootstrap_run.log`, `allowlist_select.txt` | Contains owner email |
| 6 | `curl_unauth_owner_me.txt`, `ui_notes.txt`, `HUMAN_CONFIRMED.txt` | All exist |
| 7 | `FINAL_SUMMARY.txt`, `head_sha.txt` | Non-empty |

## Stop-on-Fail Semantics

If any phase fails, the script:

1. Prints error message in red
2. Outputs exact failure line:
   ```
   RESULT=FAIL PHASE=<N> PROOF_DIR=<path>
   ```
3. Exits immediately with non-zero code

**Example:**
```
FAIL: MySQL is not accepting connections
RESULT=FAIL PHASE=2 PROOF_DIR=/tmp/proof_phase9d_manual_20260115T123456Z
```

## Success Output

On successful completion:

```
========================================
Phase 9D: ALL PHASES COMPLETE
========================================

RESULT=PASS PROOF_DIR=/tmp/proof_phase9d_manual_20260115T123456Z HEAD_SHA=abc123...

Proof artifacts saved to: /tmp/proof_phase9d_manual_20260115T123456Z
```

## Proof Directory Structure

```
/tmp/proof_phase9d_manual_<TIMESTAMP>/
├── master.log                    # Combined output of all phases
├── phase0_git/
│   ├── DONE.txt                  # Phase completion marker
│   ├── repo_path.txt             # Repository path
│   ├── git_status.txt            # Git status output
│   ├── git_branch.txt            # Current branch
│   └── git_commit.txt            # Current commit SHA
├── phase1_discovery/
│   ├── DONE.txt
│   ├── summary.txt               # Key files check summary
│   └── env_redacted.txt          # Redacted environment variables
├── phase2_db/
│   ├── DONE.txt
│   └── pg_isready.txt            # MySQL connectivity check
├── phase3_prisma/
│   ├── DONE.txt
│   ├── prisma_generate.log       # Prisma client generation log
│   ├── prisma_migrate.log        # Migration deployment log
│   └── schema_excerpt.txt        # OwnerAllowlist/OwnerInvite schema
├── phase4_auth/
│   ├── DONE.txt
│   ├── ui_notes.txt              # Manual verification instructions
│   ├── HUMAN_CONFIRMED.txt       # Created by human operator
│   └── dev_server.log (optional) # Dev server output if START_DEV_SERVER=1
├── phase5_owner_bootstrap/
│   ├── DONE.txt
│   ├── bootstrap_run.log         # Bootstrap script output
│   └── allowlist_select.txt      # Owner verification query result
├── phase6_manual_verify/
│   ├── DONE.txt
│   ├── curl_unauth_owner_me.txt  # Unauthenticated API test (401/403)
│   ├── ui_notes.txt              # Manual verification checklist
│   └── HUMAN_CONFIRMED.txt       # Created by human operator
└── phase7_closeout/
    ├── DONE.txt
    ├── head_sha.txt              # Final git commit SHA
    ├── git_status_final.txt      # Final git status
    └── FINAL_SUMMARY.txt         # Complete execution summary
```

## Troubleshooting

### Phase Won't Skip (Already Complete)

If a phase doesn't skip when you expect it to:

1. Check `DONE.txt` exists:
   ```bash
   ls -la /tmp/proof_phase9d_manual_<TIMESTAMP>/phase<N>_*/DONE.txt
   ```

2. Check required files exist and are non-empty:
   ```bash
   ls -lh /tmp/proof_phase9d_manual_<TIMESTAMP>/phase<N>_*/*.txt
   ```

3. For phases 2, 3, 5, 6: Check content validation
   ```bash
   grep "accepting connections" /tmp/proof_phase9d_manual_<TIMESTAMP>/phase2_db/pg_isready.txt
   ```

### Database Connection Failed

If Phase 2 fails with database connectivity error:

1. Verify MySQL is running:
   ```bash
   sudo systemctl status mysql
   ```

2. Check DATABASE_URL in `.env.local`:
   ```bash
   grep DATABASE_URL apps/web/.env.local
   ```

3. Test connection manually:
   ```bash
   mysqladmin ping -h127.0.0.1 -P3306 -uslimyai -pslimypassword
   ```

### Prisma Migrations Failed

If Phase 3 fails:

1. Check migration status:
   ```bash
   cd apps/web && pnpm prisma migrate status
   ```

2. Review migration history:
   ```bash
   cd apps/web && ls -la prisma/migrations/
   ```

3. Re-generate Prisma client:
   ```bash
   cd apps/web && pnpm prisma generate
   ```

### Bootstrap Already Exists

Phase 5 is idempotent. If owner already exists, it will succeed with:
```
✓ Owner already exists and is active: crypto@slimyai.xyz
```

This is expected behavior and the phase will complete successfully.

### Dev Server Won't Start

If using `START_DEV_SERVER=1` and Phase 4 fails:

1. Check port 3001 is available:
   ```bash
   lsof -i :3001
   ```

2. Try different port:
   ```bash
   PORT=3002 START_DEV_SERVER=1 ./scripts/run_phase9d_manual_resumable.sh
   ```

3. Check dev server log:
   ```bash
   tail -f /tmp/proof_phase9d_manual_<TIMESTAMP>/phase4_auth/dev_server.log
   ```

## Security Guarantees

### No Secrets in Logs

- Environment variables redacted (DATABASE_URL, passwords, secrets, tokens, keys)
- Invite tokens never logged to files
- Session cookies never logged
- Only hashed invite codes stored in database

### Fail-Closed Design

- Default: users are NOT owners
- Owner endpoints return 401 (unauthenticated) or 403 (not owner)
- Invite must be valid, not expired, not revoked, use count not exceeded
- No authentication bypasses or backdoors

### Audit Trail

All owner actions logged to `OwnerAuditLog`:
- INVITE_CREATE
- INVITE_REVOKE
- SETTINGS_UPDATE
- OWNER_ADD
- OWNER_REVOKE

Includes: actor, action, resource type, changes (JSON), IP, user agent

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ROOT_PROOF` | (auto-generated) | Existing proof directory for resume mode |
| `OWNER_EMAIL` | crypto@slimyai.xyz | Owner email for bootstrap |
| `BASE_URL` | http://127.0.0.1:3001 | Base URL for curl API checks |
| `START_DEV_SERVER` | 0 | Set to 1 to auto-start dev server |
| `DATABASE_URL` | (from .env.local) | MySQL connection string |

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Phase 9D Verification

on:
  workflow_dispatch:

jobs:
  verify-owner-system:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: slimyai
          MYSQL_USER: slimyai
          MYSQL_PASSWORD: slimypassword
        ports:
          - 3306:3306
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install dependencies
        run: pnpm install

      - name: Run Phase 9D (automated phases only)
        run: |
          # Run automated phases 0-3 and 5
          # Skip manual phases 4 and 6
          ./scripts/run_phase9d_manual_resumable.sh || true
        env:
          DATABASE_URL: mysql://slimyai:slimypassword@127.0.0.1:3306/slimyai
          OWNER_EMAIL: crypto@slimyai.xyz

      - name: Upload proof artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: phase9d-proof
          path: /tmp/proof_phase9d_manual_*/
          retention-days: 30
```

**Note**: Manual phases (4 and 6) cannot be automated in CI. Consider splitting into separate jobs or using Playwright for headless browser testing.

## Related Documentation

- [Phase 9 First Owner Bootstrap](./PHASE9_FIRST_OWNER_BOOTSTRAP.md) - Original manual runbook
- [Owner API Documentation](../../apps/web/app/api/owner/README.md) - Owner endpoint reference (if exists)
- [Invite System Implementation](../../apps/web/lib/owner/invite.ts) - Invite code logic

## Changelog

### Version 2.0 (2026-01-15)
- Added resumability with `ROOT_PROOF` detection
- Added strict phase completion detection
- Added skip logic for completed phases
- Added manual phase wait with `HUMAN_CONFIRMED.txt`
- Added STOP-ON-FAIL semantics
- Added safe environment variable redaction
- Added cleanup trap for dev server

### Version 1.0 (Initial)
- Basic Phase 9D execution
- Manual verification checklist
- Proof artifact collection

---

**Maintained by**: Slimy AI Infrastructure Team
**Support**: For issues or questions, create a bug report in `docs/buglog/`
