# RUNBOOK: Ask Manus Bar

## Deployment Steps

### 1. Pre-Deployment

```bash
# Run unit tests
pnpm test tests/unit/rate-limiter.test.ts

# Build and verify
pnpm build
```

### 2. Deploy

```bash
# Deploy code changes
git push origin main
```

### 3. Post-Deployment Verification

1. **Enable Feature Flag (Initial Test):**
   - Navigate to `/admin/flags` (or equivalent admin panel).
   - Load a test `guildId` (e.g., `web`).
   - Enable the `askManus` experiment flag.

2. **Verify UI:**
   - Navigate to `/snail` or `/club`.
   - The **Ask Manus** sticky bar should be visible at the bottom right.
   - Click the icon to open the chat window.

3. **Test Chat Functionality:**
   - Enter "code" in the chat box.
   - Expected: A response with a "Copy Code: SLIMYAI2024" button and a "Go to Codes Hub" link.
   - Click the "Copy Code" button. A "Copied to clipboard!" notification should appear.
   - Click the "Go to Codes Hub" link. It should navigate to `/snail/codes`.

4. **Test Rate Limiting:**
   - Send 6 messages quickly (limit is 5 per minute).
   - The 6th message should return a **Rate limit exceeded** error.

5. **Disable Feature Flag:**
   - Disable the `askManus` flag in the admin panel.
   - Refresh `/snail`. The bar should be hidden.

## Metrics

### Performance
- **API Response:** <200ms for `/api/chat/bot`
- **Rate Limit:** 5 requests per 60 seconds

### Monitoring

```bash
# Check chat API logs for errors
docker logs slimyai-web | grep "Chat bot error"
```

## Feature Flags

| Flag | Default | Description |
| :--- | :--- | :--- |
| `experiments.askManus` | `false` | Enables the sticky chat bar on app pages. |

## Rollback

### Quick Rollback

```bash
# Revert to previous deployment
git revert HEAD
git push origin main
```

### Manual Rollback

1. Remove `AskManusBar` from `app/snail/layout.tsx` and `app/club/layout.tsx`.
2. Delete `components/ask-manus-bar.tsx`, `app/api/chat/bot/route.ts`, `lib/chat-actions.ts`, and `lib/rate-limiter.ts`.

## Troubleshooting

### Chat Bar Not Visible

**Symptom:** Bar is missing on `/snail` or `/club`.

**Diagnosis:**
- Check if the `askManus` feature flag is enabled for the test guild ID.
- Verify `app/snail/layout.tsx` and `app/club/layout.tsx` are correctly importing and rendering `AskManusBar`.

### Rate Limit Error too soon

**Symptom:** Rate limit error appears after only 1 or 2 requests.

**Diagnosis:**
- Check `lib/rate-limiter.ts` logic.
- Check if the rate limit file for the key is being written correctly in `data/rate-limits/`.

## Success Criteria

- ✅ Bar is visible only when `askManus` flag is true.
- ✅ Chat endpoint is rate-limited.
- ✅ Actions (copy, link) work as expected.
- ✅ Unit tests for rate limiter pass.
