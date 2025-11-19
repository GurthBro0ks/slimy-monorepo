# Local Development Bootstrap Guide

This guide walks you through setting up the slimy-monorepo on a fresh development machine.

## Overview

The slimy-monorepo is a pnpm-based monorepo containing:
- **apps/web** - Customer-facing Next.js 16 web application
- **apps/admin-api** - Express.js backend API
- **apps/admin-ui** - Next.js 14 admin dashboard
- **apps/bot** - Discord bot (stub/TODO)
- **packages/** - Shared utilities (mostly stubs)

## Prerequisites

Before you begin, ensure you have the following installed:

### Required
- **Node.js 20+** (Node 22 recommended)
- **pnpm** (v8 or later)
- **Git**
- **PostgreSQL** (for database)
- **Redis** (for caching and sessions)

### Optional
- **Docker & Docker Compose** (for containerized development)
- **Docker Desktop** or **Podman** (if using containers)

## Step-by-Step Setup

### 1. Install Node.js

**Using nvm (recommended):**
```bash
# Install nvm (if not already installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node 22
nvm install 22
nvm use 22
nvm alias default 22
```

**Alternative methods:**
- Download from [nodejs.org](https://nodejs.org/)
- Use package manager: `brew install node@22` (macOS), `apt install nodejs` (Ubuntu)

**Verify installation:**
```bash
node --version  # Should show v22.x.x
```

### 2. Install pnpm

```bash
# Using npm
npm install -g pnpm

# Or using standalone installer
curl -fsSL https://get.pnpm.io/install.sh | sh -

# Verify installation
pnpm --version  # Should show 8.x or later
```

### 3. Clone the Repository

```bash
# Clone via SSH (recommended if you have SSH keys set up)
git clone git@github.com:GurthBro0ks/slimy-monorepo.git

# Or clone via HTTPS
git clone https://github.com/GurthBro0ks/slimy-monorepo.git

# Navigate to the repository
cd slimy-monorepo
```

### 4. Install Dependencies

```bash
# Install all workspace dependencies (from repository root)
pnpm install
```

This will install dependencies for all apps and packages in the monorepo.

### 5. Set Up Environment Variables

Environment files are **NOT** included in the repository for security reasons. You'll need to create them manually.

#### Admin API Environment

```bash
# Copy the example file
cp apps/admin-api/.env.example apps/admin-api/.env

# Edit the file with your values
nano apps/admin-api/.env  # or use your preferred editor
```

**Required environment variables for `apps/admin-api/.env`:**

```bash
# Server Configuration
PORT=3080
NODE_ENV=development

# Database (PostgreSQL)
DATABASE_URL=postgresql://slimyai:password@localhost:5432/slimyai?schema=public
# Or separate variables:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=slimyai
# DB_USER=slimyai
# DB_PASSWORD=password

# Discord OAuth (requires Discord Developer Application)
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_REDIRECT_URI=http://localhost:3080/auth/discord/callback

# Security Secrets (generate random 32+ character strings)
JWT_SECRET=your_jwt_secret_min_32_chars
SESSION_SECRET=your_session_secret_min_32_chars

# CORS & Cookies
COOKIE_DOMAIN=localhost
CORS_ORIGIN=http://localhost:3000,http://localhost:3081
# Or: ADMIN_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3081

# OpenAI API
OPENAI_API_KEY=your_openai_api_key

# Google Sheets (optional)
STATS_SHEET_ID=your_google_sheet_id

# SNELP Codes URL
SNELP_CODES_URL=http://localhost:3080/api/codes

# File Upload Configuration
UPLOAD_MAX_FILE_SIZE=10485760
UPLOAD_STORAGE_DIR=./uploads
```

#### Web App Environment

The web app typically inherits environment variables from docker-compose, but you may need:

```bash
# Create environment file (if needed for non-Docker setup)
cp apps/web/.env.example apps/web/.env  # If example exists

# Or create manually
cat > apps/web/.env << EOF
DATABASE_URL=postgresql://slimyai:password@localhost:5432/slimyai?schema=public
NEXT_PUBLIC_ADMIN_API_BASE=http://localhost:3080
NEXT_PUBLIC_SNELP_CODES_URL=http://localhost:3080/api/codes
EOF
```

#### Admin UI Environment

```bash
# Admin UI uses environment variables for API connection
cat > apps/admin-ui/.env.local << EOF
NEXT_PUBLIC_ADMIN_API_BASE=http://localhost:3080
EOF
```

### 6. Set Up Database

⚠️ **NOT AUTOMATED** - You must set up PostgreSQL manually.

#### Option A: Local PostgreSQL Installation

**Install PostgreSQL:**
```bash
# macOS
brew install postgresql@15
brew services start postgresql@15

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Windows
# Download installer from https://www.postgresql.org/download/windows/
```

**Create database and user:**
```bash
# Connect to PostgreSQL
psql postgres

# Create user and database
CREATE USER slimyai WITH PASSWORD 'password';
CREATE DATABASE slimyai OWNER slimyai;
GRANT ALL PRIVILEGES ON DATABASE slimyai TO slimyai;
\q
```

#### Option B: Docker PostgreSQL

```bash
docker run --name slimy-postgres \
  -e POSTGRES_USER=slimyai \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=slimyai \
  -p 5432:5432 \
  -d postgres:15
```

#### Run Database Migrations

```bash
# For web app
cd apps/web
pnpm db:generate  # Generate Prisma client
pnpm db:migrate   # Run migrations (if any)

# Optional: Seed database with sample data
pnpm db:seed

# Return to root
cd ../..

# For admin-api (has migrations)
cd apps/admin-api
pnpm db:generate
pnpm db:migrate

cd ../..
```

### 7. Set Up Redis

⚠️ **NOT AUTOMATED** - You must set up Redis manually.

#### Option A: Local Redis Installation

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt update
sudo apt install redis-server
sudo systemctl start redis

# Verify
redis-cli ping  # Should return "PONG"
```

#### Option B: Docker Redis

```bash
docker run --name slimy-redis \
  -p 6379:6379 \
  -d redis:7-alpine
```

### 8. Set Up Discord OAuth (Optional but Recommended)

⚠️ **NOT AUTOMATED** - Requires manual configuration.

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Navigate to OAuth2 settings
4. Add redirect URL: `http://localhost:3080/auth/discord/callback`
5. Copy Client ID and Client Secret to your `.env` file

### 9. Set Up OpenAI API (Optional)

⚠️ **NOT AUTOMATED** - Requires API key.

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an API key
3. Add to your `.env` file: `OPENAI_API_KEY=sk-...`

## Running the Development Environment

### Option 1: Docker Compose (Recommended)

```bash
# Navigate to web app
cd apps/web

# Run quickstart script (sets up everything)
bash quickstart.sh
```

This will:
- Start PostgreSQL, Redis, and all services
- Run health checks
- Make services available at:
  - Web app: http://localhost:3001
  - Admin API: http://localhost:3080
  - Admin UI: http://localhost:3081

### Option 2: Manual Development Servers

**Start all services from root:**
```bash
# From repository root (if configured in root package.json)
pnpm dev
```

**Or start individually:**

```bash
# Terminal 1: Admin API
cd apps/admin-api
pnpm dev
# Server running at http://localhost:3080

# Terminal 2: Web App
cd apps/web
pnpm dev
# Server running at http://localhost:3000

# Terminal 3: Admin UI
cd apps/admin-ui
pnpm dev
# Server running at http://localhost:3081
```

## Development Workflow

### Common Commands

```bash
# Lint all workspaces
pnpm lint

# Build all workspaces
pnpm build

# Run tests across all workspaces
pnpm test

# Web-specific commands (from apps/web)
pnpm test:coverage     # Run tests with coverage
pnpm test:e2e          # Run Playwright E2E tests
pnpm test:e2e:ui       # Run Playwright with UI
pnpm build:analyze     # Analyze bundle size
pnpm db:studio         # Open Prisma Studio (database GUI)
```

### Database Management

```bash
# Generate Prisma client (run after schema changes)
cd apps/web
pnpm db:generate

# Create a new migration
pnpm db:migrate

# Reset database (⚠️ DESTRUCTIVE)
pnpm db:reset

# Open Prisma Studio GUI
pnpm db:studio
```

## Troubleshooting

### Port Already in Use

If you see errors about ports being in use:
```bash
# Find process using port 3000 (or 3080, 3081)
lsof -ti:3000 | xargs kill -9
```

### Prisma Client Generation Issues

```bash
cd apps/web
rm -rf node_modules/.prisma
pnpm db:generate
```

### pnpm Install Fails

```bash
# Clear pnpm cache
pnpm store prune

# Remove node_modules and reinstall
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

### Database Connection Issues

- Verify PostgreSQL is running: `pg_isready`
- Check DATABASE_URL in `.env` files
- Ensure database user has proper permissions

## What's NOT Automated

The following items require manual setup and are **NOT** handled by automated scripts:

1. **PostgreSQL Installation & Configuration**
   - Installing PostgreSQL server
   - Creating database and user
   - Configuring connection strings

2. **Redis Installation & Configuration**
   - Installing Redis server
   - Configuring Redis connection

3. **Secret Management**
   - Generating JWT_SECRET and SESSION_SECRET
   - Obtaining Discord OAuth credentials
   - Obtaining OpenAI API keys
   - Managing Google Sheets API credentials

4. **External Service Configuration**
   - Discord Developer Application setup
   - OAuth callback URL registration
   - Google Cloud Platform setup (for Sheets API)

5. **Production Infrastructure**
   - Domain configuration
   - SSL/TLS certificates
   - Reverse proxy setup (Caddy)
   - Production database backups
   - Monitoring and logging

6. **Environment-Specific Configuration**
   - CORS origins for different environments
   - Cookie domains
   - API endpoints
   - CDN configuration

## Next Steps

After completing the bootstrap:

1. **Explore the codebase:**
   - Read `/docs/STRUCTURE.md` for architecture overview
   - Review individual app README files (if present)

2. **Run tests to verify setup:**
   ```bash
   pnpm test
   ```

3. **Access the applications:**
   - Web app: http://localhost:3000 (or 3001 with Docker)
   - Admin API: http://localhost:3080
   - Admin UI: http://localhost:3081

4. **Set up your IDE:**
   - Install recommended ESLint and Prettier extensions
   - Configure TypeScript for proper workspace support

5. **Review documentation:**
   - Check for app-specific README files
   - Review API documentation (if available)
   - Familiarize yourself with the code structure

## Additional Resources

- [pnpm Workspace Documentation](https://pnpm.io/workspaces)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Discord Developer Portal](https://discord.com/developers/docs)

## Getting Help

If you encounter issues:
1. Check this documentation for troubleshooting steps
2. Review error messages and logs carefully
3. Consult team documentation or reach out to the team
4. Check for updates in the repository (git pull)

---

**Last Updated:** 2025-11-19
**Maintained By:** Development Team
