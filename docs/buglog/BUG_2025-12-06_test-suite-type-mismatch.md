## Bug: test-suite-type-mismatch

- Context: `docker compose -f infra/docker/docker-compose.slimy-nuc2.yml -p slimy-nuc2 build --no-cache web`
- Symptom: TypeScript step fails during build.
- Error:
  - `./tests/utils/auth-mock.ts:14:3`
  - `Type error: Object literal may only specify known properties, and 'email' does not exist in type 'ServerAuthUser'.`

Notes: `ServerAuthUser` recently gained `email?: string` in `apps/web/lib/auth/server.ts`; tests appear to use an outdated definition.

### Actions
- Confirmed `ServerAuthUser` now includes optional `email` in `apps/web/lib/auth/server.ts`.
- Adjusted `apps/web/tests/utils/auth-mock.ts` to extend `ServerAuthUser` with optional `email` for the test mock and override helper.

### Verification
- 2025-12-06T20:36:40Z — `docker compose -f infra/docker/docker-compose.slimy-nuc2.yml -p slimy-nuc2 build --no-cache web` ✅ (TypeScript phase passed; image built)
