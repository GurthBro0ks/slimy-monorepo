# RUNBOOK: Codes Hub v2

## Deployment Steps

### 1. Pre-Deployment

```bash
# Run tests
pnpm test tests/unit/codes-aggregator.test.ts

# Build and verify
pnpm build

# Check reports directory exists
mkdir -p data/reports
```

### 2. Deploy

```bash
# Deploy to production
git push origin main

# Or with Docker
docker build -t slimyai-web .
docker run -p 3000:3000 slimyai-web
```

### 3. Post-Deployment Verification

```bash
# Test codes endpoint
curl https://your-domain.com/api/codes?scope=active

# Test report endpoint
curl -X POST https://your-domain.com/api/codes/report \
  -H "Content-Type: application/json" \
  -d '{"code":"TEST123","reason":"dead","guildId":"test","userId":"test"}'

# Verify report was logged
ls -la data/reports/
```

### 4. Verify UI

1. Navigate to `/snail/codes`
2. Verify codes load in <200ms (check Network tab)
3. Test search box filters codes
4. Test "Copy All" button
5. Test "Report Dead" button
6. Test offline copy (disconnect network, try copy)

## Metrics

### Performance
- **Load time:** <200ms (warm cache)
- **Search latency:** <50ms (client-side)
- **API response:** <100ms (cached)

### Monitoring

```bash
# Check report logs
tail -f data/reports/$(date +%Y-%m-%d).jsonl

# Check API logs
docker logs slimyai-web | grep "Codes aggregation"
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

1. Remove search box from UI
2. Disable report endpoint
3. Restore original codes API

```bash
# Restore previous version
git checkout <previous-commit> app/snail/codes/page.tsx
git checkout <previous-commit> app/api/codes/route.ts
rm app/api/codes/report/route.ts
git commit -m "rollback: revert codes hub v2"
git push origin main
```

## Troubleshooting

### Codes not loading

**Symptom:** Empty codes list or loading forever

**Diagnosis:**
```bash
# Check API response
curl https://your-domain.com/api/codes?scope=active

# Check logs
docker logs slimyai-web | grep "Codes aggregation error"
```

**Fix:**
- Verify `NEXT_PUBLIC_SNELP_CODES_URL` is set
- Check Reddit API rate limits
- Clear cache and retry

### Search not working

**Symptom:** Search box doesn't filter codes

**Diagnosis:**
- Open browser console
- Type in search box
- Check for JavaScript errors

**Fix:**
- Verify `filteredCodes` state updates
- Check search query normalization
- Clear browser cache

### Report button not working

**Symptom:** "Report Dead" button doesn't respond

**Diagnosis:**
```bash
# Check report endpoint
curl -X POST https://your-domain.com/api/codes/report \
  -H "Content-Type: application/json" \
  -d '{"code":"TEST","reason":"dead"}'

# Check reports directory
ls -la data/reports/
```

**Fix:**
- Verify `data/reports/` directory exists and is writable
- Check API logs for errors
- Verify request payload is valid JSON

### Copy button fails offline

**Symptom:** Copy button doesn't work when offline

**Diagnosis:**
- Disconnect network
- Try copying
- Check browser console for errors

**Fix:**
- Verify `navigator.clipboard` is available
- Check fallback textarea method
- Ensure HTTPS (required for clipboard API)

## Data

### Report Logs

Location: `data/reports/YYYY-MM-DD.jsonl`

Format:
```json
{"code":"DEAD123","reason":"dead","guildId":"123","userId":"456","timestamp":"2024-10-29T12:00:00Z","ip":"1.2.3.4"}
```

### Cleanup

```bash
# Archive old reports (keep last 30 days)
find data/reports/ -name "*.jsonl" -mtime +30 -exec gzip {} \;

# Delete archived reports (keep last 90 days)
find data/reports/ -name "*.jsonl.gz" -mtime +90 -delete
```

## Success Criteria

- ✅ Codes load in <200ms (warm)
- ✅ Search filters instantly (<50ms)
- ✅ Copy works offline
- ✅ Reports logged with all required fields
- ✅ No errors in production logs
- ✅ Zero downtime deployment

## Contacts

- **On-call:** Check team rotation
- **Escalation:** Product team
- **Documentation:** `/docs/snail-tools`
