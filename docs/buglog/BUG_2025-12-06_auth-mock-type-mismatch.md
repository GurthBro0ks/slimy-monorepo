# Bug Report: auth-mock-type-mismatch

## Symptom
- Command: `docker compose build --no-cache web`
- Error: `Type error: Object literal may only specify known properties, and 'email' does not exist in type 'ServerAuthUser'. (tests/utils/auth-mock.ts:14:3)`
- Timestamp: 2025-12-06T19:11:09Z

## Root Cause
- The `ServerAuthUser` interface defined in `apps/web/lib/auth/server.ts` does not include an `email` property, but the mock object in `tests/utils/auth-mock.ts` specifies `email`.

## Plan
- [x] Add `email?: string;` to the `ServerAuthUser` interface in `apps/web/lib/auth/server.ts`.
- [ ] Confirm the build passes via `docker compose build --no-cache web` (blocked: no permission to access Docker daemon).

## Changes
- Updated `apps/web/lib/auth/server.ts` to add the optional `email` field to `ServerAuthUser`.

## Verification
- 2025-12-06T19:11:25Z — `docker compose build --no-cache web` **failed**: permission denied when connecting to `/var/run/docker.sock`. Requires Docker daemon access to rerun.
