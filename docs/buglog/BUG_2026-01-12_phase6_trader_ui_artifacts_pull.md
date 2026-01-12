# Phase 6: Trader UI - Pulled Shadow Artifacts

**Date**: 2026-01-12
**Branch**: `feat/trader-ui-artifacts-pull`
**Author**: Claude Code Agent

## Summary

Implemented Phase 6 of the Trader UI: a private, read-only `/trader/artifacts` page that displays trading artifacts pulled from NUC1 to NUC2 via a systemd timer service.

## What Changed

### Systemd Infrastructure (NUC2 Host)

1. **Artifact directories**: `/var/lib/trader-artifacts/shadow/` for pulled artifacts
2. **SSH key**: `/etc/trader-artifacts/id_ed25519` for artifact pull authentication
3. **Environment config**: `/etc/default/trader-artifacts-pull`
4. **Pull script**: `/usr/local/bin/trader-artifacts-pull.sh` - rsync + status.json generation
5. **Systemd service/timer**: 45-second interval artifact pull

### Web App (apps/web)

1. **Artifact types module**: `lib/trader/artifacts/types.ts`
   - Defines `ArtifactStatus`, `ArtifactReadResult<T>`, `ShadowSummary`, `ShadowHealth`, etc.

2. **Artifact reader module**: `lib/trader/artifacts/reader.ts`
   - Server-only file reader with status tracking (OK/MISSING/STALE/PARSE_ERROR)
   - Computes age from mtime, configurable stale threshold (300s default)

3. **Artifact access gate**: `lib/trader/artifacts/gate.ts`
   - Fail-closed allowlist using `TRADER_ARTIFACTS_ALLOWED_USER_IDS` env var
   - Returns 401 for no auth, 403 for not in allowlist

4. **API routes**:
   - `GET /api/trader/artifacts/summary`
   - `GET /api/trader/artifacts/health`
   - `GET /api/trader/artifacts/journal_preview`
   - All require trader session + allowlist gate

5. **Artifacts page**: `/trader/artifacts` with:
   - Mode, health status, positions, signals today cards
   - P&L display (unrealized + daily)
   - System components status
   - Journal preview with entry types

6. **TraderDebugDock extension**:
   - Added artifact status fields: artifacts_dir, last_pull_utc, artifact_age_sec, pull_status

## Threat Model: Pull Architecture

The pull-model was chosen for security:

1. **No browser-to-NUC1 access**: UI reads only from local filesystem
2. **Timer-based sync**: NUC2 pulls artifacts via rsync over SSH
3. **Dedicated SSH key**: Separate key for artifact pull with restricted scope
4. **Fail-closed gating**: Missing artifacts or empty allowlist = deny access
5. **Sanitized errors**: Never expose raw filesystem errors to client

## Known Risks

### NUC1 SSH Connectivity (BLOCKER)

- Port 4421 is timing out
- Port 22 requires key authorization
- SSH keys documented in proof pack need to be added to NUC1

### Workaround

Mock artifacts created at `/var/lib/trader-artifacts/shadow/` for testing.

## Proof References

- **Proof directory**: `/tmp/proof_phase6_trader_ui_20260112T025101Z/`
- **Timer evidence**: `02_list_timers.txt`, `02_timer_status.txt`
- **Journal evidence**: `02_journal_pull.txt`
- **Status.json**: `02_status_json.txt`
- **Build evidence**: `04_pnpm_build.txt`
- **Test evidence**: `04_pnpm_test.txt` (267 tests passed)
- **Curl gate evidence**: `04_curl_api_summary_unauth.txt` (401 response)
- **Page redirect evidence**: `04_curl_trader_unauth.txt` (307 to /trader/login)

## Environment Variables

```bash
# Trader Artifacts - Fail-closed allowlist
TRADER_ARTIFACTS_ALLOWED_USER_IDS=<comma-separated user IDs>

# Path to local artifacts (pulled from NUC1)
TRADER_ARTIFACTS_PATH=/var/lib/trader-artifacts/shadow
TRADER_ARTIFACTS_STATUS_FILE=/var/lib/trader-artifacts/status.json
TRADER_ARTIFACTS_STALE_THRESHOLD_SEC=300
```

## Files Changed

### Created
- `apps/web/lib/trader/artifacts/types.ts`
- `apps/web/lib/trader/artifacts/reader.ts`
- `apps/web/lib/trader/artifacts/gate.ts`
- `apps/web/lib/trader/artifacts/index.ts`
- `apps/web/app/api/trader/artifacts/summary/route.ts`
- `apps/web/app/api/trader/artifacts/health/route.ts`
- `apps/web/app/api/trader/artifacts/journal_preview/route.ts`
- `apps/web/app/trader/artifacts/page.tsx`

### Modified
- `apps/web/components/trader/TraderDebugDock.tsx` - added artifact status
- `apps/web/.env.example` - documented artifact env vars

## Next Steps

1. **Fix NUC1 SSH connectivity**:
   - Add SSH keys to NUC1 `~slimy/.ssh/authorized_keys`
   - Verify artifact source path exists on NUC1
   - Test rsync pull works

2. **Configure allowlist**:
   - Set `TRADER_ARTIFACTS_ALLOWED_USER_IDS` in production env
   - Add authorized trader user IDs

3. **Verify production**:
   - Confirm timer runs on schedule
   - Confirm artifacts display correctly
   - Confirm unauthorized users see 403
