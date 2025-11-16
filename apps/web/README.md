# Slimy.ai Web

Production-ready website for Slimy.ai Discord bot with Admin API integration, codes aggregator, and MDX docs system.

## Features

- **Next.js 16** with App Router, TypeScript, and Tailwind CSS
- **Admin API Proxies** - Server-side proxies for secure API access
- **Codes Aggregator** - Merges codes from Snelp and Reddit r/SuperSnailGame
- **MDX Docs System** - Auto-import docs from GitHub with sidebar navigation
- **Role-Based Access** - Admin, Club, and User roles with route guards
- **Testing** - Vitest (unit) and Playwright (e2e)
- **CI/CD** - GitHub Actions for lint, test, build, and docs sync
- **Docker** - Production-ready containerization

## Quick Start

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Start dev server
pnpm dev

# Open http://localhost:3000
```

## Environment Variables

```bash
NEXT_PUBLIC_ADMIN_API_BASE=""         # Admin API base URL
NEXT_PUBLIC_SNELP_CODES_URL=""        # Snelp codes API URL
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=""       # Plausible analytics domain

# Optional (Docs Import)
DOCS_SOURCE_REPO=""                   # GitHub repo (owner/repo)
DOCS_SOURCE_PATH="docs"               # Path to docs
GITHUB_TOKEN=""                       # GitHub token
```

## Admin API Wiring

Server-side proxies connect to the Admin API:

- `GET /api/diag` → Health check (cached 60s)
- `GET /api/auth/me` → User auth and role mapping
- `GET /api/guilds` → Guild list for admins
- `GET /api/codes` → Codes aggregator (Snelp + Reddit)

### Role Mapping

Configured in `slimy.config.ts`:

```typescript
export const roleMap = {
  admin: ['1178129227321712701', '1216250443257217124'],
  club: ['1178143391884775444'],
};
```

Users are routed based on role:
- **Admin** → `/guilds`
- **Club** → `/club`
- **User** → `/snail`

## Codes Aggregator

Merges codes from:
1. **Snelp API** - Primary source
2. **Reddit** - r/SuperSnailGame posts

Features:
- Deduplication across sources
- 60s server-side cache
- Non-expiring "Copy All" button
- Scope filters (active, past7, all)

## Docs Auto-Import

Import Markdown docs from GitHub:

```bash
# Import docs
pnpm docs:import

# Dry run
pnpm docs:check
```

Features:
- GitHub API integration
- MD → MDX conversion
- Frontmatter preservation
- Link rewriting
- Auto-generated sidebar

## Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e
```

## Deployment

### Docker

```bash
docker build -t slimyai-web .
docker run -p 3000:3000 slimyai-web
```

### Vercel

```bash
vercel --prod
```

## Project Structure

```
slimyai-web/
├── app/                    # Next.js App Router pages
│   ├── api/               # API route handlers
│   ├── snail/             # Snail tools
│   ├── club/              # Club analytics
│   ├── guilds/            # Admin panel
│   └── docs/              # Documentation
├── components/            # React components
│   ├── ui/               # UI components
│   └── layout/           # Layout components
├── content/docs/          # MDX documentation
├── lib/                  # Utilities
├── scripts/              # Build scripts
├── tests/                # Tests
└── .github/workflows/    # CI/CD
```

## Scripts

```bash
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm test         # Run unit tests
pnpm test:e2e     # Run e2e tests
pnpm docs:import  # Import docs from GitHub
```

## License

MIT

---

Built with ❤️ by the Slimy.ai team
