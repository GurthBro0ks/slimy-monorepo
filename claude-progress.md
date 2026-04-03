# Claude Progress Log — slimy-monorepo

## Session: 2026-04-03 (Web DATABASE_URL fix)

**Agent:** Codex
**Features worked on:** web-database-url-fix-001

**What was done:**
- Confirmed `apps/web/.env` had `DATABASE_URL=.../slimyai_prod`.
- Updated to `DATABASE_URL=mysql://slimy:super-secret-app-password@127.0.0.1:3306/slimy`.
- Ran `pnpm --filter web build` successfully.
- Restarted `slimy-web.service` using `systemctl --user` and verified active state.
- Verified routes: `/snail`, `/snail/stats`, `/snail/club` all return 200.
- Verified `/api/snail/club` returns 307 auth redirect (no slimyai_prod DB error response).
- Applied matching db-name fix on NUC1 `.env` over SSH.

**What needs to happen next:**
- If API data output is needed without redirect, test with authenticated cookie/session.

**Environment state:** Healthy; web service active.
**Git state:** Progress + feature tracker updated; .env unchanged in git.

---

> This file is append-only. Every agent session adds an entry at the top.
> Never edit or delete old entries. They are the memory of the project.

---

## Session: 2026-03-17 (Harness Initialization)

**Agent:** Human (harness setup)
**Duration:** N/A
**Features worked on:** None (initial harness scaffolding)

**What was done:**
- Created AGENTS.md, feature_list.json, claude-progress.md, init.sh
- Established agent operating procedures
- Set up feature tracking with 8 initial features (all marked as not passing)

**What needs to happen next:**
- First agent session should verify all "critical" priority features
- Run init.sh and confirm it works
- Update feature_list.json with actual pass/fail status for each feature
- Add more features to feature_list.json as scope becomes clearer

**Environment state:** Clean, init.sh untested
**Git state:** Uncommitted harness files

---
