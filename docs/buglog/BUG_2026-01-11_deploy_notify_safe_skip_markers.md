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
