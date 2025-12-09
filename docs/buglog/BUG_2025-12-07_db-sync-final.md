# Bug Fix: Database Schema Mismatch - club_sheets Table

**Date:** 2025-12-07
**Bug Name:** `fix-db-schema-mismatch-final`
**Status:** In Progress

## Context

- **Authentication Status:** FIXED (`[Auth] SUCCESS`)
- **Current Issue:** Database schema mismatch causing application crashes
- **Error Type:** `PrismaClientKnownRequestError`

## Symptoms

The application crashes with the following specific errors:
- `The column slimyai_prod.club_sheets.guildId does not exist.`
- `The column createdAt does not exist.`

## Root Cause

The `club_sheets` table exists in the database but has an incorrect structure. It's missing critical columns that are defined in the Prisma schema:
- `guildId` (mapped to `guild_id`)
- `createdAt` (mapped to `created_at`)
- `updatedAt` (mapped to `updated_at`)

## Diagnosis

The Prisma client is trying to query/insert into columns that don't exist in the actual database table. This indicates the database was not properly migrated when the `ClubSheet` model was added to the schema.

## Solution

### Schema Verification

Verified `apps/admin-api/prisma/schema.prisma` contains the correct `ClubSheet` model definition:

```prisma
model ClubSheet {
  id        String   @id @default(cuid())
  guildId   String   @unique @map("guild_id")
  data      Json
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@index([guildId])
  @@map("club_sheets")
}
```

### Deployment Steps

1. Copy schema to container:
   ```bash
   docker cp apps/admin-api/prisma/schema.prisma slimy-web:/tmp/schema.prisma
   ```

2. Force-push schema to database:
   ```bash
   docker exec -u 0 -w /app -it slimy-web npx prisma@5.22.0 db push --schema /tmp/schema.prisma
   ```

3. Accept data loss on `club_sheets` if prompted (DO NOT accept dropping `users` or `guilds`)

## Verification Test

User will click "Save" on the `/club` page. Success criteria:
- Logs show `[Auth] SUCCESS`
- No Prisma errors
- Data successfully persists to database

## Timeline

- **Started:** 2025-12-07
- **Completed:** TBD

## Notes

- Using Prisma 5.22.0 to match deployed version
- Schema file already correct, just needs database sync
- This is a follow-up to previous auth fix
