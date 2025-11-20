# Prisma Migration Guide

This guide documents the Prisma schema organization and migration practices for the slimy-monorepo.

## Overview

The monorepo contains multiple applications with Prisma schemas:

- **apps/web**: Web application schema (user preferences, sessions, chat, feature flags, code reports)
- **apps/admin-api**: Admin API schema (club analytics, audit logs, user/guild management, screenshots)

## Schema Ownership Principles

### Single Source of Truth

Each database table should have **exactly one** canonical Prisma schema definition:

- The application that owns a table is responsible for its schema and migrations
- Other applications should access the data via API calls, not direct database queries
- Avoid duplicating model definitions across applications

### Current Ownership Map

| Domain | Owner | Tables |
|--------|-------|--------|
| Club Analytics | **admin-api** | `club_analyses`, `club_analysis_images`, `club_metrics` |
| Audit Logs | **admin-api** | `audit_logs` |
| User Management | **admin-api** | `users`, `sessions`, `guilds`, `user_guilds` |
| Screenshots | **admin-api** | `screenshot_analyses`, `screenshot_data`, `screenshot_tags`, etc. |
| User Preferences | **web** | `user_preferences` |
| Chat | **web** | `chat_conversations`, `chat_messages` |
| Feature Flags | **web** | `guild_feature_flags` |
| Code Reports | **web** | `code_reports` |
| User Sessions | **web** | `user_sessions` |

**Note**: Some overlap exists (e.g., both apps have session-related models). Future consolidation phases will address these.

## Club Analytics & Audit Log Cleanup (Phase 2.4)

### What Changed

As of Phase 2.4 (completed 2025-11-20):

- **Web app no longer defines** Prisma models for:
  - `ClubAnalysis`
  - `ClubAnalysisImage`
  - `ClubMetric`
  - `AuditLog`

- **Admin-api is the canonical owner** for both schema and migrations of these models

- **Web app accesses this data** via HTTP calls to admin-api endpoints

### Migration Path

If you have legacy data or references to these models in the web app:

1. **Check for direct Prisma usage**: Search for imports from `@prisma/client` that reference these models
2. **Replace with API calls**: Use the admin-api HTTP client (`lib/api/admin-client.ts`)
3. **Update type definitions**: Define interface types locally or import from admin-api if shared

### Data Migration

For legacy data stored in separate databases (pre-Phase 2.1):

1. Use the migration scripts from Phase 2.3
2. Backup all databases before migration
3. Run migration with dry-run first: `pnpm migrate:club-analytics --dry-run`
4. Execute actual migration: `pnpm migrate:club-analytics`
5. Verify data integrity
6. Update connection strings to point to consolidated database

## Running Migrations

### Web App Migrations

```bash
# Generate Prisma client
pnpm db:generate

# Create a new migration
pnpm db:migrate

# Apply migrations in production
pnpm db:migrate:prod

# Reset database (development only)
pnpm db:reset
```

### Admin API Migrations

The admin-api currently doesn't have npm scripts for Prisma migrations. Migrations are managed separately.

**Important**: Only admin-api should run migrations for club analytics and audit log tables.

## Best Practices

### Adding New Models

1. **Determine ownership**: Which application is the primary consumer?
2. **Define in one place**: Add the model to the appropriate `schema.prisma`
3. **Document it**: Update the ownership map in this guide
4. **Generate client**: Run `pnpm db:generate` in the owning application
5. **Create migration**: Run `pnpm db:migrate` in the owning application
6. **Cross-app access**: Use HTTP APIs, not direct database access

### Modifying Existing Models

1. **Check ownership**: Ensure you're modifying the canonical schema
2. **Coordinate changes**: If multiple apps are affected, plan the rollout
3. **Create migration**: Generate and test migration in development first
4. **Update types**: Regenerate Prisma clients after schema changes
5. **Update consumers**: If other apps are affected, update their API client code

### Deprecating Models

When removing duplicate models (like in Phase 2.4):

1. **Verify no active usage**: Search for references in the codebase
2. **Remove or refactor usage**: Replace Prisma queries with API calls
3. **Remove from schema**: Delete the model definition
4. **Regenerate client**: Run `pnpm db:generate`
5. **Test thoroughly**: Ensure no type errors or runtime issues
6. **Document**: Update this guide and the integration plan

## Common Issues

### "Model not found" Errors

If you get errors about missing models after a schema change:

1. Regenerate the Prisma client: `pnpm db:generate`
2. Restart your development server
3. Clear `.next` cache: `rm -rf .next`

### Migration Conflicts

If you encounter migration conflicts:

1. Ensure you're on the correct branch
2. Pull the latest migrations from the remote
3. Resolve conflicts in migration files (if any)
4. Reset your dev database if needed: `pnpm db:reset`

### Type Errors After Schema Changes

If TypeScript complains about missing types:

1. Check if the model was moved to another app
2. Update imports to use API response types instead of Prisma types
3. Define local interfaces if needed
4. Ensure `@prisma/client` is regenerated

## Rollback Procedures

### Rolling Back a Migration

```bash
# Web app
pnpm db:migrate:reset

# Then reapply up to the desired point
pnpm db:migrate
```

**Note**: In production, use database backups for major rollbacks.

### Rolling Back Schema Changes

1. Revert the schema.prisma changes in git
2. Regenerate the Prisma client
3. Rollback the database migration (see above)
4. Deploy the reverted code

## Testing Migrations

### Development Testing

1. Always test migrations in a development database first
2. Use seeded test data to verify data integrity
3. Check for breaking changes in your application code

### Staging Testing

1. Apply migrations to a staging environment
2. Run the full test suite
3. Verify manually that features still work
4. Check performance of queries

### Production Migrations

1. **Backup first**: Always backup the database before migrations
2. **Plan downtime**: If needed, schedule maintenance windows
3. **Monitor closely**: Watch error rates and performance metrics
4. **Have rollback ready**: Keep the backup and rollback scripts accessible

## Related Documentation

- [Web Backend Integration Plan](../WEB_BACKEND_INTEGRATION_PLAN.md)
- [Database Structure](../STRUCTURE.md)
