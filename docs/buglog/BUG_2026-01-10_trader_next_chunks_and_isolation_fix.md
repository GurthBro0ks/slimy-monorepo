# BUG_2026-01-10_trader_next_chunks_and_isolation_fix

## Context
- Trader site chunks returning 404.
- Hydration failing, causes full page refresh on registration.
- Need to isolate trader UI from main site header.

## Phase 1: PID Diagnostics
- Target PID: 2954420
- PPID: 1
- CWD: `/opt/slimy/slimy-monorepo/apps/web/.next/standalone/apps/web`
- CMD: `next-server (v16.0.1)`
- CGroup: `0::/system.slice/slimy-web-host.service`

## Phase 2: Service Management
- Managed by systemd: `slimy-web-host.service`
- Service details:
  - WorkingDirectory: `/opt/slimy/slimy-monorepo/apps/web`
  - ExecStart: `/usr/bin/node .next/standalone/apps/web/server.js`
  - Environment: Production, Port 3000

## Observations
- [x] Identified `slimy-web-host.service` as the managing systemd service.
- [x] Rebuilt `apps/web` on the host.
- [x] Discovered that Next.js standalone server expects static assets in `.next/standalone/apps/web/.next/static`.
- [x] Updated `package.json` `postbuild` script to automatically copy static assets and public directory to the standalone runtime location.
- [x] Verified static chunks now return 200 OK.
- [x] Implemented UI isolation in `RootLayout` using `x-pathname` (passed via middleware) and `host` headers.
- [x] Verified trader pages no longer render the main site header/nav.

## Resolution
- Root cause of 404s: Missing static assets in the standalone runtime directory.
- Fix: Automated copying of assets in `postbuild`.
- Root cause of UI overlap: Lack of host/path-based layout guarding.
- Fix: Middleware header passing + conditional layout in `RootLayout`.
