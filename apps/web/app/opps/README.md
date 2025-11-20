# Opportunity Radar Sub-UI

## Overview

This is a **standalone, experimental sub-UI** for the Slimy Opportunity Radar system. It provides a minimal interface for browsing opportunities detected by the opps-api service.

**Status:** Experimental / Not Production Ready

## Architecture

This route is built using Next.js 13+ App Router and consists of:

- **`page.tsx`**: Server component that renders the main page layout and explanatory content
- **`OpportunitiesRadarClient.tsx`**: Client-side React component that fetches and displays opportunity data
- **`types.ts`**: TypeScript interfaces matching the opps-api response schema
- **`README.md`**: This documentation file

## Configuration

### Environment Variables

The UI expects the following environment variable to be set:

```bash
NEXT_PUBLIC_OPPS_API_BASE_URL=http://localhost:4010
```

If not set, it defaults to `http://localhost:4010`.

### API Endpoint

The client component fetches from:
```
GET {NEXT_PUBLIC_OPPS_API_BASE_URL}/radar?mode=quick&maxPerDomain=5
```

Expected response structure (see `types.ts` for full definitions):
```typescript
{
  generatedAt: string;
  mode: 'quick' | 'full';
  totalScanned: number;
  totalOpportunities: number;
  byDomain: {
    [domain: string]: ScoredOpportunity[];
  };
}
```

## Accessing the UI

This route is **NOT linked from any navigation** yet. To access it:

1. Start the Next.js dev server: `pnpm dev`
2. Navigate directly to: `http://localhost:3000/opps`

## Current Limitations

This is a minimal scaffold with the following known limitations:

1. **No Navigation Integration**: The route is not linked from any site navigation or menu
2. **No Authentication**: There are no auth or role checks; anyone who knows the URL can access it
3. **No Real-Time Updates**: Data is fetched once on page load; no polling or WebSocket support
4. **Minimal Styling**: Uses basic Tailwind classes; not integrated with any design system
5. **No Error Recovery**: No retry logic or sophisticated error handling
6. **No Filters/Search**: Displays all opportunities; no client-side filtering or sorting
7. **No Persistence**: No ability to save, bookmark, or mark opportunities as completed

## Future Enhancements (TODO for Human Developers)

### High Priority
- [ ] Add link to main site navigation (header, sidebar, etc.)
- [ ] Implement authentication and role-based access control
- [ ] Integrate with existing design system/component library
- [ ] Add proper error boundaries and retry logic
- [ ] Add loading skeletons instead of spinner

### Medium Priority
- [ ] Add client-side filtering (by domain, risk level, tags)
- [ ] Add sorting options (by score, reward, time, etc.)
- [ ] Add search functionality
- [ ] Implement pagination or infinite scroll for large datasets
- [ ] Add real-time updates (polling or WebSocket)
- [ ] Add refresh button to manually refetch data

### Low Priority
- [ ] Add ability to save/bookmark opportunities
- [ ] Add ability to mark opportunities as "completed" or "dismissed"
- [ ] Add detailed view modal/page for individual opportunities
- [ ] Add analytics tracking
- [ ] Add export functionality (CSV, JSON)
- [ ] Add mobile-optimized view

## File Structure

```
apps/web/app/opps/
├── page.tsx                        # Server component (main entry point)
├── OpportunitiesRadarClient.tsx    # Client component (data fetching & rendering)
├── types.ts                        # TypeScript interfaces
└── README.md                       # This file
```

## Development Notes

### Design Principles
- **Add-Only**: This implementation adds NO modifications to existing files
- **Isolated**: All code is contained within the `/opps` route directory
- **Minimal Dependencies**: Uses only built-in Next.js features and Tailwind CSS
- **Type-Safe**: Full TypeScript coverage with proper interfaces

### Running Locally

1. Ensure the opps-api service is running:
   ```bash
   # In the opps-api directory
   pnpm dev
   ```

2. Set the environment variable (optional, defaults to localhost:4010):
   ```bash
   export NEXT_PUBLIC_OPPS_API_BASE_URL=http://localhost:4010
   ```

3. Start the Next.js dev server:
   ```bash
   # In apps/web
   pnpm dev
   ```

4. Navigate to: http://localhost:3000/opps

### Testing

To test with mock data, you can:
1. Run the opps-api service with test/seed data
2. Or mock the API response using a tool like MSW (Mock Service Worker)
3. Or temporarily modify `OpportunitiesRadarClient.tsx` to use hardcoded mock data

## API Contract

This UI expects the opps-api to conform to the following contract:

**Endpoint:** `GET /radar`

**Query Parameters:**
- `mode` (optional): 'quick' | 'full' - Default: 'quick'
- `maxPerDomain` (optional): number - Max opportunities per domain - Default: 5

**Response:** See `types.ts` for detailed type definitions

## Questions or Issues?

This is experimental code. For questions or issues:
1. Check if the opps-api service is running and accessible
2. Verify the `NEXT_PUBLIC_OPPS_API_BASE_URL` is set correctly
3. Check browser console for error messages
4. Refer to the opps-api documentation for expected response formats

## License

Same as parent project (Slimy monorepo)
