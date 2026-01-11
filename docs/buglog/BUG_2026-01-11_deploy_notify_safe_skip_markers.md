# BUG_2026-01-11_deploy_notify_safe_skip_markers

## Goal
Add deterministic SAFE_SKIP log markers to deploy-notify workflow so proof scripts can grep stable tokens.

## Change
Add exact markers:
- SAFE_SKIP: missing DISCORD_WEBHOOK_URL
- SAFE_SKIP: invalid DISCORD_WEBHOOK_URL domain

## Pre-commit proof (working tree)
(see /tmp/deploy-notify-safe-skip-markers.precommit_hits.txt)

### Pre-commit proof hits
```
23:            echo "SAFE_SKIP: missing DISCORD_WEBHOOK_URL"
29:            echo "SAFE_SKIP: invalid DISCORD_WEBHOOK_URL domain"
```

## Post-commit proof
- Commit: 6783d23
- RUN_ID: 20897793544

### Post-commit marker hits (HEAD)
```
23:            echo "SAFE_SKIP: missing DISCORD_WEBHOOK_URL"
29:            echo "SAFE_SKIP: invalid DISCORD_WEBHOOK_URL domain"
```

### Manual dispatch SAFE_SKIP hits
```
```

### Manual dispatch meta
```
{"conclusion":"success","createdAt":"2026-01-11T15:48:59Z","displayTitle":"Deploy Notification","status":"completed","updatedAt":"2026-01-11T15:49:05Z"}
```

### Secret scan
- Result: PASS (no hits)

## Branch manual-dispatch proof (includes SAFE_SKIP markers)
- Ref: chore/deploy-notify-safe-skip-markers
- RUN_ID: 20897830096

### SAFE_SKIP hits
```
31:notify	Notify Discord	2026-01-11T15:51:47.2634040Z [36;1m  echo "SAFE_SKIP: missing DISCORD_WEBHOOK_URL"[0m
37:notify	Notify Discord	2026-01-11T15:51:47.2639114Z [36;1m  echo "SAFE_SKIP: invalid DISCORD_WEBHOOK_URL domain"[0m
```

### Run meta
```
{"conclusion":"success","createdAt":"2026-01-11T15:51:42Z","displayTitle":"Deploy Notification","status":"completed","updatedAt":"2026-01-11T15:51:49Z"}
```

### Secret scan
- Result: PASS (no hits)

## Post-merge main proof (20260111T160129Z)
- HEAD_SHORT: 523855a
- HEAD_SHA: 523855a1d315682be2cce553a6f339b09e6d2dfc
- PR53_MERGED_AT: 2026-01-11T15:54:18Z
- PR53_MERGE_COMMIT_OID: 523855a1d315682be2cce553a6f339b09e6d2dfc
- CI_RUN_ID: 20897860748
- DEPLOY_NOTIFY_RUN_ID: 20897949689

### SAFE_SKIP markers present in workflow (main)
```
23:            echo "SAFE_SKIP: missing DISCORD_WEBHOOK_URL"
29:            echo "SAFE_SKIP: invalid DISCORD_WEBHOOK_URL domain"
```

### CI proof (stray-artifact)
```
332:Quality Checks	Check for stray artifacts	﻿2026-01-11T15:55:06.6342153Z ##[group]Run bash scripts/smoke/verify-no-stray-artifacts.sh
333:Quality Checks	Check for stray artifacts	2026-01-11T15:55:06.6342871Z [36;1mbash scripts/smoke/verify-no-stray-artifacts.sh[0m
334:Quality Checks	Check for stray artifacts	2026-01-11T15:55:06.6378205Z shell: /usr/bin/bash -e {0}
335:Quality Checks	Check for stray artifacts	2026-01-11T15:55:06.6378462Z env:
336:Quality Checks	Check for stray artifacts	2026-01-11T15:55:06.6378705Z   PNPM_HOME: /home/runner/setup-pnpm/node_modules/.bin
337:Quality Checks	Check for stray artifacts	2026-01-11T15:55:06.6379089Z   STORE_PATH: /home/runner/setup-pnpm/node_modules/.bin/store/v10
338:Quality Checks	Check for stray artifacts	2026-01-11T15:55:06.6379404Z ##[endgroup]
339:Quality Checks	Check for stray artifacts	2026-01-11T15:55:06.9343873Z OK_CLEAN: no stray PHP, xmrig, or tarball artifacts detected
```

### deploy-notify manual dispatch proof (main)
```
31:notify	Notify Discord	2026-01-11T16:01:39.5884549Z [36;1m  echo "SAFE_SKIP: missing DISCORD_WEBHOOK_URL"[0m
37:notify	Notify Discord	2026-01-11T16:01:39.5889481Z [36;1m  echo "SAFE_SKIP: invalid DISCORD_WEBHOOK_URL domain"[0m
```

### deploy-notify run meta
```
{"conclusion":"success","createdAt":"2026-01-11T16:01:34Z","displayTitle":"Deploy Notification","status":"completed","updatedAt":"2026-01-11T16:01:42Z"}
```

### Secret scan
- Result: PASS (no hits)
- Artifact dir: /tmp/proof_postmerge_main_safe_skip_20260111T155818Z
