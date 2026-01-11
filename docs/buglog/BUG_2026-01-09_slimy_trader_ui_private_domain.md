# Buglog: Slimy Trader UI Private Domain

**Date**: 2026-01-09
**Branch**: `feat/trader-ui-private`
**Base Commit**: `9b0e787`

## Overview

Implementation of private Trader UI dashboard at `trader.slimyai.xyz` with:
- Shadow mode (read-only by default)
- Access gate via user settings `trader.access` field (file-based JSON storage)
- Mock-first data layer with HTTP adapter ready
- Caddy routing (avoiding deprecated middleware.ts)

## Git State

```bash
# Initial state
git rev-parse --show-toplevel
# /opt/slimy/slimy-monorepo

git remote -v
# origin  git@github.com:GurthBro0ks/slimy-monorepo.git (fetch)
# origin  git@github.com:GurthBro0ks/slimy-monorepo.git (push)

git status --porcelain  # After stash
# (clean)

git fetch --all --prune
git checkout main
git pull --ff-only
# Fast-forward from 9a2e9c5 to 9b0e787

git checkout -b feat/trader-ui-private
git log -1 --oneline
# 9b0e787 Merge pull request #50 from GurthBro0ks/feat/site-login-theme-wireup-2025-12-14
```

## Routing Approach

**Decision**: Caddy + in-app detection (NOT using deprecated middleware.ts)

**Why not middleware.ts**:
- Next.js 16 warns: "The middleware file convention is deprecated. Please use proxy instead."
- Existing `apps/web/middleware.ts` handles `chat.slimyai.xyz` but generates deprecation warnings
- To avoid adding more deprecated code, we route via Caddy and handle auth in-app

**Implementation**:
1. Caddy block for `trader.slimyai.xyz` → web app (port 3000)
2. App routes at `/trader/*` enforce auth + traderAccess gate server-side
3. No middleware changes needed

## Files Created

### Admin API - User Settings Route
- [x] `apps/admin-api/src/routes/user-settings.js` - User settings CRUD with trader.access support

### Data Layer (apps/web/lib/trader/)
- [x] `types.ts` - TypeScript interfaces (HealthResponse, Market, FeedStatus, Decision, RiskMetrics, LogEntry)
- [x] `fixtures.ts` - Mock data for all types
- [x] `adapters/mock.ts` - Mock adapter with simulated latency
- [x] `adapters/http.ts` - HTTP adapter for real trader backend
- [x] `client.ts` - Client factory (mock/http based on env)
- [x] `context.tsx` - TraderProvider with mode, client, latency tracking
- [x] `access.ts` - Server-side access control logic

### Routes (apps/web/app/trader/)
- [x] `layout.tsx` - Protected layout with auth + access gate
- [x] `page.tsx` - Index redirect to /trader/overview
- [x] `forbidden/page.tsx` - Slimy-styled 403 page
- [x] `overview/page.tsx` - Dashboard with health, markets, risk summary
- [x] `markets/page.tsx` - Markets table with status, price, volume
- [x] `edges/page.tsx` - Trading decision cards with confidence/signal
- [x] `risk/page.tsx` - Risk metrics dashboard with drawdown visualization
- [x] `recorder/page.tsx` - Log tail viewer with level coloring

### Components (apps/web/components/trader/)
- [x] `TraderShell.tsx` - Main shell with nav + banner
- [x] `TraderNav.tsx` - Left sidebar navigation
- [x] `ShadowModeBanner.tsx` - Amber warning banner
- [x] `TraderDebugDock.tsx` - Debug dock (Ctrl+Shift+T toggle)
- [x] `index.ts` - Component exports

## Files Modified

- [x] `apps/admin-api/src/routes/index.js` - Register user-settings routes
- [x] `infra/docker/Caddyfile.slimy-nuc2` - Add trader.slimyai.xyz block (line 101-118)
- [x] `apps/web/.env.example` - Add trader env vars

## Commands Run

```bash
# Git sync
git stash push -u -m "pre-trader-ui stash"
git fetch --all --prune
git checkout main
git pull --ff-only
git checkout -b feat/trader-ui-private

# Directory setup
mkdir -p apps/web/lib/trader/adapters
mkdir -p apps/web/components/trader
mkdir -p apps/web/app/trader/{overview,markets,edges,risk,recorder,forbidden}

# Install deps
pnpm install

# Build verification
pnpm build  # SUCCESS - all trader routes included
```

## Build Output (Trader Routes)

```
├ ƒ /trader
├ ƒ /trader/edges
├ ƒ /trader/forbidden
├ ƒ /trader/markets
├ ƒ /trader/overview
├ ƒ /trader/recorder
├ ƒ /trader/risk
```

## Verification Evidence

### Build Success
```bash
pnpm build
# All trader routes compiled successfully
# No TypeScript errors in trader code
```

### How to Test Locally

1. **Start dev server**:
   ```bash
   pnpm dev:web
   pnpm dev:admin-api
   ```

2. **Grant trader access to test user**:
   ```bash
   # Create user settings file
   mkdir -p apps/admin-api/data/user-settings
   echo '{"trader":{"access":true,"mode":"shadow"}}' > apps/admin-api/data/user-settings/<DISCORD_USER_ID>.json
   ```

3. **Test auth gate** (unauthenticated):
   - Visit `http://localhost:3000/trader`
   - Should redirect to `/api/auth/login?returnTo=/trader`

4. **Test access gate** (authenticated, no access):
   - Login via Discord
   - Visit `/trader`
   - Should show `/trader/forbidden` page

5. **Test full flow** (authenticated + access):
   - Grant access via step 2
   - Visit `/trader`
   - Should show overview dashboard with mock data
   - TraderDebugDock visible (toggle with Ctrl+Shift+T)
   - Shadow mode banner at top

### Host Routing (Production)
```bash
# After Caddy reload
curl -I -H "Host: trader.slimyai.xyz" http://127.0.0.1:3000/
# Should return 302 redirect to login (if unauthenticated)
```

## How trader.slimyai.xyz is Routed

**Caddy Configuration** (`infra/docker/Caddyfile.slimy-nuc2` lines 101-118):
```caddy
trader.slimyai.xyz {
  import slime_common

  @web_routes path /_next/* /api/auth/* /api/me/settings /api/discord/guilds /api/discord/guilds/*
  reverse_proxy @web_routes 127.0.0.1:3000 {
    flush_interval -1
  }

  @admin_api_trader {
    path /api/*
    not path /api/auth/* /api/me/settings /api/discord/guilds /api/discord/guilds/*
  }
  reverse_proxy @admin_api_trader 127.0.0.1:3080 {
    flush_interval -1
  }

  reverse_proxy 127.0.0.1:3000
}
```

**Flow**:
1. Caddy receives request to `trader.slimyai.xyz`
2. Routes to web app on port 3000
3. Web app's `/trader/layout.tsx` checks auth + trader access
4. Redirects to login or forbidden if not authorized
5. Renders trader dashboard if authorized

## Notes

- User settings stored in file-based JSON at `apps/admin-api/data/user-settings/{userId}.json`
- Admin/owner roles bypass trader access check (automatic access)
- Mock adapter simulates realistic latency (50-150ms per endpoint)
- TraderDebugDock shows: mode, adapter, apiBase, lastRefresh, latencyMs, errorCount
- All tabs auto-refresh data every 3-10 seconds depending on the page
