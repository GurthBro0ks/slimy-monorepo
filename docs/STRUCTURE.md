# Repository Structure

This document summarizes the purpose of each top-level directory in the Slimy.ai monorepo scaffold. As code is imported from `slimyai-web` and `slimyai_setup`, update this file to capture new responsibilities.

## Apps

- `apps/web` – customer-facing Slimy.ai web portal.
- `apps/admin-api` – backend API powering administrative workflows and dashboards.
- `apps/admin-ui` – admin interface for operations and support teams.
- `apps/bot` – conversational bot services and related integrations.

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
