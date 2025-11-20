
> @slimy/web@0.1.0 build /home/mint/slimy-dev/slimy-monorepo/apps/web
> next build

 ⚠ Warning: Next.js inferred your workspace root, but it may not be correct.
 We detected multiple lockfiles and selected the directory of /home/mint/package-lock.json as the root directory.
 To silence this warning, set `turbopack.root` in your Next.js config, or consider removing one of the lockfiles if it's not needed.
   See https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack#root-directory for more information.
 Detected additional lockfiles: 
   * /home/mint/slimy-dev/slimy-monorepo/apps/web/pnpm-lock.yaml
   * /home/mint/slimy-dev/slimy-monorepo/pnpm-lock.yaml

   ▲ Next.js 16.0.1 (Turbopack)

 ⚠ The "middleware" file convention is deprecated. Please use "proxy" instead. Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
   Creating an optimized production build ...

> Build error occurred
Error: Turbopack build failed with 9 errors:
./slimy-dev/slimy-monorepo/apps/web/app/public-stats/[guildId]/page.tsx:13:23
Ecmascript file had an error
[0m [90m 11 |[39m
 [90m 12 |[39m [90m// Set dynamic metadata for OG image[39m
[31m[1m>[22m[39m[90m 13 |[39m [36mexport[39m [36masync[39m [36mfunction[39m generateMetadata({
 [90m    |[39m                       [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
 [90m 14 |[39m   params[33m,[39m
 [90m 15 |[39m }[33m:[39m {
 [90m 16 |[39m   params[33m:[39m { guildId[33m:[39m string }[33m;[39m[0m

You are attempting to export "generateMetadata" from a component marked with "use client", which is disallowed. Either remove the export, or the "use client" directive. Read more: https://nextjs.org/docs/app/api-reference/directives/use-client



Import traces:
  Client Component Browser:
    ./slimy-dev/slimy-monorepo/apps/web/app/public-stats/[guildId]/page.tsx [Client Component Browser]
    ./slimy-dev/slimy-monorepo/apps/web/components/lazy/routes.ts [Client Component Browser]
    ./slimy-dev/slimy-monorepo/apps/web/components/lazy/index.ts [Client Component Browser]
    ./slimy-dev/slimy-monorepo/apps/web/app/club/page.tsx [Client Component Browser]
    ./slimy-dev/slimy-monorepo/apps/web/app/club/page.tsx [Server Component]

  Client Component SSR:
    ./slimy-dev/slimy-monorepo/apps/web/app/public-stats/[guildId]/page.tsx [Client Component SSR]
    ./slimy-dev/slimy-monorepo/apps/web/components/lazy/routes.ts [Client Component SSR]
    ./slimy-dev/slimy-monorepo/apps/web/components/lazy/index.ts [Client Component SSR]
    ./slimy-dev/slimy-monorepo/apps/web/app/club/page.tsx [Client Component SSR]
    ./slimy-dev/slimy-monorepo/apps/web/app/club/page.tsx [Server Component]


./slimy-dev/slimy-monorepo/apps/web/hooks/use-chat.ts:231:7
Parsing ecmascript source code failed
[0m [90m 229 |[39m     }
 [90m 230 |[39m
[31m[1m>[22m[39m[90m 231 |[39m     } [36mcatch[39m (err[33m:[39m any) {
 [90m     |[39m       [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
 [90m 232 |[39m       console[33m.[39merror([32m'Send message error:'[39m[33m,[39m err)[33m;[39m
 [90m 233 |[39m
 [90m 234 |[39m       [90m// Remove the placeholder message on error[39m[0m

Expected ',', got 'catch'

Import traces:
  Client Component Browser:
    ./slimy-dev/slimy-monorepo/apps/web/hooks/use-chat.ts [Client Component Browser]
    ./slimy-dev/slimy-monorepo/apps/web/components/chat/chat-interface.tsx [Client Component Browser]
    ./slimy-dev/slimy-monorepo/apps/web/components/lazy/index.ts [Client Component Browser]
    ./slimy-dev/slimy-monorepo/apps/web/app/club/page.tsx [Client Component Browser]
    ./slimy-dev/slimy-monorepo/apps/web/app/club/page.tsx [Server Component]

  Client Component SSR:
    ./slimy-dev/slimy-monorepo/apps/web/hooks/use-chat.ts [Client Component SSR]
    ./slimy-dev/slimy-monorepo/apps/web/components/chat/chat-interface.tsx [Client Component SSR]
    ./slimy-dev/slimy-monorepo/apps/web/components/lazy/index.ts [Client Component SSR]
    ./slimy-dev/slimy-monorepo/apps/web/app/club/page.tsx [Client Component SSR]
    ./slimy-dev/slimy-monorepo/apps/web/app/club/page.tsx [Server Component]


./slimy-dev/slimy-monorepo/apps/web/app/docs/[slug]/page.tsx:1:1
Module not found: Can't resolve 'fs'
[0m[31m[1m>[22m[39m[90m 1 |[39m [36mimport[39m { readFileSync } [36mfrom[39m [32m"fs"[39m[33m;[39m
 [90m   |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
 [90m 2 |[39m [36mimport[39m { join } [36mfrom[39m [32m"path"[39m[33m;[39m
 [90m 3 |[39m [36mimport[39m { notFound } [36mfrom[39m [32m"next/navigation"[39m[33m;[39m
 [90m 4 |[39m [36mimport[39m { compileMDX } [36mfrom[39m [32m"next-mdx-remote/rsc"[39m[33m;[39m[0m



Import traces:
  Client Component Browser:
    ./slimy-dev/slimy-monorepo/apps/web/app/docs/[slug]/page.tsx [Client Component Browser]
    ./slimy-dev/slimy-monorepo/apps/web/components/lazy/routes.ts [Client Component Browser]
    ./slimy-dev/slimy-monorepo/apps/web/components/lazy/index.ts [Client Component Browser]
    ./slimy-dev/slimy-monorepo/apps/web/app/club/page.tsx [Client Component Browser]
    ./slimy-dev/slimy-monorepo/apps/web/app/club/page.tsx [Server Component]

  Client Component SSR:
    ./slimy-dev/slimy-monorepo/apps/web/app/docs/[slug]/page.tsx [Client Component SSR]
    ./slimy-dev/slimy-monorepo/apps/web/components/lazy/routes.ts [Client Component SSR]
    ./slimy-dev/slimy-monorepo/apps/web/components/lazy/index.ts [Client Component SSR]
    ./slimy-dev/slimy-monorepo/apps/web/app/club/page.tsx [Client Component SSR]
    ./slimy-dev/slimy-monorepo/apps/web/app/club/page.tsx [Server Component]

https://nextjs.org/docs/messages/module-not-found


./slimy-dev/slimy-monorepo/apps/web/lib/feature-flags.ts:6:1
Module not found: Can't resolve 'fs'
[0m [90m 4 |[39m [90m */[39m
 [90m 5 |[39m
[31m[1m>[22m[39m[90m 6 |[39m [36mimport[39m { readFileSync[33m,[39m writeFileSync[33m,[39m existsSync[33m,[39m mkdirSync } [36mfrom[39m [32m"fs"[39m[33m;[39m
 [90m   |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
 [90m 7 |[39m [36mimport[39m { join } [36mfrom[39m [32m"path"[39m[33m;[39m
 [90m 8 |[39m
 [90m 9 |[39m [36mexport[39m [36minterface[39m [33mGuildFlags[39m {[0m



Import traces:
  App Route:
    ./slimy-dev/slimy-monorepo/apps/web/lib/feature-flags.ts
    ./slimy-dev/slimy-monorepo/apps/web/app/api/guilds/[id]/flags/route.ts

  Server Component:
    ./slimy-dev/slimy-monorepo/apps/web/lib/feature-flags.ts
    ./slimy-dev/slimy-monorepo/apps/web/app/public-stats/[guildId]/page.tsx

  Client Component Browser:
    ./slimy-dev/slimy-monorepo/apps/web/lib/feature-flags.ts [Client Component Browser]
    ./slimy-dev/slimy-monorepo/apps/web/app/public-stats/[guildId]/page.tsx [Client Component Browser]
    ./slimy-dev/slimy-monorepo/apps/web/components/lazy/routes.ts [Client Component Browser]
    ./slimy-dev/slimy-monorepo/apps/web/components/lazy/index.ts [Client Component Browser]
    ./slimy-dev/slimy-monorepo/apps/web/app/club/page.tsx [Client Component Browser]
    ./slimy-dev/slimy-monorepo/apps/web/app/club/page.tsx [Server Component]

  Client Component SSR:
    ./slimy-dev/slimy-monorepo/apps/web/lib/feature-flags.ts [Client Component SSR]
    ./slimy-dev/slimy-monorepo/apps/web/app/public-stats/[guildId]/page.tsx [Client Component SSR]
    ./slimy-dev/slimy-monorepo/apps/web/components/lazy/routes.ts [Client Component SSR]
    ./slimy-dev/slimy-monorepo/apps/web/components/lazy/index.ts [Client Component SSR]
    ./slimy-dev/slimy-monorepo/apps/web/app/club/page.tsx [Client Component SSR]
    ./slimy-dev/slimy-monorepo/apps/web/app/club/page.tsx [Server Component]

https://nextjs.org/docs/messages/module-not-found


./slimy-dev/slimy-monorepo/apps/web/components/screenshot/Viewer.tsx:8:1
Export Compare doesn't exist in target module
[0m [90m  6 |[39m [36mimport[39m { [33mButton[39m } [36mfrom[39m [32m"@/components/ui/button"[39m[33m;[39m
 [90m  7 |[39m [36mimport[39m { [33mCallout[39m } [36mfrom[39m [32m"@/components/ui/callout"[39m[33m;[39m
[31m[1m>[22m[39m[90m  8 |[39m [36mimport[39m {
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m>[22m[39m[90m  9 |[39m   [33mEye[39m[33m,[39m
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m>[22m[39m[90m 10 |[39m   [33mDownload[39m[33m,[39m
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m>[22m[39m[90m 11 |[39m   [33mCompare[39m[33m,[39m
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m>[22m[39m[90m 12 |[39m   [33mSearch[39m[33m,[39m
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m>[22m[39m[90m 13 |[39m   [33mFilter[39m[33m,[39m
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m>[22m[39m[90m 14 |[39m   [33mZoomIn[39m[33m,[39m
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m>[22m[39m[90m 15 |[39m   [33mZoomOut[39m[33m,[39m
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m>[22m[39m[90m 16 |[39m   [33mRotateCw[39m[33m,[39m
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m>[22m[39m[90m 17 |[39m   [33mX[39m[33m,[39m
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m>[22m[39m[90m 18 |[39m   [33mBarChart3[39m[33m,[39m
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m>[22m[39m[90m 19 |[39m   [33mLightbulb[39m[33m,[39m
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m>[22m[39m[90m 20 |[39m   [33mCheckCircle[39m[33m,[39m
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m>[22m[39m[90m 21 |[39m   [33mAlertCircle[39m[33m,[39m
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m>[22m[39m[90m 22 |[39m   [33mClock[39m[33m,[39m
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m>[22m[39m[90m 23 |[39m   [33mTag[39m
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m>[22m[39m[90m 24 |[39m } [36mfrom[39m [32m"lucide-react"[39m[33m;[39m
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
 [90m 25 |[39m [36mimport[39m type { [33mScreenshotAnalysisResult[39m[33m,[39m [33mScreenshotType[39m } [36mfrom[39m [32m"@/lib/screenshot/analyzer"[39m[33m;[39m
 [90m 26 |[39m
 [90m 27 |[39m [36minterface[39m [33mScreenshotViewerProps[39m {[0m

The export Compare was not found in module [project]/slimy-dev/slimy-monorepo/node_modules/.pnpm/lucide-react@0.548.0_react@19.2.0/node_modules/lucide-react/dist/esm/lucide-react.js [app-client] (ecmascript).
Did you mean to import GitCompare?
All exports of the module are statically known (It doesn't have dynamic exports). So it's known statically that the requested export doesn't exist.

Import traces:
  Server Component:
    ./slimy-dev/slimy-monorepo/apps/web/components/screenshot/Viewer.tsx
    ./slimy-dev/slimy-monorepo/apps/web/components/lazy/index.ts
    ./slimy-dev/slimy-monorepo/apps/web/app/analytics/page.tsx

  Client Component Browser:
    ./slimy-dev/slimy-monorepo/apps/web/components/screenshot/Viewer.tsx [Client Component Browser]
    ./slimy-dev/slimy-monorepo/apps/web/components/lazy/index.ts [Client Component Browser]
    ./slimy-dev/slimy-monorepo/apps/web/app/club/page.tsx [Client Component Browser]
    ./slimy-dev/slimy-monorepo/apps/web/app/club/page.tsx [Server Component]

  Client Component SSR:
    ./slimy-dev/slimy-monorepo/apps/web/components/screenshot/Viewer.tsx [Client Component SSR]
    ./slimy-dev/slimy-monorepo/apps/web/components/lazy/index.ts [Client Component SSR]
    ./slimy-dev/slimy-monorepo/apps/web/app/club/page.tsx [Client Component SSR]
    ./slimy-dev/slimy-monorepo/apps/web/app/club/page.tsx [Server Component]


./slimy-dev/slimy-monorepo/apps/web/components/screenshot/Viewer.tsx:8:1
Export Compare doesn't exist in target module
[0m [90m  6 |[39m [36mimport[39m { [33mButton[39m } [36mfrom[39m [32m"@/components/ui/button"[39m[33m;[39m
 [90m  7 |[39m [36mimport[39m { [33mCallout[39m } [36mfrom[39m [32m"@/components/ui/callout"[39m[33m;[39m
[31m[1m>[22m[39m[90m  8 |[39m [36mimport[39m {
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m>[22m[39m[90m  9 |[39m   [33mEye[39m[33m,[39m
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m>[22m[39m[90m 10 |[39m   [33mDownload[39m[33m,[39m
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m>[22m[39m[90m 11 |[39m   [33mCompare[39m[33m,[39m
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m>[22m[39m[90m 12 |[39m   [33mSearch[39m[33m,[39m
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m>[22m[39m[90m 13 |[39m   [33mFilter[39m[33m,[39m
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m>[22m[39m[90m 14 |[39m   [33mZoomIn[39m[33m,[39m
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m>[22m[39m[90m 15 |[39m   [33mZoomOut[39m[33m,[39m
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m>[22m[39m[90m 16 |[39m   [33mRotateCw[39m[33m,[39m
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m>[22m[39m[90m 17 |[39m   [33mX[39m[33m,[39m
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m>[22m[39m[90m 18 |[39m   [33mBarChart3[39m[33m,[39m
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m>[22m[39m[90m 19 |[39m   [33mLightbulb[39m[33m,[39m
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m>[22m[39m[90m 20 |[39m   [33mCheckCircle[39m[33m,[39m
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m>[22m[39m[90m 21 |[39m   [33mAlertCircle[39m[33m,[39m
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m>[22m[39m[90m 22 |[39m   [33mClock[39m[33m,[39m
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m>[22m[39m[90m 23 |[39m   [33mTag[39m
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m>[22m[39m[90m 24 |[39m } [36mfrom[39m [32m"lucide-react"[39m[33m;[39m
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
 [90m 25 |[39m [36mimport[39m type { [33mScreenshotAnalysisResult[39m[33m,[39m [33mScreenshotType[39m } [36mfrom[39m [32m"@/lib/screenshot/analyzer"[39m[33m;[39m
 [90m 26 |[39m
 [90m 27 |[39m [36minterface[39m [33mScreenshotViewerProps[39m {[0m

The export Compare was not found in module [project]/slimy-dev/slimy-monorepo/node_modules/.pnpm/lucide-react@0.548.0_react@19.2.0/node_modules/lucide-react/dist/esm/lucide-react.js [app-ssr] (ecmascript).
Did you mean to import GitCompare?
All exports of the module are statically known (It doesn't have dynamic exports). So it's known statically that the requested export doesn't exist.

Import traces:
  Server Component:
    ./slimy-dev/slimy-monorepo/apps/web/components/screenshot/Viewer.tsx
    ./slimy-dev/slimy-monorepo/apps/web/components/lazy/index.ts
    ./slimy-dev/slimy-monorepo/apps/web/app/analytics/page.tsx

  Client Component Browser:
    ./slimy-dev/slimy-monorepo/apps/web/components/screenshot/Viewer.tsx [Client Component Browser]
    ./slimy-dev/slimy-monorepo/apps/web/components/lazy/index.ts [Client Component Browser]
    ./slimy-dev/slimy-monorepo/apps/web/app/club/page.tsx [Client Component Browser]
    ./slimy-dev/slimy-monorepo/apps/web/app/club/page.tsx [Server Component]

  Client Component SSR:
    ./slimy-dev/slimy-monorepo/apps/web/components/screenshot/Viewer.tsx [Client Component SSR]
    ./slimy-dev/slimy-monorepo/apps/web/components/lazy/index.ts [Client Component SSR]
    ./slimy-dev/slimy-monorepo/apps/web/app/club/page.tsx [Client Component SSR]
    ./slimy-dev/slimy-monorepo/apps/web/app/club/page.tsx [Server Component]


./slimy-dev/slimy-monorepo/apps/web/lib/club/vision.ts:1:1
Export getOpenAIClient doesn't exist in target module
[0m[31m[1m>[22m[39m[90m 1 |[39m [36mimport[39m { getOpenAIClient } [36mfrom[39m [32m'@/lib/openai-client'[39m[33m;[39m
 [90m   |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
 [90m 2 |[39m
 [90m 3 |[39m [36mexport[39m [36minterface[39m [33mClubAnalysisResult[39m {
 [90m 4 |[39m   id[33m:[39m string[33m;[39m[0m

The export getOpenAIClient was not found in module [project]/slimy-dev/slimy-monorepo/apps/web/lib/openai-client.ts [app-route] (ecmascript).
Did you mean to import getOpenAI?
All exports of the module are statically known (It doesn't have dynamic exports). So it's known statically that the requested export doesn't exist.

Import trace:
  App Route:
    ./slimy-dev/slimy-monorepo/apps/web/lib/club/vision.ts
    ./slimy-dev/slimy-monorepo/apps/web/app/api/club/analyze/route.ts


./slimy-dev/slimy-monorepo/apps/web/lib/screenshot/analyzer.ts:1:1
Export getOpenAIClient doesn't exist in target module
[0m[31m[1m>[22m[39m[90m 1 |[39m [36mimport[39m { getOpenAIClient } [36mfrom[39m [32m'@/lib/openai-client'[39m[33m;[39m
 [90m   |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
 [90m 2 |[39m
 [90m 3 |[39m [36mexport[39m type [33mScreenshotType[39m [33m=[39m
 [90m 4 |[39m   [33m|[39m [32m'game-stats'[39m[0m

The export getOpenAIClient was not found in module [project]/slimy-dev/slimy-monorepo/apps/web/lib/openai-client.ts [app-route] (ecmascript).
Did you mean to import getOpenAI?
All exports of the module are statically known (It doesn't have dynamic exports). So it's known statically that the requested export doesn't exist.

Import trace:
  App Route:
    ./slimy-dev/slimy-monorepo/apps/web/lib/screenshot/analyzer.ts
    ./slimy-dev/slimy-monorepo/apps/web/app/api/screenshot/route.ts


./slimy-dev/slimy-monorepo/apps/web/app/api/screenshot/route.ts:4:1
Export validateImageUrl doesn't exist in target module
[0m [90m  2 |[39m [36mimport[39m { writeFile[33m,[39m mkdir } [36mfrom[39m [32m'fs/promises'[39m[33m;[39m
 [90m  3 |[39m [36mimport[39m { join } [36mfrom[39m [32m'path'[39m[33m;[39m
[31m[1m>[22m[39m[90m  4 |[39m [36mimport[39m {
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m>[22m[39m[90m  5 |[39m   analyzeScreenshot[33m,[39m
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m>[22m[39m[90m  6 |[39m   analyzeScreenshots[33m,[39m
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m>[22m[39m[90m  7 |[39m   validateImageUrl[33m,[39m
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m>[22m[39m[90m  8 |[39m   type [33mScreenshotAnalysisResult[39m[33m,[39m
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m>[22m[39m[90m  9 |[39m   type [33mScreenshotType[39m[33m,[39m
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m>[22m[39m[90m 10 |[39m   isValidScreenshotType
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m>[22m[39m[90m 11 |[39m } [36mfrom[39m [32m'@/lib/screenshot/analyzer'[39m[33m;[39m
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
 [90m 12 |[39m
 [90m 13 |[39m [90m// TODO: Import database client when implemented[39m
 [90m 14 |[39m [90m// import { screenshotDatabase } from '@/lib/screenshot/database';[39m[0m

The export validateImageUrl was not found in module [project]/slimy-dev/slimy-monorepo/apps/web/lib/screenshot/analyzer.ts [app-route] (ecmascript).
Did you mean to import calculateConfidence?
All exports of the module are statically known (It doesn't have dynamic exports). So it's known statically that the requested export doesn't exist.


    at <unknown> (./slimy-dev/slimy-monorepo/apps/web/app/public-stats/[guildId]/page.tsx:13:23)
    at <unknown> (./slimy-dev/slimy-monorepo/apps/web/hooks/use-chat.ts:231:7)
    at <unknown> (./slimy-dev/slimy-monorepo/apps/web/app/docs/[slug]/page.tsx:1:1)
    at <unknown> (https://nextjs.org/docs/messages/module-not-found)
    at <unknown> (./slimy-dev/slimy-monorepo/apps/web/lib/feature-flags.ts:6:1)
    at <unknown> (https://nextjs.org/docs/messages/module-not-found)
    at <unknown> (./slimy-dev/slimy-monorepo/apps/web/components/screenshot/Viewer.tsx:8:1)
    at <unknown> (./slimy-dev/slimy-monorepo/apps/web/components/screenshot/Viewer.tsx:8:1)
    at <unknown> (./slimy-dev/slimy-monorepo/apps/web/lib/club/vision.ts:1:1)
    at <unknown> (./slimy-dev/slimy-monorepo/apps/web/lib/screenshot/analyzer.ts:1:1)
    at <unknown> (./slimy-dev/slimy-monorepo/apps/web/app/api/screenshot/route.ts:4:1)
/home/mint/slimy-dev/slimy-monorepo/apps/web:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @slimy/web@0.1.0 build: `next build`
Exit status 1

---
Attempt 2 - corepack pnpm --filter @slimy/web run build

TypeScript failed while type-checking `/app/api/user/preferences/route.ts`:
Type 'APIHandler' is not assignable to Next's expected route handler signature because the wrapped context type required `Record<string, string>` but Next now provides `{ params: Promise<{}> }`.

Full command output excerpt:
```
Type error: Type 'typeof import("/home/mint/slimy-dev/slimy-monorepo/apps/web/app/api/user/preferences/route")' does not satisfy the constraint 'RouteHandlerConfig<"/api/user/preferences">'.
  Types of property 'GET' are incompatible.
    Type 'APIHandler' is not assignable to type '(request: NextRequest, context: { params: Promise<{}>; }) => void | Response | Promise<void | Response>'.
```

---
Attempt 3 - corepack pnpm --filter @slimy/web run build

Compilation stopped because `/app/api/chat/conversations/route.ts` imported `requireAuth` from `@/lib/auth/context`, but that module never exported the helper. TypeScript raised:
```
Type error: Module '"@/lib/auth/context"' has no exported member 'requireAuth'.
```

---
Attempt 4 - corepack pnpm --filter @slimy/web run build

TypeScript flagged `/app/api/chat/messages/route.ts` because `apiClient.get` returns `unknown`, so accessing `response.data.messages` fails to type-check.
```
./app/api/chat/messages/route.ts:27:42
Type error: 'response.data' is of type 'unknown'.
```

---
Attempt 5 - corepack pnpm --filter @slimy/web run build

`/app/api/club/export/route.ts` references `exportData.spreadsheetId`, but the mocked `exportData` object does not include that property, so TypeScript halted:
```
./app/api/club/export/route.ts:81:76
Type error: Property 'spreadsheetId' does not exist on type '{ guildId: any; exportedAt: string; sections: ... }'.
```

---
Attempt 6 - corepack pnpm --filter @slimy/web run build

`/app/api/guilds/[id]/members/[userId]/route.ts` imports `{ auth }` from `@/lib/auth`, but that module only re-exports context/types and doesn't expose an `auth` helper.
```
./app/api/guilds/[id]/members/[userId]/route.ts:3:10
Type error: Module '"@/lib/auth"' has no exported member 'auth'.
```

---
Attempt 7 - corepack pnpm --filter @slimy/web run build

Another guild members route (`/app/api/guilds/[id]/members/bulk/route.ts`) also attempted to import `{ auth }` from `@/lib/auth`, which doesn't exist.
```
./app/api/guilds/[id]/members/bulk/route.ts:3:10
Type error: Module '"@/lib/auth"' has no exported member 'auth'.
```

---
Attempt 8 - corepack pnpm --filter @slimy/web run build

Yet another guild members route (`/app/api/guilds/[id]/members/route.ts`) imported the non-existent `{ auth }` helper from `@/lib/auth`.
```
./app/api/guilds/[id]/members/route.ts:3:10
Type error: Module '"@/lib/auth"' has no exported member 'auth'.
```

---
Attempt 9 - corepack pnpm --filter @slimy/web run build

The base guild route (`/app/api/guilds/[id]/route.ts`) also imported `auth` from `@/lib/auth`, triggering the same type error.
```
./app/api/guilds/[id]/route.ts:3:10
Type error: Module '"@/lib/auth"' has no exported member 'auth'.
```

---
Attempt 10 - corepack pnpm --filter @slimy/web run build

The collection route (`/app/api/guilds/route.ts`) still referenced the nonexistent `auth` helper from `@/lib/auth`.
```
./app/api/guilds/route.ts:3:10
Type error: Module '"@/lib/auth"' has no exported member 'auth'.
```

---
Attempt 11 - corepack pnpm --filter @slimy/web run build

Compilation now fails because `components/ask-manus-bar.tsx` imports `ChatAction` and `ChatResponse` from `@/lib/chat-actions`, but that module is missing in the imported project:
```
./components/ask-manus-bar.tsx:7:42
Type error: Cannot find module '@/lib/chat-actions' or its corresponding type declarations.
```

---
Attempt 12 - corepack pnpm --filter @slimy/web run build

`components/chat/MessageList.tsx` imports `formatDistanceToNow` from `date-fns`, but that dependency is missing from `package.json`.
```
./components/chat/MessageList.tsx:8:37
Type error: Cannot find module 'date-fns' or its corresponding type declarations.
```

---
Attempt 13 - corepack pnpm --filter @slimy/web run build

TypeScript now complains about the helper in `components/lazy/index.ts`: the dynamic `import('../analytics/Dashboard')` returns a module, not `{ default: ComponentType }`.
```
./components/lazy/index.ts:5:9
Type error: Type 'Promise<typeof import("../analytics/Dashboard")>' is not assignable to type 'Promise<{ default: ComponentType<any>; }>'.
```

---
Attempt 14 - corepack pnpm --filter @slimy/web run build

Lazy route exports in `components/lazy/routes.ts` now cause a similar issue (dynamic imports of app routes don't satisfy the expected `{ default: ComponentType }`).
```
./components/lazy/routes.ts:10:9
Type error: Type 'Promise<typeof import("../../app/docs/page")>' is not assignable to type 'Promise<{ default: ComponentType<any>; }>'.
```

---
Attempt 15 - corepack pnpm --filter @slimy/web run build

`lib/api-error-handler.ts` accesses `error.errors`, but the current `ZodError` type no longer exposes that property directly.
```
./lib/api-error-handler.ts:33:24
Type error: Property 'errors' does not exist on type 'ZodError<unknown>'.
```

---
Attempt 16 - corepack pnpm --filter @slimy/web run build

`lib/api-proxy.ts` calls `adminApiClient.request` with three arguments, but that helper only expects one or two.
```
./lib/api-proxy.ts:62:54
Type error: Expected 1-2 arguments, but got 3.
```

---
Attempt 17 - corepack pnpm --filter @slimy/web run build

`lib/api/admin-client.ts` already declares `ApiError`, `ApiSuccess`, and `ApiResponse`, so the `export type { ... }` at the bottom conflicts with those declarations.
```
./lib/api/admin-client.ts:338:15
Type error: Export declaration conflicts with exported declaration of 'ApiError'.
```

---
Attempt 18 - corepack pnpm --filter @slimy/web run build

`lib/audit-log.ts` casts to a generic `T` that is never declared.
```
./lib/audit-log.ts:330:11
Type error: Cannot find name 'T'.
```

---
Attempt 19 - corepack pnpm --filter @slimy/web run build

`redis` client options changed; `lazyConnect` is not a valid `RedisSocketOptions` property anymore.
```
./lib/cache/redis.ts:69:11
Type error: Object literal may only specify known properties, and 'lazyConnect' does not exist in type 'RedisSocketOptions'.
```

---
Attempt 20 - corepack pnpm --filter @slimy/web run build

`lib/cdn.ts` iterates over `CDN_ASSET_TYPES`, but TypeScript infers `config.extensions` as `never[]`, so `.includes(extension)` complains about `string` argument.
```
./lib/cdn.ts:87:36
Type error: Argument of type 'string' is not assignable to parameter of type 'never'.
```

---
Attempt 21 - corepack pnpm --filter @slimy/web run build

OpenAI's SDK now returns a different stream type, so `lib/chat/openai.ts` assigning it to `ReadableStream` fails.
```
./lib/chat/openai.ts:95:5
Type error: Type 'Stream<ChatCompletionChunk> & {...}' is missing properties from type 'ReadableStream<any>'.
```

---
Attempt 22 - corepack pnpm --filter @slimy/web run build

`lib/chat/storage.ts` calls `createConversation(userId, title, ...)`, but `title` can be `null`, while the method expects `string | undefined`.
```
./lib/chat/storage.ts:205:9
Type error: Argument of type 'string | null' is not assignable to parameter of type 'string | undefined'.
```

---
Attempt 23 - corepack pnpm --filter @slimy/web run build

`lib/codes/cache.ts` uses the same deprecated Redis `lazyConnect` option.
```
./lib/codes/cache.ts:69:11
Type error: Object literal may only specify known properties, and 'lazyConnect' does not exist in type 'RedisSocketOptions'.
```

---
Attempt 24 - corepack pnpm --filter @slimy/web run build

`CodeSource.getMetadata` expects optional string fields, but `lib/codes/sources/reddit.ts` returns `lastSuccessfulFetch: string | null`.
```
./lib/codes/sources/reddit.ts:286:3
Type error: Property 'getMetadata' ... Type 'string | null' is not assignable to type 'string | undefined'.
```

---
Attempt 25 - corepack pnpm --filter @slimy/web run build

`lib/codes/sources/reddit.ts` references `SourceFactory` but never imports/declares it.
```
./lib/codes/sources/reddit.ts:303:34
Type error: Cannot find name 'SourceFactory'.
```

---
Attempt 26 - corepack pnpm --filter @slimy/web run build

`SnelpSource.getMetadata()` also returns `string | null` for `lastSuccessfulFetch`, so the aggregator can't treat it as `CodeSource`.
```
./lib/codes-aggregator.ts:116:31
Type error: ... Type 'string | null' is not assignable to type 'string | undefined'.
```

---
Attempt 27 - corepack pnpm --filter @slimy/web run build

`lib/db.ts` imports `PrismaClient` from `@prisma/client`, but the package version bundled with Next 16 exposes the client via the default export instead.
```
./lib/db.ts:7:10
Type error: Module '"@prisma/client"' has no exported member 'PrismaClient'.
```

---
Attempt 28 - corepack pnpm --filter @slimy/web run build

`lib/env.ts` also expects `ZodError.errors`, which is now `issues`.
```
./lib/env.ts:66:33
Type error: Property 'errors' does not exist on type 'ZodError<unknown>'.
```

---
Attempt 29 - corepack pnpm --filter @slimy/web run build

`lib/lazy.tsx` passes a component (`LoadingSpinner`) to Next's `dynamic` loader option, but Next 16 expects a function signature. 
```
./lib/lazy.tsx:55:5
Type error: Type 'ComponentType<any> | ...' is not assignable to type '(loadingProps) => ReactNode'.
```

---
Attempt 30 - corepack pnpm --filter @slimy/web run build

After wrapping the dynamic loader, TypeScript now complains because Next passes `{ error, isLoading, ... }` props to the loading component, which don't match the spinner props.
```
./lib/lazy.tsx:57:21
Type error: Type '{ error?: Error | null | undefined; ... }' has no properties in common with type '{ size?: ... }'.
```

---
Attempt 31 - corepack pnpm --filter @slimy/web run build

`next/dynamic` in Next 16 no longer accepts a `suspense` option, so `lib/lazy.tsx` must drop that property.
```
./lib/lazy.tsx:60:5
Type error: Object literal may only specify known properties, and 'suspense' ...
```

---
Attempt 32 - corepack pnpm --filter @slimy/web run build

`lib/monitoring/alerting.ts` passes a plain metadata object to `logger`, but the signature expects an `Error & JSONObject`.
```
./lib/monitoring/alerting.ts:171:7
Type error: Argument of type 'JSONObject | undefined' is not assignable to parameter of type '(Error & JSONObject) | undefined'.
```

---
Attempt 33 - corepack pnpm --filter @slimy/web run build

Alert filter logic now needs explicit undefined checks due to stricter TS.
```
./lib/monitoring/alerting.ts:226:56
Type error: 'filters.since' is possibly 'undefined'.
```

---
Attempt 34 - corepack pnpm --filter @slimy/web run build

Alert metadata also includes optional values, so `JSONValue` needs explicit `null` fallback before passing to the logger.
```
./lib/monitoring/alerting.ts:301:31
Type error: Type 'string | undefined' is not assignable to type 'JSONValue'.
```

---
Attempt 35 - corepack pnpm --filter @slimy/web run build

APM trace metadata can be undefined, which is not a valid `JSONValue`.
```
./lib/monitoring/apm.ts:116:9
Type error: Type 'JSONObject | undefined' is not assignable to type 'JSONValue'.
```

---
Attempt 36 - corepack pnpm --filter @slimy/web run build

Another span log uses optional metadata, again violating `JSONValue`.
```
./lib/monitoring/apm.ts:175:9
Type error: Type 'JSONObject | undefined' is not assignable to type 'JSONValue'.
```

---
Attempt 37 - corepack pnpm --filter @slimy/web run build

`web-vitals@5` replaced `onFID` with `onDCL`. The new API exports `onCLS`, `onINP`, `onTTFB`, etc. The monitor still references the deprecated hook.
```
./lib/monitoring/web-vitals.ts:110:39
Type error: Property 'onFID' does not exist on type 'typeof import("web-vitals")'.
```

---
Attempt 38 - corepack pnpm --filter @slimy/web run build

`CacheHelper` no longer exposes a `.ttl()` helper, but `lib/security/ddos-protection.ts` still tries to call it.
```
./lib/security/ddos-protection.ts:294:35
Type error: Property 'ttl' does not exist on type 'CacheHelper'.
```

---
Attempt 39 - corepack pnpm --filter @slimy/web run build

Next.js 16 removed `experimental.swcMinify`, so `next.config.ts` needs to drop it.
```
./next.config.ts:116:5
Type error: ... 'swcMinify' does not exist in type 'ExperimentalConfig'.
```

---
Attempt 40 - corepack pnpm --filter @slimy/web run build

The bundle size script destructures `manifest.pages` entries as `string[]`, but Next 16 types page values as `unknown`, so the destructuring must assert the type more carefully.
```
./scripts/check-bundle-size.ts:44:44
Type error: ... 'unknown' is not assignable to type 'string[]'.
```
