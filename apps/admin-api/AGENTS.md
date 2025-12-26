# Admin API — Agent Rules

## Contracts
- admin-api is the canonical API surface for Discord + Web settings/memory.
- Keep request/response contracts typed and shared (prefer `packages/`).

## Auth/Cookies
- Any cookie/auth change requires:
  - a targeted test and/or a curl-based verification script
  - buglog evidence (headers, redirects, Set-Cookie, etc.)

## Data
- Prisma/schema changes require migration generation + verification.
- Avoid storing raw chat transcripts by default; store structured summaries/state unless explicitly required.

