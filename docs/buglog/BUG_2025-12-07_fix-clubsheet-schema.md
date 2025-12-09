# BUG: fix-clubsheet-schema-missing-createdat

**Date:** 2025-12-07
**Status:** In Progress
**Priority:** High

## Issue Description
The `ClubSheet` model in the database is missing the `createdAt` field, causing upsert operations to fail.

## Symptoms
```
Invalid prisma.clubSheet.upsert() invocation: The column createdAt does not exist in the current database.
```

## Root Cause
The `ClubSheet` model in `apps/admin-api/prisma/schema.prisma` is missing:
1. `createdAt` field
2. Proper `@map` annotations for consistency with other models

## Solution
Update the `ClubSheet` model to include:
- `createdAt DateTime @default(now()) @map("created_at")`
- Add `@map("guild_id")` to `guildId`
- Add `@map("updated_at")` to `updatedAt`

## Steps Taken
1. ✅ Identified schema inconsistency
2. ✅ Updated schema file with:
   - Added `createdAt DateTime @default(now()) @map("created_at")`
   - Added `@map("guild_id")` to `guildId`
   - Added `@map("updated_at")` to `updatedAt`
3. ✅ Deployed changes to database (schema synced successfully)

## Verification
Test by clicking "Save" on the frontend club sheet interface.

## Result
Database schema is now in sync. The `createdAt` field has been added to the `club_sheets` table.
