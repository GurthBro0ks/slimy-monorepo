# Phase 8D: Middleware Rewrite Loop Fix

**Date:** 2026-01-13
**Author:** Antigravity (NUC2)
**Proof Dir:** /tmp/proof_phase8D_fix_middleware_20260113T023347Z

## Problem
Middleware was blindly prepending `/trader` to paths even if they already started with `/trader`, causing infinite rewrite loops (e.g. `/trader/trader/login`) and 404s.

## Evidence
### Before
```text
59:< location: /trader/login?returnTo=/trader
62:< x-middleware-rewrite: /trader
91:< x-middleware-rewrite: /trader/trader/login?returnTo=%2Ftrader
101:location: /trader/login?returnTo=/trader
104:x-middleware-rewrite: /trader
```

### After
```text
62:< x-middleware-rewrite: /trader
103:x-middleware-rewrite: /trader
```

## Truth
Middleware rewrite is now idempotent; no double-prefix loop.
