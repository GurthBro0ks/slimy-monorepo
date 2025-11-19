# Changelog

Generated on: 2025-11-19 03:04:50
Range: `HEAD~10..HEAD`

## Bug Fixes

- use pnpm exec for prisma generate to avoid package manager conflicts (`ba9aa58`)
- stabilize remaining test suites across all hosts (`9cb6354`)
- prisma CLI in Docker + vitest alias for @ (`500b3a5`)
- ensure prisma CLI + next available in container (`320338e`)
- ensure next and prisma generate inside image (`bb547b0`)

## Tests

- fix CodesCache connection tests with proper redis mocks (`53b11b7`)
- fix vitest configuration and migrate jest mocks to vitest (`60b3d5e`)
- stabilize Vitest suites across hosts (`3a6df1e`)

## Chores

- refresh apps/web pnpm lockfile for vite-tsconfig-paths (`8f7091d`)
- exclude vitest config from Next typecheck (`595e5b0`)

