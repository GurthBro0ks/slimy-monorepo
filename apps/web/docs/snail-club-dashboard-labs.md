# Club Dashboard (Labs)

**Status:** Demo/Labs Feature
**Path:** `/labs/club-dashboard`
**API:** `/api/labs/club-summary`

## Overview

The Club Dashboard is a demonstration feature that shows club performance analytics including member contributions, power statistics, and weekly trends. This labs version uses mock data and serves as a prototype for the full production implementation.

## Features

### Summary Statistics

The dashboard displays four key metrics with week-over-week comparisons:

1. **Total Power** - Combined power of all club members
2. **Sim Power** - Total simulation power across the club
3. **Active Members** - Count of members who contributed this week
4. **Average Member Power** - Mean power per member

Each metric shows:
- Current value with formatted numbers (K/M/B suffixes)
- Percentage change from previous week
- Visual indicators (up/down arrows) and color coding

### Member Contributions Table

A sortable table showing all club members with:
- Rank (with medal icons for top 3)
- Member name
- Sim Power
- Total Power
- Weekly Contribution
- Percentage change from previous week
- Active/Inactive status badge

### Weekly Power Trend Chart

Placeholder section for visualizing weekly performance over time. Currently shows mock data in text format; ready for chart library integration.

## File Structure

```
apps/web/
├── app/
│   ├── labs/
│   │   └── club-dashboard/
│   │       ├── page.tsx          # Main dashboard UI component
│   │       └── mock-data.ts      # Type definitions and mock data
│   └── api/
│       └── labs/
│           └── club-summary/
│               └── route.ts       # Demo API endpoint
└── docs/
    └── snail-club-dashboard-labs.md  # This documentation
```

## Data Model

### Type Definitions

Located in `app/labs/club-dashboard/mock-data.ts`:

```typescript
interface ClubMember {
  id: string;
  name: string;
  simPower: number;
  totalPower: number;
  weeklyContribution: number;
  weeklyChange: number;
  rank: number;
  isActive: boolean;
}

interface ClubWeeklySnapshot {
  weekNumber: number;
  weekStart: string;
  weekEnd: string;
  totalPower: number;
  totalSimPower: number;
  activeMemberCount: number;
  totalMemberCount: number;
  averageMemberPower: number;
  topContributor: string;
}

interface ClubSummary {
  clubId: string;
  clubName: string;
  currentWeek: ClubWeeklySnapshot;
  previousWeek: ClubWeeklySnapshot;
  members: ClubMember[];
  weeklyHistory: ClubWeeklySnapshot[];
}
```

### Mock Data

The mock data includes:
- **Club:** "Elite Snail Squad" with 10 members
- **Members:** Mix of active (8) and inactive (2) members
- **Weekly History:** 4 weeks of snapshots showing progression
- **Realistic Values:** Power values in millions/billions range

## API Endpoint

### GET `/api/labs/club-summary`

Returns club summary data with members and weekly statistics.

**Query Parameters:**
- `clubId` (optional in demo): Club identifier
- `includeStats` (optional): Include calculated statistics

**Response:**
```json
{
  "success": true,
  "data": {
    "clubId": "club-demo-001",
    "clubName": "Elite Snail Squad",
    "currentWeek": { ... },
    "previousWeek": { ... },
    "members": [ ... ],
    "weeklyHistory": [ ... ]
  },
  "stats": {
    "totalPower": 272000000,
    "totalPowerChange": 6.67,
    "simPower": 84400000,
    "simPowerChange": 7.93,
    ...
  },
  "meta": {
    "timestamp": "2025-11-19T...",
    "clubId": "club-demo-001",
    "isDemo": true
  }
}
```

## Switching from Mock Data to Real Data

### Step 1: Database Schema

Add Prisma models for club data (example schema included in `route.ts`):

```prisma
model Club {
  id              String              @id @default(cuid())
  guildId         String              @unique
  name            String
  members         ClubMember[]
  weeklySnapshots ClubWeeklySnapshot[]
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
}

model ClubMember {
  id          String              @id @default(cuid())
  clubId      String
  club        Club                @relation(fields: [clubId], references: [id])
  userId      String
  name        String
  simPower    BigInt
  totalPower  BigInt
  rank        Int
  isActive    Boolean             @default(true)
  weeklyStats MemberWeeklyStats[]
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt

  @@unique([clubId, userId])
}

model MemberWeeklyStats {
  id           String     @id @default(cuid())
  memberId     String
  member       ClubMember @relation(fields: [memberId], references: [id])
  weekNumber   Int
  contribution BigInt
  powerChange  Float
  createdAt    DateTime   @default(now())

  @@unique([memberId, weekNumber])
}

model ClubWeeklySnapshot {
  id                 String   @id @default(cuid())
  clubId             String
  club               Club     @relation(fields: [clubId], references: [id])
  weekNumber         Int
  weekStart          DateTime
  weekEnd            DateTime
  totalPower         BigInt
  totalSimPower      BigInt
  activeMemberCount  Int
  totalMemberCount   Int
  averageMemberPower BigInt
  topContributor     String
  createdAt          DateTime @default(now())

  @@unique([clubId, weekNumber])
}
```

### Step 2: Implement Repository Layer

Create `lib/repositories/club-dashboard.repository.ts` following the existing `club-analytics.repository.ts` pattern:

```typescript
export class ClubDashboardRepository {
  async getClubSummary(clubId: string): Promise<ClubSummary> {
    // Fetch club with members and weekly snapshots
    const club = await db.club.findUnique({
      where: { id: clubId },
      include: {
        members: {
          include: { weeklyStats: { take: 2, orderBy: { weekNumber: 'desc' } } }
        },
        weeklySnapshots: {
          take: 4,
          orderBy: { weekNumber: 'desc' }
        }
      }
    });

    return transformToClubSummary(club);
  }
}
```

### Step 3: Update API Route

Replace mock data in `app/api/labs/club-summary/route.ts`:

```typescript
import { getClubDashboardRepository } from '@/lib/repositories/club-dashboard.repository';

export async function GET(request: NextRequest) {
  const clubId = searchParams.get('clubId');

  // Add authentication
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch real data
  const repo = getClubDashboardRepository();
  const clubSummary = await repo.getClubSummary(clubId);

  return NextResponse.json({ success: true, data: clubSummary });
}
```

### Step 4: Update Dashboard Page

Modify `app/labs/club-dashboard/page.tsx` to fetch from API:

```typescript
useEffect(() => {
  async function fetchClubData() {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/labs/club-summary?clubId=${clubId}&includeStats=true`);
      const result = await response.json();

      if (result.success) {
        setClubData(result.data);
        setStats(result.stats || calculateDashboardStats(result.data));
      }
    } catch (error) {
      console.error('Failed to fetch club data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  fetchClubData();
}, [clubId]);
```

### Step 5: Add Authentication

Integrate with existing auth system:

```typescript
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function ClubDashboardPage() {
  return (
    <ProtectedRoute requiredRole="club">
      {/* Dashboard content */}
    </ProtectedRoute>
  );
}
```

### Step 6: Implement Caching

Add Redis caching for performance:

```typescript
import { getCacheClient } from '@/lib/cache';

const cacheKey = `club:summary:${clubId}`;
const cached = await getCacheClient().get(cacheKey);

if (cached) {
  return NextResponse.json(JSON.parse(cached));
}

const clubSummary = await repo.getClubSummary(clubId);
await getCacheClient().setex(cacheKey, 60, JSON.stringify(clubSummary));
```

### Step 7: Add Monitoring

Implement logging and APM:

```typescript
import { getLogger } from '@/lib/monitoring/logger';
import { withAPM } from '@/lib/monitoring/apm';

export const GET = withAPM(async (request: NextRequest) => {
  const logger = getLogger({ module: 'api', route: '/labs/club-summary' });

  logger.info('Fetching club summary', { clubId });
  // ... implementation
});
```

## Future Enhancements

### Chart Integration

Install a chart library for visualizations:

```bash
pnpm add recharts
# or
pnpm add chart.js react-chartjs-2
```

Example implementation with recharts:

```typescript
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const chartData = clubData.weeklyHistory.map(week => ({
  week: `W${week.weekNumber}`,
  totalPower: week.totalPower / 1000000, // Convert to millions
  simPower: week.totalSimPower / 1000000
}));

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={chartData}>
    <XAxis dataKey="week" />
    <YAxis />
    <Tooltip />
    <Line type="monotone" dataKey="totalPower" stroke="#10b981" />
    <Line type="monotone" dataKey="simPower" stroke="#3b82f6" />
  </LineChart>
</ResponsiveContainer>
```

### Advanced Features

1. **Data Export**
   - CSV export for member data
   - Google Sheets integration (similar to existing club analytics)
   - PDF report generation

2. **Member Details**
   - Click member row to view detailed stats
   - Historical performance graphs per member
   - Contribution breakdown

3. **Filters and Sorting**
   - Filter by active/inactive status
   - Sort by any column
   - Search members by name
   - Date range selector for historical data

4. **Real-time Updates**
   - WebSocket integration for live updates
   - Polling for periodic refresh
   - Server-sent events for notifications

5. **Notifications**
   - Alert when member becomes inactive
   - Weekly summary notifications
   - Performance milestone achievements

## Testing

### Unit Tests

Create `app/labs/club-dashboard/mock-data.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { calculateDashboardStats, formatPower } from './mock-data';

describe('calculateDashboardStats', () => {
  it('should calculate correct percentage changes', () => {
    // Test implementation
  });
});

describe('formatPower', () => {
  it('should format numbers with K/M/B suffixes', () => {
    expect(formatPower(1500)).toBe('1.50K');
    expect(formatPower(2500000)).toBe('2.50M');
    expect(formatPower(3500000000)).toBe('3.50B');
  });
});
```

### E2E Tests

Create `tests/e2e/labs-club-dashboard.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Club Dashboard Labs', () => {
  test('should display club statistics', async ({ page }) => {
    await page.goto('/labs/club-dashboard');

    await expect(page.getByText('Elite Snail Squad')).toBeVisible();
    await expect(page.getByText('Total Power')).toBeVisible();
    await expect(page.getByText('Sim Power')).toBeVisible();
  });

  test('should display member table', async ({ page }) => {
    await page.goto('/labs/club-dashboard');

    await expect(page.getByText('SnailMaster3000')).toBeVisible();
    await expect(page.getByText('Active')).toBeVisible();
  });
});
```

## Performance Considerations

1. **Caching Strategy**
   - Cache club summaries for 60 seconds
   - Invalidate cache when new data is uploaded
   - Use stale-while-revalidate for better UX

2. **Database Optimization**
   - Index on clubId, weekNumber for fast queries
   - Denormalize weekly aggregates
   - Use database views for common queries

3. **Client-side Optimization**
   - Lazy load member table rows (virtualization)
   - Debounce search/filter inputs
   - Use React.memo for expensive components

## Security Considerations

1. **Authentication Required**
   - Verify user has club role
   - Check user belongs to requested club

2. **Rate Limiting**
   - Limit API calls per user/IP
   - Implement DDoS protection

3. **Data Validation**
   - Validate all query parameters
   - Sanitize user inputs
   - Prevent SQL injection

## Support and Feedback

This is a labs/demo feature. For production deployment:

1. Review all TODO comments in the code
2. Implement authentication and authorization
3. Add database models and migrations
4. Set up monitoring and logging
5. Test thoroughly with real data
6. Add proper error handling
7. Implement security best practices

## Related Documentation

- [Club Analytics](./club-analytics.mdx) - Production club analytics with AI
- [Getting Started](./getting-started.mdx) - General setup guide
- [API Documentation](../README.md) - API overview

---

**Last Updated:** 2025-11-19
**Version:** 1.0.0 (Labs)
