# Rollback Plan — TS Bot to JS Bot

**Date:** 2026-04-17

## Current State

- TS bot running as PM2 process `slimy-bot-v2` (id: 0)
- Old JS bot archived at `/opt/slimy/app-archive-20260408.tar.gz`
- No JS bot .env available (would need to reconstruct from archive)

## Rollback Steps

```bash
# 1. Extract the archived JS bot
cd /opt/slimy
tar xzf app-archive-20260408.tar.gz

# 2. Stop the TS bot
pm2 stop slimy-bot-v2

# 3. Start the old JS bot
pm2 start /opt/slimy/app/index.js --name slimy-bot --node-args="--require dotenv/config"

# 4. Save PM2 state
pm2 save

# 5. Verify
pm2 logs slimy-bot --lines 30 --nostream
```

## Important Notes

- The JS bot `.env` was at `/opt/slimy/app/.env` — it should be inside the archive
- The JS bot may have dependencies that need `npm install` in `/opt/slimy/app/`
- The JS bot does NOT have the new commands (club-push, club-analyze context menu, etc.)
- Rolling back means losing all TS-migration features

## If JS Bot Fails to Start

```bash
# Check if node_modules exist
ls /opt/slimy/app/node_modules/

# If missing, install dependencies
cd /opt/slimy/app && npm install

# Retry
pm2 restart slimy-bot
```
