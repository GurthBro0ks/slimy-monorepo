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
