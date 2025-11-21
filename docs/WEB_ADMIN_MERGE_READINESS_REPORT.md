# Web + Admin Merge Readiness Report

## 1. Branches Integrated
- **Base branch:** `main` (`518ba4064`).
- **claude/setup-page-shell-012s7F8Lv4pR78vjwgtBKdGb` (`1522099af`): fast-forward merge pulled in the staging docker-compose, scripts, and docs.
- **claude/snail-tier-api-0169dhF4vEZZZbVRmvyhHW6X` (`f880cca6d`)**: merged cleanly; adds centralized tier formulas, snail-tier service, new routes, and Jest coverage.
- **claude/snail-ui-polish-01Q1NCtZBEWu7KjjneM9vVe3` (`06708c156`, merge commit `4c9ce65e9`)**: introduced the snail UI pages, API clients, and documentation refresh. Only conflict was in `docs/WEB_BACKEND_INTEGRATION_SUMMARY.md`; resolved by keeping the original integration guide and appending the new snail-specific section so both contexts remain.

## 2. Static Checks
### apps/admin-api
| Command | Result | Notes |
| --- | --- | --- |
| `pnpm lint` | ❌ Fails | Workspace package has no `lint` script; `pnpm` exits with `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`.
| `pnpm test` | ❌ Fails | Jest aborts because required env vars (`DISCORD_CLIENT_ID`, `SESSION_SECRET`, `DATABASE_URL`, etc.) are not provided. Multiple suites (auth middleware, chat, diag, guilds) all error out before tests run. | 

### apps/web
| Command | Result | Notes |
| --- | --- | --- |
| `pnpm lint` | ❌ Fails | Hundreds of existing ESLint issues (untyped `any`, hooks warnings, `react-hooks/set-state-in-effect`, `@next/next/no-img-element`, etc.) across legacy files. Not scoped to snail work; left untouched but tracked here. |
| `pnpm test` | ✅ Pass | Vitest suites succeed (184 tests). Console logs show intentional mocked failures (Redis cache retries, screenshot analyzer errors) but exit status is 0. |
| `pnpm build` | ✅ Pass | Next.js 16 build completes (Turbopack warning about multi-lockfiles and middleware deprecation). Post-build validation + bundle-size scripts succeed. |

## 3. Endpoint Compatibility
- **POST `/api/snail/tier`**
  - Now handled by a compatibility router that reuses `calculateSnailTier` and still requires `requireAuth` + `requireRole('member')`. Legacy `/api/snail/:guildId/tier` continues to work for guild-scoped flows.
  - Example payload/response (from `calculateSnailTier` service):
    ```json
    {
      "tier": "S+",
      "score": 1448.95,
      "summary": "Player tier: S+ (score: 1448.95) - Elite tier - Top 1% of players",
      "details": {
        "tier": "S+",
        "description": "Elite tier - Top 1% of players",
        "minScore": 1000,
        "actualScore": 1448.95,
        "stats": {
          "level": 80,
          "cityLevel": 45,
          "relicPower": 350000,
          "clubContribution": 120,
          "simPower": 1247893,
          "maxSimPower": 2000000
        }
      }
    }
    ```
- **GET `/api/snail/screenshots/latest`**
  - New compatibility endpoint proxies to `getLatestScreenshotAnalysis` with `guildId` taken from `?guildId=` query, `DEFAULT_SNAIL_GUILD_ID`, or the caller's first guild. Guild-scoped legacy route `/api/snail/:guildId/screenshots/latest` still works for authenticated members.
  - Frontend client (`fetchLatestScreenshots`) now defaults to this URL and optionally appends `?guildId=foo`.
  - Example analysis block from the shared service:
    ```json
    {
      "imageUrl": "/api/uploads/files/snail/compat-guild/screenshot1.png",
      "timestamp": "2025-11-21T18:07:51.551Z",
      "stats": {
        "snailLevel": 45,
        "cityLevel": 38,
        "simPower": 125000,
        "relicPower": 8500,
        "clubContribution": 250,
        "suggestedTier": "A",
        "suggestedScore": 650
      },
      "confidence": {
        "snailLevel": 0.95,
        "cityLevel": 0.92,
        "simPower": 0.88,
        "relicPower": 0.85,
        "clubContribution": 0.9
      }
    }
    ```
- **Frontend agreement:** `/screenshots` now calls `GET /api/snail/screenshots/latest?guildId=test-guild-123` and `/tiers` posts to `/api/snail/tier`, matching the backend surface.
- **Limitations:** Could not validate via curl because the staging stack never came up (see §4). Functional verification is limited to service-level samples.

## 4. Staging & Smoke Tests
| Command | Result | Notes |
| --- | --- | --- |
| `./scripts/deploy-staging.sh` | ❌ Fails immediately | `docker compose` CLI is missing on this host, so the stack never starts. |
| `./scripts/smoke-test-staging.sh` | ❌ Fails | Health checks hit `http://localhost:3081` and return HTTP 000 because services were never deployed. |

Env scaffolding (`.env.db.staging`, `.env.admin-api.staging`, `.env.web.staging`) was created from `.env.staging.example`, and `.env.web.staging` now sets `NEXT_PUBLIC_ADMIN_API_BASE=http://slimy-admin-api-staging:3081`. Real secrets/URLs still need to be filled in manually before redeploying.

## 5. Frontend Route Health
All curl probes to `http://localhost:3001` (`/api/health`, `/`, `/snail/codes`, `/screenshots`, `/tiers`) returned HTTP 000 because the staging compose stack never launched. No SSR verification was possible.

## 6. Conclusion – **NOT READY TO MERGE**
Blocking issues:
1. **Admin API tests require secrets** – `pnpm test` fails on missing `DISCORD_*`, `SESSION_SECRET`, and `DATABASE_URL`. Need a test env or stubs.
2. **Admin API lint coverage missing** – no lint script exists, so we cannot guarantee style/static coverage.
3. **Web ESLint debt** – `pnpm lint` fails with hundreds of pre-existing issues; snail work adds more UI but lint gates remain red.
4. **Staging stack unavailable** – Docker Compose v2 is missing locally, so we cannot deploy or run smoke tests.
5. **Endpoint validation via HTTP skipped** – Because staging never ran, curl checks for `/api/snail/tier` and `/api/snail/screenshots/latest` could not be executed end-to-end.

Until the above are addressed, this integration branch should remain a WIP.

## 7. Open TODOs
- Install Docker Desktop / Compose v2 and rerun `deploy-staging.sh` + `smoke-test-staging.sh`.
- Populate the staging env files with valid secrets, guild IDs, and `NEXT_PUBLIC_ADMIN_API_BASE` pointing at the compose hostnames.
- Provide test-friendly env overrides (or mocks) so `pnpm test` in `apps/admin-api` can run headless.
- Schedule time to burn down the existing ESLint backlog (at least scope for snail UI files).
- Once staging is up, rerun curl checks for `/api/snail/tier` and `/api/snail/screenshots/latest` plus the Next.js routes to confirm compatibility in practice.
