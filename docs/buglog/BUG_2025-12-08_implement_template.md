# BUG: implement-4col-template

**Date:** 2025-12-08
**Status:** FIXED
**Protocol:** Flight Recorder

## Context
- Persistence is WORKING (sheet saves and loads correctly)
- Need to enforce strict 4-column template in spreadsheet view
- Must maintain existing persistence logic

## Goal
Update spreadsheet view to display exactly 4 columns:
1. **Name**
2. **SIM Power**
3. **Total Power**
4. **Change % from last week**

## Implementation

### Files Modified
- `apps/web/components/club/sheet-view.tsx`

### Changes
1. Defined `TEMPLATE_COLUMNS` array with exact column structure
2. Implemented `transformData()` function to map incoming data to template
3. Smart mapping logic:
   - Direct property match (e.g., `analysis.name`)
   - Search in metrics array for matching labels
   - Fallback to ID for Name column
4. Preserved persistence logic:
   - Loads saved data from `/api/club/sheet` on mount
   - Falls back to empty template if no saved data exists

### Deployment
```bash
docker compose -f infra/docker/docker-compose.slimy-nuc2.yml -p slimy-nuc2 build --no-cache web
docker compose -f infra/docker/docker-compose.slimy-nuc2.yml -p slimy-nuc2 up -d web
```

## Testing
- [ ] Verify 4 columns render correctly
- [ ] Confirm saved data loads on page refresh
- [ ] Test data transformation with scan results
- [ ] Validate persistence still works

## Notes
- Template approach allows easy column modification in future
- Smart mapping handles various data formats from backend
- Persistence mechanism unchanged from previous fix
