# BUG: Deploy notification security hardening

- Date/host/user: `2026-01-11 / slimy-nuc2 / slimy`
- Trigger: `workflow_dispatch` on `harden/deploy-notify-and-sentinels`
- HEAD: `29d65624fc018f1cf08669dce030135e8d06efb6`

## Summary

- Deploy notification now only runs on `push` to `main` + manual dispatch (no more PR exposure), ignores doc/MD-only pushes, and runs with `contents: read` least-privilege permissions.
- The Discord step validates the webhook URL (`https://(discord.com|discordapp.com)/api/webhooks/`), skips if missing/invalid, and populates `allowed_mentions.parse=[]` so no `@` pings execute.
- Added `scripts/smoke/verify-no-stray-artifacts.sh` to fail fast on `.php` in `apps/web/public`, any `*xmrig*` files, or unexpected `.tar.gz` blobs near the web app.
- CI now runs the sentinel as part of the Quality Checks job so repo hygiene is enforced on every push.

## Proof

- Deploy Notification run: [20896952248](https://github.com/GurthBro0ks/slimy-monorepo/actions/runs/20896952248) → `success`.
- Smoke outputs:

  ```bash
  $ bash scripts/smoke/verify-trader-isolation.sh
  OK_ISOLATED: pattern "Invite-only registration for trader.slimyai.xyz" found
  $ bash scripts/smoke/verify-no-stray-artifacts.sh
  OK_CLEAN: no stray PHP, xmrig, or tarball artifacts detected
  ```

- Note: This proof never prints secrets, and the Discord payload uses `allowed_mentions.parse=[]` so it cannot ping users/roles.
