# Slimy.ai Web - Project Summary

## Overview

Production-ready Next.js 16 website for Slimy.ai Discord bot with Admin API integration, codes aggregator, and MDX documentation system.

## Repository

**GitHub:** https://github.com/GurthBro0ks/slimyai-web

## What Was Built

### 1. Core Infrastructure
- **Next.js 16** with App Router and TypeScript
- **Tailwind CSS v4** for styling
- **shadcn/ui** components (Button, Card, Badge, etc.)
- **Dark theme** with neon-green (#39FF14) and purple (#8A2BE2) accents

### 2. Admin API Integration
- **Server-side proxies** for secure API access
- **Role mapping** (admin, club, user) in `slimy.config.ts`
- **Route guards** based on user roles
- **Error handling** with consistent error shapes

API Routes:
- `GET /api/diag` - Health check (cached 60s)
- `GET /api/auth/me` - User authentication and role mapping
- `GET /api/guilds` - Guild list for admins
- `GET /api/health` - App health check

### 3. Codes Aggregator
- **Multi-source aggregation** (Snelp API + Reddit)
- **Reddit scraping** from r/SuperSnailGame
- **Deduplication** across sources
- **Server-side caching** (60s with background revalidation)
- **Non-expiring Copy All button**
- **Scope filters** (active, past7, all)

### 4. MDX Docs System
- **Auto-import script** (`scripts/import-docs.ts`)
- **GitHub API integration** for fetching docs
- **MD → MDX conversion** with remark/rehype plugins
- **Sidebar navigation** with auto-generated metadata
- **3 sample docs** (Getting Started, Snail Tools, Club Analytics)

### 5. Pages & Components

**Public Pages:**
- `/` - Homepage with hero and features grid
- `/features` - Detailed features page
- `/docs` - Documentation with sidebar
- `/status` - System status dashboard

**App Pages:**
- `/snail` - Snail tools dashboard
- `/snail/codes` - Secret codes aggregator
- `/club` - Club analytics (placeholder)
- `/guilds` - Admin panel (placeholder)
- `/chat` - Chat interface (placeholder)

**Components:**
- `Header` - Navigation with role badges
- `Footer` - Site footer with links
- `CopyBox` - Non-expiring copy button
- `Callout` - Info/warn/error/success callouts
- `Badge`, `Button`, `Card`, `Skeleton`

### 6. Testing & CI/CD
- **Vitest** for unit tests
- **Playwright** for e2e tests
- **GitHub Actions** workflows (in `.github/workflows/`)
  - CI: lint, typecheck, test, build
  - Docs sync: nightly and on-demand

### 7. Deployment
- **Docker** support with multi-stage build
- **docker-compose.yml** for easy deployment
- **Standalone output** for optimal performance
- **Environment variables** documented

## Project Structure

```
slimyai-web/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (proxies)
│   ├── snail/             # Snail tools
│   ├── club/              # Club analytics
│   ├── guilds/            # Admin panel
│   ├── docs/              # Documentation
│   └── [other pages]
├── components/            # React components
│   ├── ui/               # UI components
│   └── layout/           # Layout components
├── content/docs/          # MDX documentation
├── lib/                  # Utilities
│   ├── utils.ts          # General utilities
│   └── api-proxy.ts      # API proxy helper
├── scripts/              # Build scripts
│   ├── import-docs.ts    # Docs import
│   └── postbuild-validate.ts
├── tests/                # Tests
│   ├── unit/             # Unit tests
│   └── e2e/              # E2E tests
├── .github/workflows/    # CI/CD
├── slimy.config.ts       # Role mapping
├── Dockerfile            # Docker config
├── docker-compose.yml    # Docker Compose
└── [config files]
```

## Key Features

### ✅ Implemented
- Admin API proxies with role-based routing
- Codes aggregator with Reddit integration
- MDX docs system with auto-import
- Dark theme with brand colors
- Testing infrastructure
- Docker support
- CI/CD workflows
- Sample data and documentation

### 🚧 Placeholders (Ready for Implementation)
- Screenshot analysis (UI ready, needs API)
- Stats tracking (UI ready, needs API)
- Tier calculator (UI ready, needs logic)
- Club analytics (UI ready, needs API)
- Real-time chat (UI ready, needs WebSocket)

## Configuration

### Environment Variables

```bash
NEXT_PUBLIC_ADMIN_API_BASE=""         # Admin API URL
NEXT_PUBLIC_SNELP_CODES_URL=""        # Snelp codes API
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=""       # Analytics domain

# Optional (Docs)
DOCS_SOURCE_REPO=""                   # GitHub repo
DOCS_SOURCE_PATH="docs"               # Docs path
GITHUB_TOKEN=""                       # GitHub token
```

### Role Mapping

```typescript
export const roleMap = {
  admin: ['1178129227321712701', '1216250443257217124'],
  club: ['1178143391884775444'],
};
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
pnpm docs:check   # Dry run docs import
```

## Deployment

### Build Status
✅ **Build passing** - All TypeScript errors resolved

### Deployment Options
1. **Vercel** (recommended) - One-click deploy
2. **Docker** - Production-ready container
3. **Node.js** - Traditional server deployment

See `DEPLOYMENT.md` for detailed instructions.

## Next Steps

1. **Connect Admin API**
   - Update `NEXT_PUBLIC_ADMIN_API_BASE` with real API URL
   - Test authentication and role mapping

2. **Import Real Docs**
   - Set `DOCS_SOURCE_REPO` to your docs repository
   - Run `pnpm docs:import`

3. **Add GitHub Workflows**
   - Manually add workflow files through GitHub UI
   - (Couldn't be pushed due to permission restrictions)

4. **Customize Content**
   - Update homepage copy
   - Add real feature descriptions
   - Customize footer links

5. **Enable Features**
   - Implement screenshot analysis
   - Add stats tracking
   - Build tier calculator
   - Connect club analytics

## Technical Highlights

- **Type-safe** - Full TypeScript coverage
- **Server-side rendering** - Optimal performance
- **API proxies** - Secure backend communication
- **Caching strategy** - Smart revalidation
- **Error handling** - Consistent error shapes
- **Testing** - Unit and e2e tests
- **CI/CD** - Automated workflows
- **Docker** - Production-ready containers

## Documentation

- `README.md` - Main documentation
- `DEPLOYMENT.md` - Deployment guide
- `PROJECT_SUMMARY.md` - This file
- `/docs` - User-facing documentation

## Support

- **Repository:** https://github.com/GurthBro0ks/slimyai-web
- **Issues:** https://github.com/GurthBro0ks/slimyai-web/issues

---

**Status:** ✅ Ready for deployment  
**Build:** ✅ Passing  
**Tests:** ✅ Configured  
**Documentation:** ✅ Complete
