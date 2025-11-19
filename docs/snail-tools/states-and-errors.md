# Snail Tools UI States & Error Handling

## Overview

This document defines all possible UI states in the Snail Tools system, user-facing copy, backend behaviors, and recovery patterns. Comprehensive state management ensures users always understand what's happening and know their next steps.

---

## State Catalog

### 1. IDLE

**Description**: Initial state before any user interaction.

**UI State**:
```
Status: Ready for input
Visual: Empty upload zone with dashed border
Animation: Subtle pulsing outline (optional)
```

**User-Facing Copy**:
```
Primary: "Drop screenshots here or click to browse"
Secondary: "Upload up to 8 images, max 10MB each"
Help Text: "Best results with portrait screenshots showing clear stat columns"
```

**Backend Behavior**:
- No API calls made
- Session validated on page load
- CSRF token generated and embedded in form

**User Actions Available**:
- Click upload zone → Opens file picker
- Drag file over zone → Triggers hover state
- View example screenshots → Shows help modal
- Access previous results → Navigate to stats history

**Recovery**: N/A (initial state)

---

### 2. UPLOADING

**Description**: Files are being transferred from client to server.

**UI State**:
```
Status: Active upload in progress
Visual: Progress bar with percentage, file names listed
Animation: Animated progress bar, pulsing upload icon
```

**User-Facing Copy**:
```
Primary: "Uploading 3 screenshots..."
Per-file:
  "screenshot_1.png — 75% ▓▓▓▓▓▓▓░░"
  "screenshot_2.png — 45% ▓▓▓▓░░░░░"
  "screenshot_3.png — Queued ⏳"
```

**Backend Behavior**:
- **POST** `/api/snail/:guildId/analyze` initiated
- Multer middleware processing multipart upload
- Files being written to `/uploads/snail/:guildId/` directory
- Server-side validations:
  - File size check (each ≤ 10MB)
  - File type check (image/jpeg, image/png, image/webp)
  - File count check (1-8 files)
  - CSRF token validation
  - Auth token validation
  - Guild membership verification

**User Actions Available**:
- Cancel upload → Abort XHR request, clean up partial files
- View upload details → Expand file list

**Potential Transitions**:
- → `ANALYZING` (success: all files uploaded)
- → `FAILURE` (network error, auth failure, validation error)
- → `PARTIAL_SUCCESS` (some files uploaded, others failed)

**Recovery**:
- If network drops: Auto-retry 3x with exponential backoff (2s, 4s, 8s)
- If server error (5xx): Show retry button, preserve selected files
- If user cancels: Clear upload queue, return to `IDLE`

---

### 3. ANALYZING

**Description**: Server is processing uploaded images with AI.

**UI State**:
```
Status: AI analysis in progress
Visual: Spinner/loading animation, image thumbnails with status badges
Animation: Rotating spinner, shimmer effect on thumbnails
```

**User-Facing Copy**:
```
Primary: "AI is analyzing your screenshots..."
Secondary: "This usually takes 10-30 seconds"
Per-file:
  "screenshot_1.png — Analyzing ⟳"
  "screenshot_2.png — Analyzing ⟳"
  "screenshot_3.png — Queued ⏳"
```

**Backend Behavior**:
- Files successfully stored on disk
- For each file:
  - Read file buffer from disk
  - Convert to base64 data URL
  - Call `analyzeSnailDataUrl(dataUrl, { prompt })`
    - Internally calls OpenAI GPT-4 Vision API
    - Default prompt: "Analyze Super Snail game stats, Pentagon values, resources, and loadout"
    - Custom prompt appended if provided by user
  - Parse response text
  - Extract structured data (if possible)
- Aggregate all analysis results into single payload
- Save to `/data/snail/:guildId/:userId/latest.json`
- Record metrics: `images_analyzed` counter

**User Actions Available**:
- Wait (primary action)
- View processing queue → Shows which image is being analyzed
- Read tips → Shows "What makes a good screenshot" tips

**Potential Transitions**:
- → `SUCCESS` (all images analyzed successfully)
- → `PARTIAL_SUCCESS` (some images analyzed, others failed)
- → `FAILURE` (OpenAI API error, service unavailable)
- → `RATE_LIMITED` (OpenAI rate limit exceeded)

**Recovery**:
- If OpenAI API timeout (>30s): Retry failed image 1x
- If OpenAI returns error: Save error message, continue with next image
- If all retries fail: Transition to `FAILURE` with detailed error

**Estimated Duration**: 10-30 seconds (depends on image count and OpenAI API latency)

---

### 4. SUCCESS

**Description**: All images analyzed successfully, results displayed.

**UI State**:
```
Status: Complete
Visual: Green checkmark, results cards with thumbnails and analysis text
Animation: Fade-in results, subtle success glow
```

**User-Facing Copy**:
```
Primary: "Analysis complete! ✓"
Secondary: "3 screenshots analyzed successfully"
Per-result:
  ┌─────────────────────────────────────┐
  │ [Thumbnail]  screenshot_1.png       │
  │                                     │
  │ **Stats Detected:**                 │
  │ • Pentagon: 2.4M / 1.8M / 3.1M...  │
  │ • Resources: 450K gems, 12M gold   │
  │ • Loadout: Tank/DPS hybrid         │
  │                                     │
  │ [Copy Analysis] [Share] [Download]  │
  └─────────────────────────────────────┘
```

**Backend Behavior**:
- All analysis results stored successfully
- Response sent to client:
  ```json
  {
    "ok": true,
    "saved": true,
    "guildId": "123456789",
    "userId": "987654321",
    "prompt": "analyze stats",
    "results": [
      {
        "file": { "name": "screenshot_1.png", "url": "/api/uploads/..." },
        "uploadedBy": { "id": "...", "name": "...", "role": "member" },
        "analysis": "Detected stats: ..."
      }
    ],
    "savedAt": "2025-11-19T10:30:00.000Z"
  }
  ```

**User Actions Available**:
- **Upload more** → Return to `IDLE`, clear previous results
- **View history** → Navigate to `/snail/stats` (full history page)
- **Share to Discord** → Copy formatted message for Discord paste
- **Export JSON** → Download results as JSON file
- **Copy analysis** → Copy text to clipboard
- **View full-size image** → Open image modal

**Next Steps Display**:
```
┌────────────────────────────────────┐
│ What's next?                       │
├────────────────────────────────────┤
│ • Upload more screenshots          │
│ • View your stats history          │
│ • Share results with your guild    │
│ • Try the Tier Calculator tool     │
└────────────────────────────────────┘
```

**Recovery**: N/A (terminal success state)

---

### 5. PARTIAL_SUCCESS

**Description**: Some images analyzed successfully, others failed.

**UI State**:
```
Status: Completed with warnings
Visual: Yellow warning icon, mix of success (green) and error (red) badges
Animation: Subtle warning pulse on failed items
```

**User-Facing Copy**:
```
Primary: "Partial results available ⚠"
Secondary: "2 of 3 screenshots analyzed successfully"
Per-result:
  ✓ screenshot_1.png — Success
  ✓ screenshot_2.png — Success
  ✗ screenshot_3.png — Failed: Image quality too low
```

**Backend Behavior**:
- Some images processed successfully, stored in `/data/snail/:guildId/:userId/latest.json`
- Failed images logged with error details
- Response includes both successful and failed results:
  ```json
  {
    "ok": true,
    "saved": true,
    "partial": true,
    "successCount": 2,
    "failureCount": 1,
    "results": [
      { "file": "screenshot_1.png", "status": "success", "analysis": "..." },
      { "file": "screenshot_2.png", "status": "success", "analysis": "..." },
      { "file": "screenshot_3.png", "status": "error", "error": "low_quality" }
    ]
  }
  ```

**User Actions Available**:
- **View successful results** → Scroll to success section
- **Retry failed uploads** → Re-upload only failed files
- **Continue with partial results** → Use what succeeded
- **Report issue** → Link to feedback form (if suspicious failure)

**Recovery Options**:
```
┌────────────────────────────────────┐
│ screenshot_3.png failed            │
│ Reason: Image quality too low      │
│                                    │
│ Suggestions:                       │
│ • Re-take screenshot with better   │
│   lighting and resolution          │
│ • Ensure stats are clearly visible │
│ • Try uploading a different format │
│                                    │
│ [Retry Upload] [Skip This File]    │
└────────────────────────────────────┘
```

**Common Partial Failure Reasons**:
- Image quality issues (blurry, low resolution)
- Unsupported file format detected after upload
- Image contains no recognizable game content
- OpenAI API returned error for specific image

---

### 6. FAILURE

**Description**: Complete failure, no results available.

**UI State**:
```
Status: Error
Visual: Red error icon, error message box with details
Animation: Gentle shake on error appear
```

**User-Facing Copy**:

**6a. Authentication Failure**:
```
Primary: "Authentication required"
Secondary: "Your session has expired. Please sign in again."
Icon: 🔒
[Sign In with Discord] button
```

**6b. Permission Denied**:
```
Primary: "Access denied"
Secondary: "You don't have permission to use Snail Tools."
Details: "Join our Discord server and verify your membership."
Icon: 🚫
[Join Discord Server] button
```

**6c. File Too Large**:
```
Primary: "File too large"
Secondary: "screenshot_mega.png (12.3 MB) exceeds the 10 MB limit."
Suggestion: "Compress your image or upload a smaller file."
Icon: ⚠
[Try Again] button
```

**6d. Vision API Unavailable**:
```
Primary: "AI service temporarily unavailable"
Secondary: "The screenshot analysis feature is currently offline."
Details: "Our AI provider (OpenAI) is experiencing issues. Please try again later."
Icon: 🛠
Estimated recovery: "Usually resolved within 15 minutes"
[Try Again] [Check Status] buttons
```

**6e. Network Error**:
```
Primary: "Network error"
Secondary: "Unable to connect to the server."
Details: "Check your internet connection and try again."
Icon: 📡
[Retry Upload] button
```

**6f. Server Error (500)**:
```
Primary: "Something went wrong"
Secondary: "An unexpected error occurred on our end."
Details: "Our team has been notified. Please try again in a few minutes."
Error ID: "ERR_20251119_103045_ABC123" (for support reference)
Icon: ⚠
[Try Again] [Contact Support] buttons
```

**Backend Behavior by Error Type**:

| Error Code | HTTP Status | Backend Cause | Logged? | Alert? |
|-----------|-------------|---------------|---------|--------|
| `missing_images` | 400 | No files in request | No | No |
| `file_too_large` | 413 | File exceeds 10MB | No | No |
| `upload_failed` | 400 | Multer error | Yes | No |
| `vision_unavailable` | 503 | Missing OPENAI_API_KEY | Yes | Yes |
| `unauthorized` | 401 | Invalid/expired JWT | No | No |
| `forbidden` | 403 | Not guild member | No | No |
| `server_error` | 500 | Uncaught exception | Yes | Yes |
| `rate_limit` | 429 | Too many requests | Yes | No |

**User Actions Available** (varies by error):
- **Retry** → Re-attempt same operation
- **Sign In** → Redirect to Discord OAuth
- **Join Discord** → Open Discord invite link
- **Contact Support** → Open support form with pre-filled error details
- **Check Status** → Link to status page (e.g., status.openai.com)
- **Go Back** → Return to previous page

**Recovery Strategies**:

```
┌────────────────────────────────────┐
│ FAILURE RECOVERY FLOW              │
├────────────────────────────────────┤
│ 1. Show clear error message        │
│ 2. Explain what went wrong         │
│ 3. Provide actionable next steps   │
│ 4. Offer alternative paths         │
│ 5. Include "Get Help" option       │
└────────────────────────────────────┘
```

**Auto-Retry Logic** (for network/timeout errors):
```javascript
// Pseudo-code
attempt = 1
maxAttempts = 3
delays = [2000, 4000, 8000] // ms

while (attempt <= maxAttempts) {
  try {
    result = await uploadAndAnalyze()
    return SUCCESS
  } catch (error) {
    if (isRetriableError(error) && attempt < maxAttempts) {
      showToast(`Retrying... (${attempt}/${maxAttempts})`)
      await sleep(delays[attempt - 1])
      attempt++
    } else {
      return FAILURE
    }
  }
}
```

---

### 7. RATE_LIMITED

**Description**: User or guild has exceeded usage limits.

**UI State**:
```
Status: Temporarily blocked
Visual: Orange warning banner, countdown timer
Animation: Slow pulse on timer
```

**User-Facing Copy**:
```
Primary: "Rate limit reached"
Secondary: "You've reached the maximum uploads for now."
Details: "To prevent abuse, uploads are limited to 10 per hour."
Countdown: "You can upload again in: 23 minutes"
Icon: ⏱

┌────────────────────────────────────┐
│ Rate Limit Details                 │
├────────────────────────────────────┤
│ Your usage (last hour):            │
│ ▓▓▓▓▓▓▓▓▓▓ 10/10 uploads          │
│                                    │
│ Resets in: 23:45                   │
│                                    │
│ Need more? Contact your guild      │
│ admin to increase limits.          │
└────────────────────────────────────┘
```

**Backend Behavior**:
- Rate limit middleware checks upload count from:
  - Redis cache: `snail:ratelimit:{userId}:{hour}` key
  - OR in-memory store (if Redis unavailable)
- Default limits (configurable per guild):
  - **Member**: 10 uploads/hour, 50 uploads/day
  - **Trusted**: 20 uploads/hour, 100 uploads/day
  - **Admin**: Unlimited
- Returns 429 status with headers:
  ```
  X-RateLimit-Limit: 10
  X-RateLimit-Remaining: 0
  X-RateLimit-Reset: 1700401234 (Unix timestamp)
  Retry-After: 1405 (seconds)
  ```

**User Actions Available**:
- **Wait** → Countdown timer shows time until reset
- **View current usage** → Shows upload history for current period
- **Request limit increase** → Link to guild admin or support form
- **Use other tools** → Navigate to Secret Codes, Calculator, etc.

**Recovery**:
```
When rate limit expires:
  1. Auto-refresh UI (if user still on page)
  2. Show toast: "Rate limit reset! You can upload again."
  3. Re-enable upload button
  4. Clear rate limit warning banner
```

**Admin Override**:
- Guild admins can configure custom rate limits in Admin Panel
- Admins can manually reset a user's rate limit counter (audit logged)

---

## State Transition Diagram

```
                    ┌──────────┐
                    │  IDLE    │
                    └────┬─────┘
                         │
                   [User uploads files]
                         │
                         ▼
                   ┌──────────┐
              ┌───│UPLOADING │───┐
              │    └──────────┘   │
              │                   │
        [Network error]      [Upload success]
              │                   │
              ▼                   ▼
        ┌──────────┐        ┌──────────┐
        │ FAILURE  │        │ANALYZING │
        └──────────┘        └────┬─────┘
              ▲                  │
              │                  │
              │            [AI processing]
              │                  │
              │         ┌────────┴────────┐
              │         │                 │
              │    [All succeed]    [Some/all fail]
              │         │                 │
              │         ▼                 ▼
              │   ┌──────────┐      ┌──────────────┐
              │   │ SUCCESS  │      │PARTIAL_SUCCESS│
              │   └──────────┘      └──────────────┘
              │                           │
              │                           │
              │                     [Retry failures]
              │                           │
              └───────────────────────────┘


         [Rate limit hit at any upload attempt]
                         │
                         ▼
                   ┌──────────────┐
                   │RATE_LIMITED  │
                   └──────────────┘
                         │
                   [Timer expires]
                         │
                         ▼
                    ┌──────────┐
                    │  IDLE    │
                    └──────────┘
```

---

## Error Codes Reference

### Client Errors (4xx)

| Code | HTTP | User Message | Backend Cause | Recovery |
|------|------|--------------|---------------|----------|
| `missing_images` | 400 | "Please select at least one image" | No files in form data | Select files |
| `invalid_file_type` | 400 | "Unsupported file type. Use JPG, PNG, or WEBP." | File MIME type not image/* | Choose different file |
| `file_too_large` | 413 | "File exceeds 10MB limit" | File size > MAX_BYTES | Compress image |
| `too_many_files` | 400 | "Maximum 8 files per upload" | File count > 8 | Remove extra files |
| `unauthorized` | 401 | "Please sign in to continue" | Missing/invalid JWT | Redirect to login |
| `forbidden` | 403 | "You don't have permission" | Not guild member or wrong role | Join guild or contact admin |
| `csrf_token_invalid` | 403 | "Security token expired. Please refresh." | CSRF mismatch | Reload page |
| `rate_limit_exceeded` | 429 | "Too many uploads. Try again in X minutes." | Rate limit hit | Wait for reset |

### Server Errors (5xx)

| Code | HTTP | User Message | Backend Cause | Recovery |
|------|------|--------------|---------------|----------|
| `vision_unavailable` | 503 | "AI service temporarily offline" | No OPENAI_API_KEY env var | Notify admin |
| `openai_error` | 502 | "AI provider error. Try again." | OpenAI API returned error | Retry or wait |
| `storage_error` | 500 | "Failed to save file" | Disk full or permissions issue | Alert ops team |
| `server_error` | 500 | "Unexpected error occurred" | Uncaught exception | Check logs, retry |

---

## Best Practices for State Management

### 1. Always Show Current State
```typescript
// UI should always reflect exact backend state
const [uploadState, setUploadState] = useState<UploadState>('idle');

// State updates must be atomic
setUploadState('uploading'); // ✓ Clear
setUploadState('uploading-but-might-be-analyzing'); // ✗ Ambiguous
```

### 2. Provide Contextual Help
```typescript
const stateHelpText = {
  idle: "Drop your screenshots here to get started",
  uploading: "Your files are being securely uploaded...",
  analyzing: "AI is reading your stats (this takes about 15 seconds)",
  success: "All done! You can now view your results below.",
  failure: "Something went wrong. See details below.",
  rate_limited: "You've hit the upload limit. Take a break!"
};
```

### 3. Handle Transitions Gracefully
```typescript
// Good: Smooth state transitions with loading states
idle → uploading → analyzing → success
  ↓        ↓           ↓
[Button] [Progress] [Spinner]

// Bad: Jarring jumps without feedback
idle → ??? → success (user confused: "Did it work?")
```

### 4. Make Errors Actionable
```typescript
// Good: Specific error with clear action
"File 'screenshot.png' is 12MB. Maximum size is 10MB.
 [Compress Image] or [Choose Different File]"

// Bad: Vague error with no guidance
"Upload failed. Error code: 413."
```

### 5. Preserve User Context
```typescript
// On error, preserve user's work
if (uploadFailed) {
  // ✓ Keep file selections, don't force re-select
  // ✓ Keep custom prompt text, don't clear input
  // ✓ Offer "Retry" that reuses existing data

  // ✗ Don't clear everything and make user start over
}
```

---

## Accessibility Considerations

### Screen Reader Announcements

```html
<!-- Announce state changes -->
<div role="status" aria-live="polite" aria-atomic="true">
  {uploadState === 'uploading' && "Uploading 3 files..."}
  {uploadState === 'analyzing' && "Analyzing screenshots with AI..."}
  {uploadState === 'success' && "Analysis complete! 3 results available."}
  {uploadState === 'failure' && "Upload failed. Error: File too large."}
</div>
```

### Keyboard Navigation

- `Tab` → Navigate through upload zone, buttons, results
- `Enter` / `Space` → Activate file picker, submit upload
- `Escape` → Cancel upload, close error modal
- `Ctrl+V` → Paste image from clipboard (if supported)

### Visual Indicators

- ✓ Color alone is not sole indicator (use icons + text)
- ✓ Sufficient contrast ratios (WCAG AA minimum)
- ✓ Focus indicators on interactive elements
- ✓ Loading animations have reduced motion alternatives

---

## Mobile-Specific States

### Mobile Camera Capture State

**UI State**:
```
Status: Camera active
Visual: Native camera viewfinder or file picker
```

**User-Facing Copy**:
```
Primary: "Take a photo or choose from gallery"
Options:
  [📷 Take Photo]
  [🖼 Choose from Photos]
  [📁 Browse Files]
```

**Backend Behavior**:
- Same as desktop upload after file selected
- May receive different MIME types (e.g., `image/heic` on iOS)
- Auto-converts HEIC to JPEG if needed

### Mobile Network Warning State

**UI State**:
```
Status: Slow connection detected
Visual: Orange banner with network icon
```

**User-Facing Copy**:
```
Primary: "Slow connection detected"
Secondary: "Uploads may take longer on cellular data."
Suggestion: "For faster results, connect to Wi-Fi."
[Continue Anyway] [Cancel]
```

---

## Monitoring & Metrics

### State Duration Tracking

Track how long users spend in each state to identify bottlenecks:

```javascript
// Example metrics
{
  "state": "analyzing",
  "duration_ms": 23450,
  "file_count": 3,
  "user_id": "123",
  "guild_id": "456"
}
```

**Target Benchmarks**:
- `UPLOADING`: < 5 seconds (for 3 files, 5MB total)
- `ANALYZING`: < 30 seconds (for 3 files)
- `SUCCESS` → next action: < 10 seconds (user engagement)

### Error Rate Monitoring

Alert if error rates exceed thresholds:
- `FAILURE` rate > 5% (investigate backend)
- `PARTIAL_SUCCESS` rate > 10% (check image quality guidance)
- `RATE_LIMITED` rate > 2% (consider raising limits)

---

## Testing Scenarios

### Manual Test Cases

1. **Happy Path**: Upload 1 image → SUCCESS
2. **Batch Upload**: Upload 8 images → SUCCESS
3. **File Too Large**: Upload 15MB file → FAILURE (file_too_large)
4. **No Auth**: Logout, try upload → FAILURE (unauthorized)
5. **Network Drop**: Disconnect mid-upload → FAILURE (network_error) → Retry succeeds
6. **Rate Limit**: Upload 11 times in 1 hour → RATE_LIMITED
7. **OpenAI Timeout**: Mock slow API → ANALYZING (>30s) → PARTIAL_SUCCESS
8. **Mixed Quality**: Upload 1 clear + 1 blurry image → PARTIAL_SUCCESS

### Automated State Tests

```typescript
describe('Upload State Machine', () => {
  it('transitions idle → uploading → analyzing → success', async () => {
    const { result } = renderHook(() => useUploadState());

    expect(result.current.state).toBe('idle');

    act(() => result.current.upload([mockFile]));
    expect(result.current.state).toBe('uploading');

    await waitFor(() => expect(result.current.state).toBe('analyzing'));
    await waitFor(() => expect(result.current.state).toBe('success'));
  });

  it('handles upload failure gracefully', async () => {
    server.use(
      http.post('/api/snail/:guildId/analyze', () => {
        return HttpResponse.json({ error: 'server_error' }, { status: 500 });
      })
    );

    const { result } = renderHook(() => useUploadState());
    act(() => result.current.upload([mockFile]));

    await waitFor(() => {
      expect(result.current.state).toBe('failure');
      expect(result.current.error).toBe('server_error');
    });
  });
});
```

---

## Conclusion

Robust state management is critical for user trust and satisfaction. Every state should:

1. **Communicate clearly** what's happening
2. **Provide feedback** on progress
3. **Offer recovery** when things fail
4. **Respect user context** (preserve work, don't lose data)
5. **Be accessible** to all users

By following these patterns, Snail Tools delivers a predictable, reliable experience across all user journeys.
