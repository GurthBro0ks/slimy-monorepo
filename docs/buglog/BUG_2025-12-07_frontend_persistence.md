# BUG_2025-12-07_frontend_persistence

## STATUS: ACTIVE
**Date:** 2025-12-07
**Severity:** HIGH
**Component:** Frontend (SheetView React Component)

---

## PROBLEM STATEMENT
The spreadsheet grid on `/club` loads empty on page refresh, despite backend confirmation that data is correctly saved to the database and returned by `/api/club/sheet`.

### ROOT CAUSE
The `SheetView` component initializes the x-spreadsheet library but **never fetches saved data from the API on mount**. It only responds to new `data` props passed from parent, making it "deaf" to persisted database state.

### SYMPTOMS
- Backend logs show `[Sheet API] FOUND Data` with correct row counts
- Frontend console shows NO fetch requests to `/api/club/sheet` on load
- Spreadsheet grid displays empty cells despite database containing data
- Manual "Analyze" triggers work (new data flows via props)

---

## VERIFICATION STATUS

### Backend Health: ✅ CONFIRMED WORKING
```
[Sheet API] FOUND Data - count: 6
GET /api/club/sheet 200
```

### Frontend Health: ❌ BROKEN
```
No fetch() call to /api/club/sheet on component mount
Missing data hydration logic
```

---

## FIX IMPLEMENTATION

### Changes Made
**File:** `apps/web/components/club/sheet-view.tsx`

**Modifications:**
1. Added `fetch('/api/club/sheet', { cache: 'no-store' })` inside `useEffect` after spreadsheet initialization
2. Implemented response unwrapping logic to handle `{data: [...]}` wrapper format
3. Added cache-busting via `cache: 'no-store'` header
4. Added comprehensive logging for debugging data flow

**Code Pattern:**
```tsx
useEffect(() => {
    if (libLoaded && sheetRef.current && !spreadsheetInstance.current) {
        const Spreadsheet = (window as any).x_spreadsheet;
        if (Spreadsheet) {
            spreadsheetInstance.current = new Spreadsheet(/* config */);

            // FIX: Load saved data from API on startup
            fetch('/api/club/sheet', { cache: 'no-store' })
                .then(res => res.json())
                .then(rawResponse => {
                    // Unwrap if necessary
                    let cleanData = rawResponse;
                    if (!Array.isArray(rawResponse) && rawResponse.data) {
                        cleanData = rawResponse.data;
                    }

                    if (Array.isArray(cleanData) && cleanData.length > 0) {
                        spreadsheetInstance.current.loadData(cleanData);
                    }
                })
                .catch(err => console.error("Failed to load sheet data:", err));
        }
    }
}, [libLoaded, data]);
```

---

## DEPLOYMENT STEPS
```bash
# Build with cache invalidation
docker compose -f infra/docker/docker-compose.slimy-nuc2.yml -p slimy-nuc2 build --no-cache web

# Deploy
docker compose -f infra/docker/docker-compose.slimy-nuc2.yml -p slimy-nuc2 up -d web
```

---

## VERIFICATION PROTOCOL

### Test Steps
1. Navigate to `https://slimyai.xyz/club`
2. Open Browser DevTools > Console
3. Refresh page

### Expected Results
✅ Console shows: `Raw Server Response: {...}`
✅ Console shows: `Loading rows into Grid: N` (where N > 0)
✅ Spreadsheet displays saved data (e.g., "FIXED!!!" or "TEST 123")
✅ Network tab shows GET request to `/api/club/sheet`

### Failure Indicators
❌ Empty grid after refresh
❌ No console logs about server response
❌ No network request to `/api/club/sheet`

---

## NOTES
- This fix addresses the "last mile" problem: data was being saved correctly but never retrieved on load
- The component was only reactive to prop changes, not proactive about fetching persisted state
- Cache-busting prevents browser from serving stale empty responses

---

## RESOLUTION
Status: **PENDING DEPLOYMENT & VERIFICATION**
Assigned: Claude Code Flight Recorder Protocol
Next Action: Deploy and test at production URL
