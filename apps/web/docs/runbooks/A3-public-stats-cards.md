# RUNBOOK: Public Stats Cards

## Deployment Steps

### 1. Pre-Deployment

```bash
# Run unit tests
pnpm test tests/unit/stats-scrubber.test.ts

# Build and verify
pnpm build
```

### 2. Deploy

```bash
# Deploy code changes
git push origin main
```

### 3. Post-Deployment Verification

1. **Verify Default State (Flag Off):**
   - Navigate to `/public-stats/web` (using 'web' as a mock guild ID).
   - **Expected:** Should return a 404 Not Found page (or 403 Forbidden).

2. **Enable Feature Flag:**
   - Navigate to `/admin/flags`.
   - Load `guildId: web`.
   - Enable the `publicStats` experiment flag.

3. **Verify Enabled State (Flag On):**
   - Navigate to `/public-stats/web`.
   - **Expected:** The Public Stats page should load successfully, showing scrubbed data.

4. **Verify OG Image:**
   ```bash
   # Test OG image endpoint
   curl -I https://your-domain.com/api/og/stats?guildId=web
   # Expected: Content-Type: image/png
   ```
   - Use a social media debugger (like Twitter Card Validator) to check the image preview for `/public-stats/web`.

5. **Verify PII Scrubbing:**
   - On the `/public-stats/web` page, ensure no user names, user IDs, or other PII are visible. Only guild-level data should be displayed.

## Metrics

### Performance
- **OG Image Generation:** Should be fast (edge runtime).

### Monitoring

```bash
# Check logs for errors related to stats or OG image generation
docker logs slimyai-web | grep "stats-scrubber"
docker logs slimyai-web | grep "og/stats"
```

## Feature Flags

| Flag | Default | Description |
| :--- | :--- | :--- |
| `experiments.publicStats` | `false` | Enables the public, PII-scrubbed stats page. |

## Rollback

### Quick Rollback

```bash
# Revert to previous deployment
git revert HEAD
git push origin main
```

### Manual Rollback

1. Remove new files: `app/public-stats/[guildId]/page.tsx`, `app/api/og/stats/route.tsx`, `app/api/guilds/[id]/settings/route.ts`, `lib/stats-scrubber.ts`, and the unit test.

## Success Criteria

- ✅ Public stats page is controlled by the `publicStats` feature flag.
- ✅ OG image is generated successfully.
- ✅ PII is correctly scrubbed from public data.
- ✅ Unit tests pass.
