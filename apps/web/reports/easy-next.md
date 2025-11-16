# Easy Next Steps

Quick wins that can be implemented in 1-2 lines each:

## 1. Add jsdom dependency
```bash
pnpm add -D jsdom @types/jsdom
```

## 2. Remove unused MOCK_GUILD_ID
File: `app/public-stats/[guildId]/page.tsx` line 9
Action: Delete the line

## 3. Remove unused imports in scripts/import-docs.ts
File: `scripts/import-docs.ts` lines 3, 66
Action: Remove `existsSync` from import, remove `filePath` parameter

## 4. Remove unused imports in tests/unit/rate-limiter.test.ts
File: `tests/unit/rate-limiter.test.ts` lines 3-4
Action: Remove `join`, `existsSync`, `unlinkSync` from imports

## 5. Remove unused 'e' variable in lib/rate-limiter.ts
File: `lib/rate-limiter.ts` line 84
Action: Change `catch (e)` to `catch`

## 6. Add fetchCodes to useEffect dependency
File: `app/snail/codes/page.tsx` line 53
Action: Wrap fetchCodes in useCallback or add to dependency array

## 7. Add mobile e2e test file
Create: `tests/e2e/mobile.spec.ts`
Test: Header brand, login text, card layout, timeline empty state, status states, footer layout

## 8. Update README.md with mobile polish section
Add section documenting the mobile improvements and responsive design

## 9. Update changelog.mdx
Add entry for v0.2.0-mobile-polish with list of improvements

## 10. Create ui-guidelines.mdx
Document:
- Header usage loader behavior
- Unified FeatureCard spec
- Compact callouts
- Status state machine
- Footer horizontal groups

Total estimated time: 30-60 minutes
