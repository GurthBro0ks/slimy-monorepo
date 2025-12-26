# Admin API — Agent Rules

## Contracts
- admin-api is the canonical API surface for Discord + Web settings/memory.
- Keep request/response contracts typed and shared (prefer `packages/`).
- Settings + Memory v0 must validate payloads with `@slimy/contracts` schemas.
- Settings auto-init is required: GET must create defaults when missing.
- Memory guardrails are required:
  - hard size limit (4–16KB) on `content`
  - reject secret-like keys (token/secret/password/key/auth/cookie)

## Auth/Cookies
- Any cookie/auth change requires:
  - a targeted test and/or a curl-based verification script
  - buglog evidence (headers, redirects, Set-Cookie, etc.)

## Data
- Prisma/schema changes require migration generation + verification.
- Avoid storing raw chat transcripts by default; store structured summaries/state unless explicitly required.
