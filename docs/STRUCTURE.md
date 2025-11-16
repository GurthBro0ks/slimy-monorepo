# Repository Structure

This document summarizes the purpose of each top-level directory in the Slimy.ai monorepo scaffold. As code is imported from `slimyai-web` and `slimyai_setup`, update this file to capture new responsibilities.

## Apps

- `apps/web` – customer-facing Slimy.ai web portal.
- `apps/admin-api` – backend API powering administrative workflows and dashboards.
- `apps/admin-ui` – admin interface for operations and support teams.
- `apps/bot` – conversational bot services and related integrations.

### Admin environment requirements

- `apps/admin-api` ships with `.env.example`, `.env.admin.example`, and `.env.admin.production.example`. Populate values for database access (`DATABASE_URL` or `DB_*`), Discord OAuth (`DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URI`), session/auth secrets (`SESSION_SECRET`, `JWT_SECRET`, `COOKIE_DOMAIN`), allowed origins (`CORS_ORIGIN`/`ADMIN_ALLOWED_ORIGINS`), service identification (`ADMIN_API_SERVICE_NAME`, `ADMIN_API_VERSION`), and external integrations such as `OPENAI_API_KEY`, Google Sheets IDs, and upload storage paths. Set `PORT`, `NODE_ENV`, and logging levels as needed for each deployment.
- `apps/admin-ui` reads public Next.js environment variables at build time. Create a `.env.local` with `NEXT_PUBLIC_ADMIN_API_BASE` (defaults to `http://localhost:3080` for dev), Discord bot metadata (`NEXT_PUBLIC_BOT_CLIENT_ID`, `NEXT_PUBLIC_BOT_INVITE_SCOPES`, `NEXT_PUBLIC_BOT_PERMISSIONS`), and optional `NEXT_BUILD_ID` overrides used by `next.config.js`.

### Potential shared modules to revisit

- `apps/admin-api/lib` plus `apps/admin-api/vendor/slimy-core` contain reusable database, JWT/session, queue, and monitoring helpers that may be promoted into a shared workspace package later.
- `apps/admin-ui/lib` bundles the browser-side API client, Discord helpers, session management, Sheets accessors, and websocket utilities reused across multiple pages/components.

## Packages

- `packages/shared-config` – shared configuration loaders, schema validation, and environment helpers.
- `packages/shared-db` – database clients, migrations, and ORM helpers.
- `packages/shared-auth` – authentication and authorization utilities shared across apps.
- `packages/shared-snail` – reusable core Slimy "snail" domain logic.
- `packages/shared-codes` – shared error codes, enums, and protocol constants.

## Infrastructure

- `infra/caddy` – reverse proxy and TLS configuration.
- `infra/docker` – container images, compose files, and related tooling.
- `infra/systemd` – unit files for services deployed via systemd.
- `infra/scripts` – helper scripts for local development and deployments.
- `infra/monitoring` – observability dashboards, alerts, and metrics collectors.
- `infra/backups` – retention policies and backup/restore automation.

## Docs and Automation

- `docs/` – design notes, onboarding guides, and architecture references.
- `.github/workflows/` – CI/CD workflows run by GitHub Actions.
