# Slimy Monorepo Branch Cleanup Plan

## Summary
- Canonical foundation branch: `origin/claude/mega-foundation-dev-01J8TUvHwDPPTo8SSqE5MVbn`
- Remote branches analyzed: 170
- Categories: backend_admin_api 22, core_foundation 4, docs_only 29, frontend_active 64, infra_deploy 4, misc_experimental 21, opps_profit_experimental 11, testing_infra 3, tools_cli 12
- Suggested actions: KEEP_ANCHOR 4, KEEP_ACTIVE_FRONTEND 64, KEEP_EXPERIMENTAL_QUARANTINE 11, CANDIDATE_MERGE 0, CANDIDATE_DELETE 0, KEEP_REVIEW 91

## Branches SAFE TO CONSIDER DELETING (CANDIDATE_DELETE)
No branches currently meet the conservative delete criteria.

## Branches SAFE TO MERGE into canonical (CANDIDATE_MERGE)
No merge-ready branches detected under the strict criteria.

## Anchors & Quarantined Branches
**KEEP_ANCHOR** – never delete:
- `origin/claude/mega-foundation-dev-01J8TUvHwDPPTo8SSqE5MVbn`
- `origin/claude/mega-foundation-ready-01WyF9x7yHhAjUSN41oNM2th`
- `origin/main`
- `origin/mega-foundation-working`

**KEEP_EXPERIMENTAL_QUARANTINE** – opps/profit radar work:
- `origin/claude/add-offer-safety-filter-01FRhkTmU2VQYkkaCv4HnCdB`
- `origin/claude/cli-local-radar-tool-01CWQLyg5deBi3uc5VQ9LenV`
- `origin/claude/core-offer-schema-01XehuhK7iRZqVhoBGLaujiR`
- `origin/claude/create-opps-api-service-01Mf1T5PgR5TakGzBqo1dWyY`
- `origin/claude/create-opps-api-service-01TJGkMgVFdUTAV5HEpnDiSE`
- `origin/claude/create-opps-core-library-018AxA9FJDqAUpZRdp7Rk2a3`
- `origin/claude/found-money-module-01EHh9CRH2tVZUskF6YuTTRC`
- `origin/claude/merchant-coverage-model-01C7k8o34y4aWwPCGeipSrmT`
- `origin/claude/offer-ingestion-lanes-01CiAWsBkkxhXcNhXrHguKSh`
- `origin/claude/offer-opportunity-mapper-01De8KGWTs9Vqqu3rZeFri8D`
- `origin/claude/profit-signals-agent-skeleton-017ff2BVbKwt62zMV5FZnMHt`

**KEEP_ACTIVE_FRONTEND** – current web/frontend WIP:
- `origin/claude/add-analytics-events-01GtV52aXoZL1yY1eoyBsiqm`
- `origin/claude/add-club-dashboard-01LejKVypL1y9ziV1mC6Etna`
- `origin/claude/add-contribution-guidelines-01PQXkVWRrUJz5QUKxm1e6sC`
- `origin/claude/add-data-caching-017QB6f2mxqFz2USJfkVPg4W`
- `origin/claude/add-developer-docs-014i2qT7CTp9LNpzXzen4orD`
- `origin/claude/add-e2e-tests-01GScYYvW4EgWg49d6XPLpBZ`
- `origin/claude/add-error-boundaries-01MvXFCFvL6KN8QzAgocdr54`
- `origin/claude/add-loading-skeletons-01KKZKhT2Xohoch16h4tjPU3`
- `origin/claude/add-shared-result-type-01HPus7e7Xqc6NTR2QSWUgHa`
- `origin/claude/add-updates-notices-01CW7gyHsrgUmaosG1Bum8sJ`
- `origin/claude/admin-cli-bootstrap-01NgMsWhXq5QMangoDLqHNyL`
- `origin/claude/ai-usage-guide-0174dwR2ZqaiUPQJdYLDMJLr`
- `origin/claude/api-gateway-layer-01GKWpXVWy8bn8nTwbmXYxgs`
- `origin/claude/auth-rbac-implementation-012Meoy8C8cZoPrn2Xbh7VqU`
- `origin/claude/build-api-client-module-01P4kYYCNHJmDkpLmVo9uXoS`
- `origin/claude/centralize-audit-logging-01GTepJLqYSSYrz6MG55f2Lv`
- `origin/claude/cleanup-club-analytics-01Fz4VSQDAZSaMDUVG2CrdvZ`
- `origin/claude/cleanup-deprecated-prisma-models-01RDrQJ6Zy9gDXNFHjVxCTPU`
- `origin/claude/club-analytics-first-pass-01UsFZRsyE5geSUAaR3JUCw3`
- `origin/claude/club-analytics-v2-01WjM3fVSN6nMS6REsQvF1CA`
- `origin/claude/create-page-shell-layout-01H4sEbX13tayPszq97AMVcs`
- `origin/claude/create-slimy-ui-scaffold-01BDVEpC6dByGCPUC4rkGLLK`
- `origin/claude/data-export-backup-01RYBcRXx6PyE1oqphkhHMJU`
- `origin/claude/discord-guild-sync-01Mip16vgz5qcv3b41PjfHtG`
- `origin/claude/discord-guild-sync-01UWh9xJt6ZGZtA98t5uQECC`
- `origin/claude/docker-deploy-reliability-01HwHbtRtny6uiTc5Qp8fi6y`
- `origin/claude/draft-front-door-dashboard-017yAifioAEAWHWY8bSfVyxP`
- `origin/claude/fix-club-analytics-stability-01DeLSDv98mJigJ2TztPRLCX`
- `origin/claude/guild-config-feature-flags-01SzDQQbn2uq1sPpWH6HsGpc`
- `origin/claude/harden-file-upload-safety-01Cs7U9R8Mu35mH3ETjArgwA`
- `origin/claude/implement-chat-feature-014QgfZjJD8RrPeJWB3EjSct`
- `origin/claude/implement-chat-feature-01TLpXnHWHgHFoVuAKyoHZyS`
- `origin/claude/implement-http-client-01Qr4vTRRRzuZT8f5Jq4S6bk`
- `origin/claude/implement-seasons-system-01XKYVi9wiwqeP3iS3NCyFJx`
- `origin/claude/implement-shared-layout-01CU1KrhqAdk5Q2J427FAtKM`
- `origin/claude/improve-http-wrapper-01WgMZEsUXLiopgtwxsgF51Z`
- `origin/claude/market-opportunity-module-017kY9WoybvLNDtHj7CTwEBx`
- `origin/claude/mega-integration-all-branches-01CDmjCR8yPcfsYxpvGB27DT`
- `origin/claude/multi-agent-orchestration-01AL1weWGWAHRDFoUrZSDsJq`
- `origin/claude/notification-system-first-pass-015pjC8NoEmwdJJkwWqveCt1`
- `origin/claude/refine-opps-ui-01XxYH57yK1jpPh6GXqgvssG`
- `origin/claude/screenshot-analysis-feature-01ATXWSJzj3GpMUkddCSiAAe`
- `origin/claude/screenshot-analysis-pipeline-01L1ihwkr9CSy1tPWyLfD2Xk`
- `origin/claude/setup-monorepo-dev-017fMKdDcKuqUSiH9FKCVQGn`
- `origin/claude/setup-shared-components-01Ht1Ue7EQvE81jQvxRYru6X`
- `origin/claude/slime-craft-labs-page-01NUAuZA116xgEnZHM2YZz76`
- `origin/claude/slimecraft-microsite-01Ubv1BNQMxH3oYR7QFhTXAL`
- `origin/claude/slimecraft-ops-dashboard-013FYzfzNdq1umQBogKZ3BPY`
- `origin/claude/slimecraft-player-directory-01DpgZFX9Gr8bAAvWD5ndZUJ`
- `origin/claude/stabilize-core-apps-01T1gLZzZBd96KpGN5WhUuci`
- `origin/claude/standardize-timezone-handling-01X5TvrHsBK88MkZyv7oMM7n`
- `origin/claude/stats-tracking-system-01VoUa6j84W8kvLFbWXbnwJF`
- `origin/claude/tier-calculator-setup-01V2Y7ovGMbP2cQpkLNE3UpP`
- `origin/claude/typed-http-client-01BNjPshnKmZS4ntG8Mmr1ac`
- `origin/claude/typed-http-client-01Lnkv3awRwsdCehRA77NQZ9`
- `origin/claude/typed-http-client-api-01VY9AvVtdNwGzaotTHSr4Sb`
- `origin/claude/unify-base-url-config-011grH7Kdijd2fZRjr85uUZH`
- `origin/claude/unify-connection-badge-status-01QPFzZ5XnTeXUacUvvwxrdf`
- `origin/claude/user-profiles-saved-prompts-01BpRR4Ff3QeRRVBBpkADGd4`
- `origin/claude/web-usage-page-014E4FJBwbPg3sYXYwFHzsFa`
- `origin/claude/webhooks-outbound-integrations-01T8sANu1pnv1K93i12phWZj`
- `origin/claude/weekly-club-report-01PDET1i9GwpKkkFth1LohfE`
- `origin/claude/wire-api-web-01GwHHY8PUiStZGWhyApv1P4`
- `origin/feature/opps-radar-v1`

## Review Queue (KEEP_REVIEW)
These branches still require human triage before merge or delete. Spot-check a few at a time.
- `origin/claude/add-adr-template-01CWRh36YYhpKibe3onbpvhq` (docs_only, ahead 1, behind 6)
- `origin/claude/add-analytics-layer-017NyXRHcVY3Yd5miQ5cchrP` (misc_experimental, ahead 1, behind 1)
- `origin/claude/add-api-validation-01Xxv6VUNwEa3NvqfQvG2vXz` (backend_admin_api, ahead 1, behind 6)
- `origin/claude/add-auto-deploy-script-01JV2MrTuNLEnmLHwYnqhTXG` (tools_cli, ahead 1, behind 6)
- `origin/claude/add-chat-persistence-01W6siyJX2BuYNvhPHWaHejS` (backend_admin_api, ahead 1, behind 15)
- `origin/claude/add-config-loader-module-013dvr8yb2vRYUU9PkwFLrZP` (misc_experimental, ahead 1, behind 6)
- `origin/claude/add-deployment-checklist-tool-01LTGSsbDME9Rpdxqm7bU7aG` (tools_cli, ahead 1, behind 6)
- `origin/claude/add-discord-mock-data-019nHmSWsLqGSg8TuHLkobiH` (misc_experimental, ahead 1, behind 6)
- `origin/claude/add-exec-summary-01CYjxTRazfPGTvJTNUqHXZN` (docs_only, ahead 1, behind 6)
- `origin/claude/add-fixture-generator-01QiPcowvcLvijaasuWR2VpQ` (tools_cli, ahead 1, behind 6)
- ... plus 81 more KEEP_REVIEW branches
