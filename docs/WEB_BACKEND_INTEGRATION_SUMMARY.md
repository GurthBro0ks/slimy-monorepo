# Web-Backend Integration Summary

This document describes how the Slimy web app (`apps/web`) integrates with the admin API backend (`apps/admin-api`).

## Architecture Overview

```
┌─────────────────┐
│   User Browser  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Web App       │  Next.js (port 3000/3001)
│  (apps/web)     │  - React frontend
└────────┬────────┘  - Server-side rendering
         │           - Auth provider
         │           - Protected routes
         ▼
┌─────────────────┐
│   Admin API     │  Express (port 3080/3081)
│ (apps/admin-api)│  - Discord OAuth
└────────┬────────┘  - REST endpoints
         │           - JWT auth
         ▼
┌─────────────────┐
│   PostgreSQL    │  Database (port 5432/5433)
│   / MySQL       │  - User data
└─────────────────┘  - Application state
```

## Key Components

### 1. Authentication Flow

**Discord OAuth** is handled by the admin API:

1. User clicks "Login with Discord" on web app
2. Web redirects to admin API: `/api/auth/login`
3. Admin API redirects to Discord OAuth
4. Discord redirects back to admin API: `/api/auth/callback`
5. Admin API sets JWT cookie and redirects to web app
6. Web app reads cookie for subsequent requests

**Implementation:**

- **Admin API**: `apps/admin-api/routes/auth.js`
  - `GET /api/auth/login` - Initiates OAuth
  - `GET /api/auth/callback` - Handles Discord callback
  - `GET /api/auth/logout` - Clears session
  - `GET /api/auth/me` - Returns current user

- **Web App**: `apps/web/src/lib/auth/`
  - `AuthProvider.tsx` - React context for auth state
  - `useAuth.ts` - Hook for accessing auth
  - `ProtectedRoute.tsx` - Route guard component

### 2. API Integration

**Client Setup:**

```typescript
// apps/web/src/lib/api/AdminApiClient.ts
export class AdminApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_ADMIN_API_BASE || '';
  }

  async fetch(endpoint: string, options?: RequestInit) {
    return fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      credentials: 'include', // Send cookies
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
  }
}
```

**Key Setting:** `credentials: 'include'` ensures JWT cookies are sent with requests.

### 3. Routes and Pages

#### Public Routes

- `/` - Homepage
- `/chat` - Public chat interface
- `/login` - Login page (redirects to Discord)

#### Protected Routes

These require authentication and use `ProtectedRoute` wrapper:

- `/snail/codes` - Snelp codes aggregator
- `/screenshots` - Latest screenshots
- `/club` - Club features

**Protection Implementation:**

```typescript
// apps/web/src/components/auth/ProtectedRoute.tsx
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;

  return <>{children}</>;
}
```

### 4. Backend Endpoints

Live endpoints in `apps/admin-api`:

| Endpoint                          | Method | Auth Required | Description                    |
|-----------------------------------|--------|---------------|--------------------------------|
| `/api/health`                     | GET    | No            | Health check                   |
| `/api/diag`                       | GET    | No            | Diagnostics                    |
| `/api/auth/login`                 | GET    | No            | Start Discord OAuth            |
| `/api/auth/callback`              | GET    | No            | Handle OAuth callback          |
| `/api/auth/logout`                | GET    | No            | Clear session                  |
| `/api/auth/me`                    | GET    | Yes           | Get current user               |
| `/api/usage/summary`              | GET    | Yes/No*       | Usage statistics               |
| `/api/chat`                       | POST   | No            | Chat endpoint                  |
| `/api/snail/codes`                | GET    | No            | Get Snelp codes                |
| `/api/snail/tier`                 | POST   | Yes           | Update tier                    |
| `/api/snail/screenshots/latest`   | GET    | No            | Latest screenshots             |

\* Some endpoints may be public or require auth depending on configuration

### 5. Shared Layout

**PageShell Component:**

```typescript
// apps/web/src/components/layout/PageShell.tsx
export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />           {/* Nav with auth-aware links */}
      <ConnectionBadge />  {/* Shows API connection status */}
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
```

All pages use this layout for consistent navigation and auth state display.

### 6. Environment Variables

#### Admin API

**Build/Runtime:**

- `PORT` - Server port (default: 3080)
- `NODE_ENV` - Environment (production/staging/development)
- `JWT_SECRET` - Secret for signing JWTs
- `DISCORD_CLIENT_ID` - Discord OAuth app ID
- `DISCORD_CLIENT_SECRET` - Discord OAuth secret
- `DISCORD_REDIRECT_URI` - OAuth callback URL
- `DB_URL` - Database connection string
- `COOKIE_DOMAIN` - Domain for auth cookies
- `ALLOWED_ORIGIN` - CORS allowed origin

#### Web App

**Build-time (baked into image):**

- `NEXT_PUBLIC_ADMIN_API_BASE` - Admin API URL (e.g., `https://admin.slimyai.xyz`)
- `NEXT_PUBLIC_SNELP_CODES_URL` - External codes API
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` - Analytics domain

**Runtime:**

- `NODE_ENV` - Environment
- `PORT` - Server port (default: 3000)
- `DATABASE_URL` - Database (if web needs direct access)

## Sandbox vs Live

### Sandbox Mode (Development/Staging)

**Purpose:** Testing, development, staging environments

**Configuration:**

```bash
# Admin API
NODE_ENV=staging
COOKIE_SECURE=false
ALLOWED_ORIGIN=http://localhost:3001
DISCORD_REDIRECT_URI=http://localhost:3081/api/auth/callback

# Web App
NEXT_PUBLIC_ADMIN_API_BASE=http://localhost:3081
```

**Characteristics:**

- Test Discord OAuth app
- Relaxed CORS
- HTTP (not HTTPS)
- Verbose logging
- Test/staging database

### Live Mode (Production)

**Purpose:** Production deployment on NUCs

**Configuration:**

```bash
# Admin API
NODE_ENV=production
COOKIE_SECURE=true
ALLOWED_ORIGIN=https://admin.slimyai.xyz
DISCORD_REDIRECT_URI=https://admin.slimyai.xyz/api/auth/callback

# Web App
NEXT_PUBLIC_ADMIN_API_BASE=https://admin.slimyai.xyz
```

**Characteristics:**

- Production Discord OAuth app
- Strict CORS
- HTTPS required
- Production logging
- Production database
- Rate limiting enforced

## Deployment

### Staging Deployment

For detailed staging deployment instructions, see:

**📘 [NUC Staging Deployment Guide](./NUC_DEPLOY_STAGING.md)**

Quick start:

```bash
# 1. Configure environment
cp .env.staging.example .env.db.staging
cp .env.staging.example .env.admin-api.staging
cp .env.staging.example .env.web.staging
# Edit files with your values

# 2. Deploy
./scripts/deploy-staging.sh

# 3. Verify
./scripts/smoke-test-staging.sh
```

Staging stack runs on:

- Web: http://localhost:3001
- Admin API: http://localhost:3081
- Database: postgresql://localhost:5433

### Production Deployment

Production deployments use NUC-specific compose files:

- **NUC1:** `infra/docker/docker-compose.slimy-nuc1.yml` (MySQL)
- **NUC2:** `infra/docker/docker-compose.slimy-nuc2.yml` (PostgreSQL + Caddy)

Production stack runs on:

- Web: http://localhost:3000 (proxied via Caddy)
- Admin API: http://localhost:3080 (proxied via Caddy)
- Database: localhost:5432 or localhost:3306

### Reverse Proxy Setup

Production uses Caddy to:

1. Provide HTTPS termination
2. Route `/api/*` to admin-api backend
3. Route everything else to web app
4. Add security headers

Example Caddyfile:

```caddyfile
admin.slimyai.xyz {
    # API routes to backend
    handle /api/* {
        reverse_proxy localhost:3080
    }

    # Web app
    reverse_proxy localhost:3000

    # Security headers
    header {
        Strict-Transport-Security "max-age=31536000"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
    }
}
```

## Development Workflow

### Local Development

```bash
# Terminal 1 - Admin API
cd apps/admin-api
npm install
npm run dev  # Port 3080

# Terminal 2 - Web App
cd apps/web
pnpm install
pnpm dev     # Port 3000

# Terminal 3 - Database (if needed)
docker run -p 5432:5432 -e POSTGRES_PASSWORD=dev postgres:16-alpine
```

### Docker Development (Staging)

```bash
# Start staging stack
./scripts/deploy-staging.sh

# Watch logs
docker compose -f docker-compose.staging.yml logs -f

# Rebuild after changes
docker compose -f docker-compose.staging.yml up -d --build

# Stop
./scripts/down-staging.sh
```

## Troubleshooting

### Common Issues

#### 1. CORS Errors

**Symptom:** Browser console shows CORS errors when calling admin API

**Solution:**

- Verify `ALLOWED_ORIGIN` in admin-api env matches web app origin exactly
- Check `credentials: 'include'` is set in fetch calls
- For local dev with different ports, admin API must allow the web origin

#### 2. Auth Not Persisting

**Symptom:** User logs in but immediately logged out on refresh

**Solution:**

- Check `COOKIE_DOMAIN` - should match domain or be empty for localhost
- Verify `COOKIE_SECURE=false` for HTTP, `true` for HTTPS
- Ensure `credentials: 'include'` in API client

#### 3. 502 Bad Gateway

**Symptom:** Web app can't reach admin API

**Solution:**

- Verify admin API is running: `curl http://localhost:3081/api/health`
- Check `NEXT_PUBLIC_ADMIN_API_BASE` points to correct URL
- If using Docker, ensure containers are on same network
- Check reverse proxy configuration (if using one)

#### 4. Protected Routes Not Working

**Symptom:** Can access protected routes without logging in

**Solution:**

- Verify `ProtectedRoute` wrapper is used
- Check `useAuth()` hook is working (returns user when logged in)
- Ensure `AuthProvider` wraps the app

### Debug Commands

```bash
# Check container status
docker compose -f docker-compose.staging.yml ps

# View logs
docker compose -f docker-compose.staging.yml logs admin-api-staging
docker compose -f docker-compose.staging.yml logs web-staging

# Test endpoints
curl http://localhost:3081/api/health
curl http://localhost:3081/api/auth/me
curl http://localhost:3001/

# Check environment vars in container
docker exec slimy-admin-api-staging env | grep DISCORD
docker exec slimy-web-staging env | grep NEXT_PUBLIC
```

## Additional Documentation

- **[NUC Staging Deployment](./NUC_DEPLOY_STAGING.md)** - Detailed staging deployment guide
- **[Docker Troubleshooting](../infra/docker/NUC2_DOCKER_ADMIN_API_FIX.md)** - Docker-specific issues
- **[Web Deployment](../apps/web/DEPLOYMENT.md)** - Web app deployment options
- **[Repository Structure](./STRUCTURE.md)** - Monorepo layout

## Support

For questions or issues:

1. Check this integration summary
2. Review deployment guides
3. Check application logs
4. Run smoke tests: `./scripts/smoke-test-staging.sh`
