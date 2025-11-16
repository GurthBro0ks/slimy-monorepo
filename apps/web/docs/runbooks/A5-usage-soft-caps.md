# RUNBOOK: Usage Soft Caps

## Deployment Steps

### 1. Pre-Deployment

```bash
# Run unit tests
pnpm test tests/unit/usage-thresholds.test.ts

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
   # Test mock usage endpoint
   curl https://your-domain.com/api/usage
   # Expected: JSON with level: "pro", modelProbeStatus: "soft_cap"
   ```

2. **Verify UI:**
   - Navigate to the homepage (`/`)
   - Check the header for the **Usage Badge**
   - The badge should display **Pro Tier** and have a tooltip showing current spend and status.
   - The badge should automatically refresh every 30 seconds.

## Metrics

### Performance
- **API Response:** <50ms (mocked edge function)
- **UI Load:** Badge should load with minimal delay.

### Monitoring

```bash
# Check API logs
docker logs slimyai-web | grep "Usage API error"
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

1. Remove `UsageBadge` from `components/layout/header.tsx`.
2. Delete `components/usage-badge.tsx`, `lib/usage-thresholds.ts`, and `app/api/usage/route.ts`.

## Troubleshooting

### Badge not visible

**Symptom:** Badge is missing from the header.

**Diagnosis:**
- Check `components/layout/header.tsx` for `UsageBadge` integration.
- Check browser console for errors related to `usage-badge.tsx`.

### Wrong status displayed

**Symptom:** Badge displays incorrect level or status.

**Diagnosis:**
- Check `app/api/usage/route.ts` to see if the mock data is being set correctly.
- Check `lib/usage-thresholds.ts` for correct threshold logic.

**Fix:**
- Adjust mock spend in `app/api/usage/route.ts` to simulate different scenarios for testing.
- Update `lib/usage-thresholds.ts` with real threshold values.

## Success Criteria

- ✅ Usage badge is displayed in the header.
- ✅ Tooltip shows correct spend, limit, and status.
- ✅ Unit tests pass.
- ✅ No errors in production logs.
