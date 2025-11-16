# Tasks Better Suited for ChatGPT Codex

These issues are better handled through automated refactoring or require deeper architectural changes:

## 1. Fix React Hooks in docs/[slug]/page.tsx

**File:** `app/docs/[slug]/page.tsx`

**Issue:** React Hook "useMDXComponents" cannot be called in an async function and is called conditionally.

**Current behavior:** The hook is being called inside an async server component.

**Expected behavior:** Refactor to properly use MDX components in Next.js 16 server components pattern.

**Test:** Verify docs pages render correctly without React Hooks errors.

---

## 2. Fix setState in effect for status page

**File:** `app/status/page.tsx`

**Issue:** Calling setState synchronously within an effect triggers cascading renders.

**Current behavior:** `checkStatus()` is called directly in useEffect, which immediately calls setState.

**Expected behavior:** Refactor to use a more appropriate pattern, possibly moving the initial check outside the effect or using a different approach.

**Test:** Verify status page loads without performance warnings and displays correct service status.

---

## 3. Replace require() with ES6 imports

**Files:**
- `lib/rate-limiter.ts` (line 29)
- `tailwind.config.ts` (line 68)
- `tests/unit/rate-limiter.test.ts` (line 38)

**Issue:** `require()` style imports are forbidden by ESLint config.

**Current behavior:** Using CommonJS require() syntax.

**Expected behavior:** Convert to ES6 import syntax or use dynamic imports where necessary.

**Test:** Run `pnpm lint` and verify no require() errors remain.

---

## 4. Fix TypeScript any types

**Files:**
- `app/api/chat/bot/route.ts` (line 37)
- `app/api/guilds/[id]/settings/route.ts` (line 52)
- `lib/codes-aggregator.ts` (line 47)

**Issue:** Using `any` type instead of proper TypeScript types.

**Current behavior:** Type safety is bypassed with `any`.

**Expected behavior:** Define proper interfaces/types for these values.

**Test:** Run `pnpm typecheck` and verify no type errors.

---

## 5. Clean up unused variables

**Files:**
- `app/public-stats/[guildId]/page.tsx` - MOCK_GUILD_ID
- `lib/rate-limiter.ts` - 'e' variable
- `scripts/import-docs.ts` - existsSync, filePath
- `tests/unit/rate-limiter.test.ts` - join, existsSync, unlinkSync

**Issue:** Variables defined but never used.

**Current behavior:** Dead code that clutters the codebase.

**Expected behavior:** Remove unused imports and variables.

**Test:** Run `pnpm lint` and verify no unused variable warnings.

---

## 6. Fix useEffect dependency in snail/codes/page.tsx

**File:** `app/snail/codes/page.tsx`

**Issue:** React Hook useEffect has a missing dependency: 'fetchCodes'.

**Current behavior:** fetchCodes is used in useEffect but not in dependency array.

**Expected behavior:** Either add fetchCodes to dependencies or wrap it in useCallback.

**Test:** Verify codes page loads correctly without warnings.

---

## Summary

Total issues: 6 categories covering ~12 files
Estimated effort: 2-3 hours for comprehensive refactoring
Priority: Medium (these don't affect the mobile polish functionality)

All of these issues existed before the mobile polish work and should be addressed in a separate refactoring PR.
