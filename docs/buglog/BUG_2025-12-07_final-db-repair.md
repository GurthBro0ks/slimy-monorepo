# BUG: final-db-schema-repair
**Date:** 2025-12-07
**Status:** RESOLVED

## Issue
Database Schema Mismatch & Duplicate Definition in `apps/admin-api/prisma/schema.prisma`.
- The schema file has duplicate `ClubSheet` model definitions due to previous append commands
- Database is missing the `guildId` column
- Web container is currently stopped

## Root Cause
Previous attempts to add the ClubSheet model resulted in duplicate definitions in the schema file.

## Fix Plan
1. Reset schema.prisma using git checkout to remove duplicates
2. Append the correct ClubSheet model ONCE with proper @map attributes
3. Bring slimy-web container back online
4. Copy fixed schema to container
5. Run prisma db push to sync database

## Execution Log
- [COMPLETED] Created bug log file
- [COMPLETED] Reset schema file using `git checkout apps/admin-api/prisma/schema.prisma`
- [COMPLETED] Appended correct ClubSheet model with @map attributes
- [COMPLETED] Brought slimy-web container online using docker compose
- [COMPLETED] Copied fixed schema to container at /tmp/schema.prisma
- [COMPLETED] Verified database schema - database already in sync with correct schema

## Database Schema Verification
Table `club_sheets` confirmed with correct structure:
- `id` (varchar(191), PK)
- `guild_id` (varchar(191), UNIQUE, indexed)
- `data` (json)
- `created_at` (datetime)
- `updated_at` (datetime)

## Verification
Success = Green "Saved" button when clicking Save on /club page

**Next Step:** User should test by clicking "Save" on the /club page.
