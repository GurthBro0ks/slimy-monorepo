# Environment Configuration

This app validates environment variables at startup through `lib/config`. Missing or invalid values fail fast with a clear error message in development and during builds.

## Setup
- Copy `.env.example` to `.env` in `apps/web` and fill in the values you need.
- Required for a working local setup: `NEXT_PUBLIC_ADMIN_API_BASE`, `NEXT_PUBLIC_SNELP_CODES_URL`, and a sensible `NEXT_PUBLIC_APP_URL`.
- Optional services can stay blank; defaults are applied where safe (e.g., Redis, alerting, OpenAI).

## Validation
- Schemas live in `lib/config/index.ts` and run once on import.
- Client-safe values are exposed via `clientConfig`; server settings and secrets stay under `config`/`env`.
- Helpers like `hasOpenAI`, `hasRedis`, `hasDocsImport`, and `isProduction` keep feature checks consistent.

## Common Variables
- **Admin API:** `NEXT_PUBLIC_ADMIN_API_BASE`, `REQUEST_SIGNING_SECRET`
- **Codes feed:** `NEXT_PUBLIC_SNELP_CODES_URL`
- **AI:** `OPENAI_API_KEY`, `OPENAI_API_BASE`
- **Redis:** `REDIS_URL` or `REDIS_HOST`/`REDIS_PORT`
- **Alerts:** `ALERT_WEBHOOK_URL`, `ALERT_EMAIL_RECIPIENTS`
- **Docs import:** `DOCS_SOURCE_REPO`, `DOCS_SOURCE_PATH`, `GITHUB_TOKEN`
- Full list with defaults lives in `.env.example`.

## Usage
- Access validated config in code:
  - Server/runtime: `config`, `env`
  - Client-safe: `clientConfig`
- Avoid direct `process.env` lookups; add new variables to the schema and `.env.example`.

## Verification
- Quick check: `npm run dev` should fail fast if required vars are missing.
- Tests: `npm test` (unit) and `npm run test:e2e` (Playwright) will also reuse the validated config.
