# SlimyAI Bootstrap Tools

This directory contains utility scripts for setting up and managing the SlimyAI monorepo.

## Bootstrap Script

### Overview

The `bootstrap.ts` script is the main setup script for initializing the SlimyAI environment. It handles:

- ✅ Database migrations for all apps
- ✅ Database seeding with initial data
- ✅ Environment validation
- ✅ Admin user configuration
- ✅ Discord OAuth setup
- ✅ System information display

### Usage

From the repository root:

```bash
pnpm bootstrap
```

Or run directly:

```bash
tsx tools/bootstrap.ts
```

### What It Does

1. **Environment Validation**
   - Checks for required environment variables
   - Validates `DATABASE_URL`, `DISCORD_CLIENT_ID`, `JWT_SECRET`, etc.
   - Warns about missing optional variables

2. **Database Migrations**
   - Generates Prisma clients for both web and admin-api
   - Runs `prisma migrate deploy` (production-safe, idempotent)
   - Works with existing databases without data loss

3. **Database Seeding**
   - Runs seed scripts if they exist
   - Creates example data for testing
   - Safe to run multiple times (uses `upsert` operations)

4. **System Information Display**
   - Shows application versions
   - Displays service URLs (Admin UI, API endpoints)
   - Generates Discord OAuth invite URL
   - Lists configured admin users

5. **Setup Instructions**
   - Provides next steps for granting admin access
   - Shows how to start services
   - Explains how to get Discord User IDs

### Configuration

The bootstrap script reads configuration from:

- `apps/admin-api/.env` (primary configuration)
- Environment variables

#### Required Variables

```bash
DATABASE_URL=postgresql://user:password@host:5432/database
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
JWT_SECRET=your_jwt_secret_32_chars_minimum
SESSION_SECRET=your_session_secret_32_chars_minimum
```

#### Optional Variables

```bash
ADMIN_USER_IDS=discord_user_id_1,discord_user_id_2
CLUB_USER_IDS=discord_user_id_3,discord_user_id_4
CORS_ORIGIN=https://admin.slimyai.xyz
DISCORD_REDIRECT_URI=https://admin.slimyai.xyz/api/auth/callback
```

### Features

#### Idempotent Operations

The bootstrap script can be run multiple times safely:

- Database migrations use `migrate deploy` (only applies new migrations)
- Seed operations use `upsert` (update or insert)
- No destructive operations

#### Multi-App Support

Currently supports:

- `apps/admin-api` - Admin API with Prisma (primary)
- `apps/web` - Web application with Prisma

Future apps will be automatically detected and migrated.

#### Admin User Management

Admin access is granted via the `ADMIN_USER_IDS` environment variable:

1. Get Discord User ID:
   - Enable Developer Mode in Discord
   - Right-click user → "Copy User ID"

2. Add to `.env`:
   ```bash
   ADMIN_USER_IDS=123456789012345678,987654321098765432
   ```

3. Restart services

4. User authenticates via Discord OAuth URL (shown by bootstrap script)

### Output Example

```
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║          SlimyAI Bootstrap Script v1.0                ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝

━━━ Environment Validation ━━━

Required Variables:
✓ DATABASE_URL is set
✓ DISCORD_CLIENT_ID is set
✓ DISCORD_CLIENT_SECRET is set
✓ JWT_SECRET is set
✓ SESSION_SECRET is set

━━━ Database Migrations ━━━

ℹ Running migrations for admin-api...
✓ Prisma client generated for admin-api
✓ Migrations deployed for admin-api

━━━ System Information ━━━

Web App Version:       0.1.0
Admin API Version:     1.0.0
Node Version:          v20.x.x
Environment:           development

━━━ Discord OAuth ━━━

Invite URL:
https://discord.com/api/oauth2/authorize?client_id=...

━━━ Next Steps ━━━

To grant admin access to a user:
  1. Add their Discord User ID to ADMIN_USER_IDS
  2. Restart the admin-api service
  3. User authenticates via Discord OAuth URL

━━━ Bootstrap Complete ━━━

✓ Database initialized successfully!
✓ You can now start the services.
```

### Troubleshooting

#### "DATABASE_URL not set"

Ensure you have created a `.env` file in `apps/admin-api/` with a valid PostgreSQL connection string:

```bash
cp apps/admin-api/.env.example apps/admin-api/.env
# Edit .env and add your DATABASE_URL
```

#### "Migration failed"

- Check that PostgreSQL is running
- Verify database credentials
- Ensure database exists (create it if needed)
- Check network connectivity to database

#### "Prisma client generation failed"

- Ensure Prisma is installed: `pnpm install`
- Check that `prisma/schema.prisma` exists
- Verify schema syntax is valid

#### "No admin users configured"

Add Discord User IDs to `.env`:

```bash
ADMIN_USER_IDS=your_discord_user_id
```

Get your Discord User ID:
1. Discord Settings → Advanced → Enable Developer Mode
2. Right-click your profile → Copy User ID

### Database Utilities

Individual database scripts are available in each app:

```bash
# Admin API
cd apps/admin-api
pnpm db:generate      # Generate Prisma client
pnpm db:migrate       # Run migrations (dev mode)
pnpm db:migrate:deploy # Run migrations (production mode)
pnpm db:seed          # Seed database
pnpm db:studio        # Open Prisma Studio

# Web App
cd apps/web
pnpm db:generate      # Generate Prisma client
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed database
pnpm db:studio        # Open Prisma Studio
```

### Development

To modify the bootstrap script:

1. Edit `tools/bootstrap.ts`
2. Test by running `pnpm bootstrap`
3. Ensure idempotency (can run multiple times safely)
4. Update this README with any changes

### Related Files

- `apps/admin-api/prisma/schema.prisma` - Admin API database schema
- `apps/admin-api/prisma/seed.js` - Admin API seed script
- `apps/web/prisma/schema.prisma` - Web app database schema
- `apps/web/prisma/seed.ts` - Web app seed script
- `apps/admin-api/.env.example` - Example environment configuration
