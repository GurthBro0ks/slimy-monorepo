# RUNBOOK: Snail Timeline

## Deployment Steps

### 1. Pre-Deployment

```bash
# Verify data file exists
ls -la data/snail-events.json

# Build and verify
pnpm build
```

### 2. Deploy

```bash
# Deploy code changes
git push origin main
```

### 3. Post-Deployment Verification

1. **Verify API:**
   ```bash
   # Test history endpoint
   curl https://your-domain.com/api/snail/history
   # Expected: JSON array of events, sorted by timestamp descending.
   ```

2. **Verify UI:**
   - Navigate to `/snail`.
   - The **Snail Timeline** section should be visible on the dashboard.
   - Events should be displayed chronologically (newest at the top).

3. **Verify Data Limit:**
   - Ensure the API response contains no more than 50 events.

## Metrics

### Performance
- **API Response:** <100ms (file read operation).

### Monitoring

```bash
# Check logs for errors related to snail events
docker logs slimyai-web | grep "Snail history API error"
```

## Feature Flags

None required for this feature.

## Rollback

### Quick Rollback

```bash
# Revert to previous deployment
git revert HEAD
git push origin main
```

### Manual Rollback

1. Remove `SnailTimeline` from `app/snail/page.tsx`.
2. Delete `components/snail-timeline.tsx`, `app/api/snail/history/route.ts`, and `lib/snail-events.ts`.

## Success Criteria

- ✅ Timeline component renders correctly.
- ✅ Events are fetched from the API and displayed chronologically.
- ✅ API correctly limits the number of returned events.
