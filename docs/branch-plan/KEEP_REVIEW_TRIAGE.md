# KEEP_REVIEW Branch Second-Pass Triage

This auto-generated report triages the 91 KEEP_REVIEW branches relative to `origin/claude/mega-foundation-dev-01J8TUvHwDPPTo8SSqE5MVbn` as of 2025-11-21 18:07 UTC.
It applies conservative heuristics to suggest which branches look ready for merge/delete follow-up versus those still requiring manual review.

Triage decision meanings:
- `TRIAGE_DELETE_SAFE_DOCS`: docs-only diff and inactive for 14+ days; likely safe to prune after a docs review.
- `TRIAGE_DELETE_SAFE_TESTS`: tests-only diff and inactive for 14+ days; re-run tests before deleting.
- `TRIAGE_MERGE_SMALL_FEATURE`: code changes that are small (<=5 commits ahead, <=20 behind) and older than 3 days; good merge candidates after review.
- `TRIAGE_KEEP_FOR_NOW`: everything else (too new, larger diffs, or unclear signal).

## Suggested Deletes (docs/tests experiments)

| Branch | Category | Age (days) | Change type | Last commit | Why suggested for delete |
| --- | --- | --- | --- | --- | --- |
| _none_ |  |  |  |  |  |

```bash
# Example delete (DO NOT RUN BLINDLY):
# git push origin --delete <branch> && git branch -D <branch>
```

## Suggested Merge Targets (small features)

| Branch | Category | ahead/behind | Age (days) | Last commit | Rough size |
| --- | --- | --- | --- | --- | --- |
| `claude/add-chat-persistence-01W6siyJX2BuYNvhPHWaHejS` | backend_admin_api | 1/15 | 4 | 91236f968 feat: add chat message persistence and history retrieval | +108, -15, 3 files |
| `claude/add-health-monitoring-01Wb7KCdqhzn8pVRKL76TPo1` | backend_admin_api | 1/15 | 4 | 255a89c46 feat(admin-api): add health monitoring and observability | +672, 10 files |
| `claude/add-prometheus-metrics-01CyEMGNmkGUptwbpBLPydJE` | backend_admin_api | 1/15 | 4 | 25f86150f feat(admin-api): add Prometheus metrics endpoint | +161, -8, 5 files |
| `claude/add-tier-slash-command-01A3hVfr8DFRz1uLbQpdgeVW` | misc_experimental | 1/15 | 4 | 62235d33d feat(bot): add Discord bot infrastructure and /tier slash command | +605, -3, 7 files |
| `claude/admin-cli-bootstrapper-018VtucPsqZjRcquPEr8Hhrg` | tools_cli | 1/15 | 4 | 3a6e333c0 feat(tools): add admin CLI bootstrapper | +500, -7, 5 files |
| `claude/discord-oauth-sessions-01YWSWByDSYihbemL6u7H7YH` | backend_admin_api | 1/15 | 4 | a613c6eb8 feat: add Discord OAuth token exchange and session storage | +261, 3 files |
| `claude/event-bus-audit-log-012JqPxkwAAALq2pUP4MjhZ4` | backend_admin_api | 1/15 | 4 | 89f220e35 feat(admin-api): implement event bus and audit log system | +18849, -4, 13 files |
| `claude/openai-rate-limit-queue-019ELxrEvnaWMvrKhdQA25uE` | backend_admin_api | 1/15 | 4 | cff555fd0 feat: Add OpenAI integration with rate limiting and streaming support | +18916, -3, 7 files |
| `claude/redis-cache-adapter-01QpgkHNZK7YjGH4fajBsmKA` | backend_admin_api | 1/15 | 4 | 845a4cb89 feat(admin-api): add Redis cache adapter with memory fallback | +885, -6, 8 files |
| `claude/screenshot-job-queue-01LfvtNQsCUWdBBTxSA9y43K` | backend_admin_api | 1/15 | 4 | 5460ecc04 feat(admin-api): implement background job queue for screenshot analysis | +545, -55, 6 files |
| `claude/setup-admin-api-server-01NdEijLLznDfRSmK5vUy25K` | backend_admin_api | 1/15 | 4 | 934664fe1 feat(admin-api): setup Express server with TypeScript | +18032, -6, 6 files |
| `claude/setup-full-stack-testing-011fHBiXNa23d8iuZ2mn3U6g` | testing_infra | 1/15 | 4 | 7fd430c84 feat: implement comprehensive full-stack testing setup | +1516, -20, 15 files |
| `claude/setup-prisma-schema-01A5sARuhJRyUfG2KgJpjoy9` | misc_experimental | 1/15 | 4 | 4c078feb7 feat(shared-db): setup Prisma schema with User, Session, and Guild models | +275, -2, 5 files |

```bash
# Example merge (review first, then run manually):
# git checkout claude/mega-foundation-dev-01J8TUvHwDPPTo8SSqE5MVbn
# git pull
# git merge --no-ff <branch>
```

## Still Needs Manual Review

- `claude/add-adr-template-01CWRh36YYhpKibe3onbpvhq` (category=docs_only, ahead/behind=1/6, age=2d) – 57c518815 docs: add ADR template and initial architecture decision records
- `claude/add-api-validation-01Xxv6VUNwEa3NvqfQvG2vXz` (category=backend_admin_api, ahead/behind=1/6, age=2d) – 1ecf6775d feat(admin-api): add input validation to critical endpoints
- `claude/add-auto-deploy-script-01JV2MrTuNLEnmLHwYnqhTXG` (category=tools_cli, ahead/behind=1/6, age=2d) – c77229d63 feat(infra): add auto-deploy script skeleton with configuration and docs
- `claude/add-config-loader-module-013dvr8yb2vRYUU9PkwFLrZP` (category=misc_experimental, ahead/behind=1/6, age=2d) – e3c3f7813 feat: add type-safe config loader module
- `claude/add-deployment-checklist-tool-01LTGSsbDME9Rpdxqm7bU7aG` (category=tools_cli, ahead/behind=1/6, age=2d) – ba0db37c1 feat: add deployment checklist generation tool
- `claude/add-discord-mock-data-019nHmSWsLqGSg8TuHLkobiH` (category=misc_experimental, ahead/behind=1/6, age=2d) – ef6ac8648 feat: add discord-mocks package for testing
- `claude/add-exec-summary-01CYjxTRazfPGTvJTNUqHXZN` (category=docs_only, ahead/behind=1/6, age=2d) – 71c8e5aa1 docs: add executive summary one-pager
- `claude/add-fixture-generator-01QiPcowvcLvijaasuWR2VpQ` (category=tools_cli, ahead/behind=1/6, age=2d) – 327efd0a2 feat(tools): add sample data/fixture generator for local demos
- `claude/add-github-templates-018gnCwxUH1nZ77iK5ew7Yru` (category=misc_experimental, ahead/behind=1/6, age=2d) – 08efa00f4 feat: add GitHub issue and PR templates
- `claude/add-health-check-script-01MK52ruEj6Q8j5BHfBo6UMY` (category=tools_cli, ahead/behind=1/6, age=2d) – 8cf705a27 feat(tools): add dev environment health check script and documentation
- `claude/add-onboarding-checklists-01AFBGHwnBMRVSBeCWrW4eig` (category=docs_only, ahead/behind=1/6, age=2d) – d8b012506 docs: add onboarding checklists for developers and admins
- `claude/add-prompt-library-docs-01DfoPn9Zm7xX9peoe1zwfHT` (category=docs_only, ahead/behind=1/6, age=2d) – bed06f61d docs: add AI prompt library and usage guide
- `claude/add-safe-debug-mode-01Q8cuvi966FUwZRQfQzSYqR` (category=backend_admin_api, ahead/behind=1/6, age=2d) – c5f305c45 feat: add safe debug mode to admin-api and bot
- `claude/add-sync-helpers-015TaWpfjj8Ro9DJBhzrxeR6` (category=infra_deploy, ahead/behind=1/6, age=2d) – 9dea61540 feat(infra): add sync helper scripts for laptop/NUC synchronization
- `claude/add-test-fixtures-library-01FpivySN368rau6c1yoeebc` (category=testing_infra, ahead/behind=1/6, age=2d) – 547187b6d feat: add test-fixtures library for reusable test data
- `claude/admin-api-type-safety-017d3UtBchDXZnC8gxC59neD` (category=backend_admin_api, ahead/behind=1/6, age=2d) – 968061fa0 feat(admin-api): add type-safe config with Zod validation
- `claude/admin-panel-copy-01SDEiFLwYPFTWua2b2jKYVD` (category=misc_experimental, ahead/behind=1/6, age=2d) – a25905f95 feat(admin-ui): add comprehensive copy for tooltips and onboarding
- `claude/admin-system-diagnostics-01Ewub1EcRMTSHHHXV52kEfr` (category=misc_experimental, ahead/behind=1/6, age=2d) – 92e88d871 feat(admin-ui): add comprehensive system diagnostics page
- `claude/api-catalog-docs-017x3U6jEbyJsMoyVS1QwtHJ` (category=docs_only, ahead/behind=1/6, age=2d) – 00a6db026 docs: add comprehensive API catalog for admin-api and web services
- `claude/backup-sources-inventory-012CkDtEgvNVezsv9EyFCMyS` (category=docs_only, ahead/behind=1/6, age=2d) – a4aa2c970 docs: add comprehensive backup inventory document
- `claude/bot-command-inventory-019rqRxwW5rC9ebArAh1mW6R` (category=docs_only, ahead/behind=1/6, age=2d) – d1be24035 docs: add comprehensive bot command inventory and future ideas
- `claude/changelog-generator-0177fwgDK7qtoZQUZH7Qxcfm` (category=tools_cli, ahead/behind=1/6, age=2d) – 2364f54d9 feat: add local changelog generator tool
- `claude/cleanup-sessions-tokens-01L9WCs5tepNTHHzTkmwmjim` (category=backend_admin_api, ahead/behind=1/6, age=2d) – f1fbe6d3f feat(admin-api): add batch-based session cleanup script
- `claude/cli-health-check-tool-01UjYynfHvHctuYHeVfwPzm1` (category=tools_cli, ahead/behind=1/6, age=2d) – 10128fd35 feat: add health dashboard CLI tool
- `claude/consolidate-infra-docs-0144jLikt7y9SJbdSs7xhKVL` (category=docs_only, ahead/behind=1/6, age=2d) – c9c3766f0 docs: consolidate infrastructure and deployment documentation
- `claude/create-ops-runbook-01VcCQSBEyxhuwymPFQeodoj` (category=docs_only, ahead/behind=1/6, age=2d) – 38404eb15 docs: add comprehensive ops runbook for Slimy platform
- `claude/create-roadmap-doc-01MVA4xDJMwpYg3XbwsB8Wu7` (category=docs_only, ahead/behind=1/6, age=2d) – 45a612894 docs: add comprehensive 30-day roadmap for slimy-monorepo
- `claude/create-scripts-index-01CLYM8VeTxj6dbFS7wgxVUr` (category=docs_only, ahead/behind=1/6, age=2d) – 4448bef0a docs: add comprehensive scripts index for monorepo tooling
- `claude/create-slimy-glossary-013yxaAXqDrNoJpCAVW3oKRn` (category=docs_only, ahead/behind=1/6, age=2d) – c859b102e docs: create comprehensive Slimy.ai glossary with domain terms and style guide
- `claude/db-migration-strategy-doc-01UAGNHKNrfqZDtK21WPibzs` (category=docs_only, ahead/behind=1/6, age=2d) – 693396da9 docs: add comprehensive MySQL to PostgreSQL migration strategy
- `claude/design-monorepo-structure-01Ve2W8GafXtKWjcJEqDWKH7` (category=infra_deploy, ahead/behind=1/6, age=2d) – 5833dc05d docs(monorepo): design and scaffold clean monorepo layout
- `claude/design-retry-strategy-01KUEXLqhWz5VskbffHLG8bA` (category=docs_only, ahead/behind=1/6, age=2d) – d04f9a557 docs: add comprehensive resilience and retry strategy design doc
- `claude/discord-message-templates-01WPTdQce4C95PokRo2qKXVM` (category=misc_experimental, ahead/behind=1/6, age=2d) – de0c4a173 feat: add Discord message templates comms kit
- `claude/discord-permissions-scopes-01G57RmSKtbY6nHsSTt1tN6d` (category=docs_only, ahead/behind=1/6, age=2d) – abd69ef9f docs: add Discord permissions and scopes documentation
- `claude/document-bootstrap-script-01FbwWUXCxFtBA24anMsGEjX` (category=tools_cli, ahead/behind=1/6, age=2d) – f88abe9ac docs: add local development bootstrap guide and example script
- `claude/document-db-schema-013Fwup4ezfSzPFoQ69ohTq2` (category=docs_only, ahead/behind=1/6, age=2d) – fdbe2a35f docs: add comprehensive admin-api database schema documentation
- `claude/document-release-process-01W31ZxCJ9vh9uZ6CiCUkJFR` (category=docs_only, ahead/behind=1/6, age=2d) – 98f13bb22 docs: add comprehensive release process documentation
- `claude/document-sqlite-local-db-01237b8riXpL3Em3QuHRerKV` (category=docs_only, ahead/behind=1/6, age=2d) – c15249d3d docs: add local development database options guide
- `claude/e2e-test-stub-config-01WB1sB4badK8hMww1oChJrV` (category=testing_infra, ahead/behind=1/6, age=2d) – 9a7cca5fa docs: add E2E test plan and stub configuration
- `claude/enhance-bot-logging-0136hcRjoivxPj8wzPKWJebx` (category=backend_admin_api, ahead/behind=1/6, age=2d) – 43cad83a5 feat(admin-api): enhance structured logging for key bot commands
- `claude/env-secrets-checklist-01HXDvpPxurr847qzGviqETe` (category=infra_deploy, ahead/behind=1/6, age=2d) – 6db8edca3 docs: add comprehensive environment variables and secrets checklist
- `claude/error-code-catalog-01Ci8KXFaoUw2VDfNyXZwMX4` (category=misc_experimental, ahead/behind=1/6, age=2d) – 8d5bec06c feat(error-catalog): add centralized error code catalog
- `claude/exec-summary-slimy-01Hex3SvSjL69ZSJgjuvAwPE` (category=docs_only, ahead/behind=1/6, age=2d) – e47ac8d7c docs: add executive summary one-pager for Slimy.ai
- `claude/feature-flags-design-01T9Rki72uzGKfvYau9ytymE` (category=misc_experimental, ahead/behind=1/6, age=2d) – b7d556953 feat(feature-flags): add feature flag system with docs and implementation
- `claude/git-dirt-watcher-design-01Vw3PW9V3jG2ApwBQuArz4H` (category=infra_deploy, ahead/behind=1/6, age=2d) – fcd7e1687 feat(infra): add Git Dirt Watcher module for monitoring uncommitted changes
- `claude/harden-admin-auth-01YUTbcGvAjBrr2f7ATQFNmF` (category=backend_admin_api, ahead/behind=1/6, age=2d) – cc8d3e105 feat(admin-api): harden auth middleware and logging
- `claude/incident-report-template-01LLGVdb832tiB8fwJbGeaK6` (category=docs_only, ahead/behind=1/6, age=2d) – 2c79b28c7 docs(ops): add incident report template
- `claude/local-reviewer-bot-01JG8Z4dgM7mpaMpE5YGf8xS` (category=tools_cli, ahead/behind=1/6, age=2d) – 715cc2f26 feat(tools): add local reviewer bot workflow
- `claude/logging-conventions-helper-01GnHDpNCcyvyEGYzk6LXSR5` (category=misc_experimental, ahead/behind=1/6, age=2d) – 85f9c4deb feat: add logging conventions and shared-logging package
- `claude/map-admin-auth-flow-014qDQP4gGXCjtMLAA8H94ph` (category=tools_cli, ahead/behind=2/6, age=2d) – 7b68bd3b2 docs(admin-auth): add diagnostics guide and integration options
- `claude/markdown-skeleton-generator-01UeWmt4UVhsMQ71pE69rmHz` (category=tools_cli, ahead/behind=1/6, age=2d) – 860395217 feat(tools): add AI task skeleton generator
- `claude/minecraft-backup-restore-docs-01NAbs7JcjPBhyE7NNF8Ymxc` (category=docs_only, ahead/behind=1/6, age=2d) – c9fadcf8d docs: add Minecraft backup and restore SOP documentation
- `claude/minecraft-status-widget-01MpkWShxB9ydAxDoApMYsvy` (category=misc_experimental, ahead/behind=1/6, age=2d) – d5e59fdf8 feat: add Minecraft status widget specification and scaffold
- `claude/mock-slime-status-api-01DeVhKXpYS3Lf2aeoVp9m1V` (category=misc_experimental, ahead/behind=1/6, age=2d) – ac6c03f4c feat(slimecraft): add isolated mock status API and dashboard UI
- `claude/monitoring-metrics-architecture-01A4PKNhf79FXpzMTCDjT6vc` (category=docs_only, ahead/behind=1/6, age=2d) – 5be93312f docs: add comprehensive monitoring and metrics architecture plan
- `claude/mysql-postgres-migration-plan-01PTjbUKwinxG9Y3dtA4BG2y` (category=docs_only, ahead/behind=1/6, age=2d) – 04673ac0b docs: add comprehensive database migration documentation
- `claude/organize-npm-scripts-01QhFgUsWbdbU4N2QeXtxYxC` (category=backend_admin_api, ahead/behind=1/6, age=2d) – 55fac1caf chore: organize and group npm/pnpm scripts across monorepo
- `claude/slimy-ux-principles-01AyvjWcUZYdk3nMivGv2WXL` (category=docs_only, ahead/behind=1/6, age=2d) – fd910752d docs(ux): add comprehensive UX design principles for Slimy platform
- `claude/snail-analysis-pipeline-docs-01BfasijsonQGQhp6RTQtpBU` (category=docs_only, ahead/behind=1/6, age=2d) – 3ee047181 docs: add comprehensive snail analysis pipeline overview
- `claude/snail-tools-ux-flow-01B7hpgQz4f6dVqbwNeMSpMz` (category=docs_only, ahead/behind=1/6, age=2d) – 76336bb44 docs: add Snail Tools UX flows and state management documentation
- `claude/standardize-admin-api-errors-01DUML4HqCmpNpynwQqkf9X8` (category=backend_admin_api, ahead/behind=1/6, age=2d) – 93f291360 feat(admin-api): standardize error response format across all endpoints
- `claude/admin-api-type-safety-01PBcjXgk1nzjP2D4PRKHNDE` (category=backend_admin_api, ahead/behind=1/1, age=1d) – a54d4991d feat(admin-api): add type safety and robust DB fallback handling
- `claude/agent-6-01YBwcM5y5jumXhTSH3p66b8` (category=docs_only, ahead/behind=1/1, age=1d) – 499cf48dc docs(agent-6): Docker & NUC infrastructure analysis and documentation
- `claude/agent-7-consolidate-docs-01VCYx8cCB75T7D8e6DvPLyd` (category=docs_only, ahead/behind=1/1, age=1d) – ea47a0553 docs: consolidate and organize documentation structure (Agent 7)
- `claude/scaffold-runtime-collector-01PJk7mz3eGbWePAhZ6szFdJ` (category=misc_experimental, ahead/behind=1/1, age=1d) – 2da505e1f feat(opps-runtime): create runtime/collector scaffold with stub implementations
- `claude/scan-repo-structure-01URFXMZ5uaMfB85a8nSiQoS` (category=docs_only, ahead/behind=1/1, age=1d) – ce938b46b feat(docs): add Agent 1 scan report and status tracking
- `claude/add-analytics-layer-017NyXRHcVY3Yd5miQ5cchrP` (category=misc_experimental, ahead/behind=1/1, age=0d) – 24cf5d133 feat: add user history & analytics layer to opps-runtime
- `claude/add-skill-investment-module-01JJ5ZbBEMBZDrZixsM5yqzL` (category=misc_experimental, ahead/behind=1/1, age=0d) – 4fd3cbcd0 feat(experimental): add Skill Investment module to opps stack
- `claude/add-subscription-trim-module-01Y883xNzrwUYSQGGEZp8k8h` (category=tools_cli, ahead/behind=1/1, age=0d) – f93b43eb5 feat(experimental): add Subscription Trim module for cost optimization
- `claude/add-tasks-module-019RCmWTipcYdJXXEo6Qx8jB` (category=misc_experimental, ahead/behind=1/1, age=0d) – 56d5f8f4c feat(experimental): add Time-for-Money Tasks module to opps stack
- `claude/add-usage-summary-endpoint-0192XJf7JMyezurz51tKsHHr` (category=backend_admin_api, ahead/behind=1/1, age=0d) – 438d63c8c feat(admin-api): add global usage summary endpoint
- `claude/admin-api-test-spine-01CZgJQhnTYQxFvrP7u14EPa` (category=backend_admin_api, ahead/behind=1/1, age=0d) – d4ae12ced test(admin-api): Phase 5 – add smoke tests for health, club analytics, and audit logging
- `claude/admin-api-tests-runnable-01LPLzzM8NTYezcPWnhTMPTQ` (category=backend_admin_api, ahead/behind=2/1, age=0d) – ce4ffad24 chore(admin-api): add coverage directory to .gitignore
- `claude/ai-integration-contracts-01WdgMSXPLjhXaYau8okU3rJ` (category=misc_experimental, ahead/behind=1/1, age=0d) – 685bcfa5e feat(opps-ai): add AI integration contracts and mock implementations
- `claude/audit-logging-rollout-01Gnj1jhHyKXYzPsRMKDjscR` (category=backend_admin_api, ahead/behind=1/1, age=0d) – 7109bd06f feat(audit-log): Phase 3.2 – instrument key admin actions
- `claude/discord-integration-stubs-017DH2TziEuo5rRC6UxoYURT` (category=misc_experimental, ahead/behind=1/1, age=0d) – 0ffaebab2 feat(discord): add opps-api Discord integration stubs
- `claude/improve-mock-collector-data-01U7jMHENaaCvM7LuQnaHn6t` (category=misc_experimental, ahead/behind=1/1, age=0d) – 997d49c64 feat(opps): add enhanced mock collectors with realistic data
- `claude/persistence-adapters-01GXnT6NSr5SmZM6fVfZnsqe` (category=misc_experimental, ahead/behind=1/1, age=0d) – 1622e88dc feat(opps): add persistence adapter interfaces and stub implementations

