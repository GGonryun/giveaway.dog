# Mock Data Migration Plan - Move to Server Actions

## Overview

This plan details the migration of all mock data from client components to server actions, implementing proper data fetching patterns with Suspense boundaries and loading states.

## Current State Analysis

### 1. Dashboard Page Components (`/app/(dashboard)/`)

**Files with Mock Data:**

- `page.tsx` - Multiple mock data constants
- `components/dashboard-kpi-cards.tsx` - Uses mock KPI data
- `components/daily-engagement-chart.tsx` - Uses mock daily engagement data
- `components/bot-detection-pie-chart.tsx` - Uses mock bot detection data
- `components/conversion-funnel-chart.tsx` - Uses mock funnel data
- `components/referrers-bar-chart.tsx` - Uses mock referrer data
- `components/active-sweepstakes-list.tsx` - Uses mock sweepstakes data
- `components/entry-velocity-heatmap.tsx` - Uses mock heatmap data
- `components/geolocation-map.tsx` - Uses mock geo data
- `components/user-distribution-histogram.tsx` - Uses mock histogram data
- `components/latest-users-feed.tsx` - Uses mock users data
- `components/flagged-entries-list.tsx` - Uses mock flagged entries
- `components/time-to-entry-analytics.tsx` - Uses mock analytics data

### 2. Users Management (`/app/(app)/users/`)

**Files with Mock Data:**

- `page.tsx` - mockKPIs constant for user analytics
- `components/user-detail-sheet.tsx` - Mock user details
- `components/user-detail-panel.tsx` - Mock user details
- `components/export-sheet.tsx` - Mock export options
- `components/crm-sync-sheet.tsx` - Mock CRM data
- `[id]/components/user-detail-view.tsx` - Mock individual user data
- `actions.ts` - Contains mock user generation (good pattern to expand)

### 3. Sweepstakes Management (`/app/(app)/sweepstakes/`)

**Files with Mock Data:**

- `page.tsx` - mockOverviewKPIs + massive mockSweepstakesData array
- `[id]/page.tsx` - Mock individual sweepstakes data
- `[id]/components/sweepstakes-kpi-cards.tsx` - Mock KPI data
- `[id]/components/sweepstakes-time-series-chart.tsx` - Mock time series data
- `[id]/components/sweepstakes-conversion-funnel.tsx` - Mock funnel data
- `[id]/components/sweepstakes-bot-pie.tsx` - Mock bot detection data
- `[id]/components/sweepstakes-top-referrers.tsx` - Mock referrer data
- `[id]/components/sweepstakes-latest-users.tsx` - Mock user entries
- `[id]/components/sweepstakes-flagged-entries.tsx` - Mock flagged entries
- `[id]/components/sweepstakes-entries.tsx` - Mock entry data
- `[id]/components/sweepstakes-winners.tsx` - Mock winner data
- `[id]/components/sweepstakes-export-modal.tsx` - Mock export data

### 4. Settings Pages (`/app/(app)/settings/`)

**Files with Mock Data:**

- `components/org-profile.tsx` - mockOrgData for organization settings

### 5. Marketing Pages (`/app/(marketing)/`)

**Files with Mock Data:**

- `browse/components/featured-carousel.tsx` - Mock featured giveaways
- `browse/components/giveaway-grid.tsx` - Mock giveaway listings
- `browse/all/components/all-giveaways-grid.tsx` - Mock giveaway data

### 6. Host/Create Pages (`/app/host/`)

**Files with Mock Data:**

- `components/preview.tsx` - Mock preview data

## Migration Strategy

### Phase 1: Create Actions Directory Structure

**IMPORTANT**: Every function must be exported as a default function, requiring individual files for each action.

```
/actions/
├── dashboard/
│   ├── get-dashboard-kpis.ts
│   ├── get-dashboard-charts.ts
│   ├── get-dashboard-analytics.ts
│   ├── get-daily-engagement.ts
│   ├── get-bot-detection.ts
│   ├── get-conversion-funnel.ts
│   ├── get-referrer-data.ts
│   ├── get-active-sweepstakes.ts
│   ├── get-heatmap-data.ts
│   ├── get-geolocation-data.ts
│   ├── get-user-distribution.ts
│   ├── get-latest-users.ts
│   ├── get-flagged-entries.ts
│   └── get-time-to-entry.ts
├── sweepstakes/
│   ├── get-sweepstakes-overview.ts
│   ├── get-sweepstakes-list.ts
│   ├── get-sweepstakes-detail.ts
│   ├── get-sweepstakes-analytics.ts
│   ├── get-sweepstakes-entries.ts
│   ├── get-sweepstakes-kpis.ts
│   ├── get-sweepstakes-time-series.ts
│   ├── get-sweepstakes-funnel.ts
│   ├── get-sweepstakes-bot-data.ts
│   ├── get-sweepstakes-referrers.ts
│   ├── get-sweepstakes-users.ts
│   ├── get-sweepstakes-flagged.ts
│   └── get-sweepstakes-winners.ts
├── users/
│   ├── get-users.ts (existing file)
│   ├── search-users.ts (existing file)
│   ├── get-user-analytics.ts
│   ├── get-user-detail.ts
│   ├── get-export-options.ts
│   └── get-crm-data.ts
├── settings/
│   └── get-organization-data.ts
├── marketing/
│   ├── get-featured-giveaways.ts
│   ├── get-giveaway-grid.ts
│   └── get-all-giveaways.ts
└── shared/
    ├── types.ts
    └── utils.ts
```

### Phase 2: Migration Priority Order

#### Priority 1 (High Impact): Dashboard Analytics ✅ **COMPLETED**

1. **Dashboard KPIs** (`/actions/dashboard/get-dashboard-kpis.ts`) - **REVALIDATED** ✅
   - ✅ Move `mockKPIData` from dashboard page
   - ✅ Add proper TypeScript interfaces
   - ✅ **Revalidation Strategy**: `revalidateTag('dashboard-kpis')` every 5 minutes
   - ✅ **Reason**: KPIs change frequently with new entries and need real-time updates

2. **Daily Engagement** (`/actions/dashboard/get-daily-engagement.ts`) - **REVALIDATED** ✅
   - ✅ Move `mockDailyEngagement` data
   - ✅ Add date range parameters
   - ✅ **Revalidation Strategy**: `revalidateTag('daily-engagement')` every 10 minutes
   - ✅ **Reason**: Engagement data updates with new user activity

3. **Bot Detection** (`/actions/dashboard/get-bot-detection.ts`) - **REVALIDATED** ✅
   - ✅ Move `mockBotDetection` data
   - ✅ Add filtering capabilities
   - ✅ **Revalidation Strategy**: `revalidateTag('bot-detection')` every 10 minutes
   - ✅ **Reason**: Bot detection data updates with new entries and fraud detection

4. **Conversion Funnel** (`/actions/dashboard/get-conversion-funnel.ts`) - **REVALIDATED** ✅
   - ✅ Move `mockFunnelData`
   - ✅ Add time period filtering
   - ✅ **Revalidation Strategy**: `revalidateTag('conversion-funnel')` every 10 minutes
   - ✅ **Reason**: Funnel data updates with new conversions and user flow

5. **Referrer Data** (`/actions/dashboard/get-referrer-data.ts`) - **REVALIDATED** ✅
   - ✅ Move `mockReferrerData`
   - ✅ Add source filtering and grouping
   - ✅ **Revalidation Strategy**: `revalidateTag('referrer-data')` every 15 minutes
   - ✅ **Reason**: Referrer data changes with new traffic sources

6. **Active Sweepstakes** (`/actions/dashboard/get-active-sweepstakes.ts`) - **REVALIDATED** ✅
   - ✅ Move `mockActiveSweepstakes` data
   - ✅ Add status filtering
   - ✅ **Revalidation Strategy**: `revalidateTag('active-sweepstakes')` every 5 minutes
   - ✅ **Reason**: Active sweepstakes data changes frequently with new entries

7. **Heatmap Data** (`/actions/dashboard/get-heatmap-data.ts`) - **REVALIDATED** ✅
   - ✅ Move `mockHeatmapData`
   - ✅ Add time range filtering
   - ✅ **Revalidation Strategy**: `revalidateTag('heatmap-data')` every 15 minutes
   - ✅ **Reason**: Heatmap data updates with user entry patterns

8. **Geolocation Data** (`/actions/dashboard/get-geolocation-data.ts`) - **REVALIDATED** ✅
   - ✅ Move `mockLocationData`
   - ✅ Add geographic filtering
   - ✅ **Revalidation Strategy**: `revalidateTag('geolocation-data')` every 15 minutes
   - ✅ **Reason**: Geographic data updates with new user locations

9. **User Distribution** (`/actions/dashboard/get-user-distribution.ts`) - **REVALIDATED** ✅
   - ✅ Move `mockDistributionData`
   - ✅ Add distribution analysis
   - ✅ **Revalidation Strategy**: `revalidateTag('user-distribution')` every 30 minutes
   - ✅ **Reason**: Distribution patterns change as user behavior evolves

10. **Latest Users** (`/actions/dashboard/get-latest-users.ts`) - **REVALIDATED** ✅
    - ✅ Move `mockLatestUsers` data
    - ✅ Add real-time user tracking
    - ✅ **Revalidation Strategy**: `revalidateTag('latest-users')` every 2 minutes
    - ✅ **Reason**: Latest users list updates very frequently with new signups

11. **Flagged Entries** (`/actions/dashboard/get-flagged-entries.ts`) - **REVALIDATED** ✅
    - ✅ Move `mockFlaggedEntries` data
    - ✅ Add fraud detection filtering
    - ✅ **Revalidation Strategy**: `revalidateTag('flagged-entries')` every 5 minutes
    - ✅ **Reason**: Flagged entries change with fraud detection algorithms

12. **Time to Entry** (`/actions/dashboard/get-time-to-entry.ts`) - **REVALIDATED** ✅
    - ✅ Move `mockTimeToEntryDistribution` and `mockTimeToEntryTimeline`
    - ✅ Add timing analysis
    - ✅ **Revalidation Strategy**: `revalidateTag('time-to-entry')` every 30 minutes
    - ✅ **Reason**: Entry timing patterns change gradually over time

#### Priority 2 (User Management): Users System

13. **User Analytics** (`/actions/users/get-user-analytics.ts`) - **REVALIDATED**
    - Move `mockKPIs` from users page
    - Add user quality scoring
    - Add engagement metrics
    - **Revalidation Strategy**: `revalidateTag('user-analytics')` every 30 minutes
    - **Reason**: User analytics update with new engagement data and quality scores

14. **User Detail** (`/actions/users/get-user-detail.ts`) - **REVALIDATED**
    - Move user detail mock data from user-detail-sheet and user-detail-panel
    - Add individual user fetching
    - **Revalidation Strategy**: `revalidatePath('/app/users/[id]')` on user updates
    - **Reason**: User details change when user data is modified

15. **Export Options** (`/actions/users/get-export-options.ts`) - **CACHED**
    - Move mock export data from export-sheet
    - Add export configuration
    - **Caching Strategy**: Use `cache()` for export options
    - **Reason**: Export options are relatively static configuration data

16. **CRM Data** (`/actions/users/get-crm-data.ts`) - **CACHED**
    - Move mock CRM data from crm-sync-sheet
    - Add CRM integration data
    - **Caching Strategy**: Use `cache()` for CRM configuration
    - **Reason**: CRM mapping data changes infrequently

#### Priority 3 (Core Business): Sweepstakes Management

17. **Sweepstakes Overview** (`/actions/sweepstakes/get-sweepstakes-overview.ts`) - **REVALIDATED**
    - Move `mockOverviewKPIs` from sweepstakes page
    - Add overview statistics
    - **Revalidation Strategy**: `revalidateTag('sweepstakes-overview')` every 5 minutes
    - **Reason**: Overview KPIs change frequently with new sweepstakes activity

18. **Sweepstakes List** (`/actions/sweepstakes/get-sweepstakes-list.ts`) - **REVALIDATED**
    - Move `mockSweepstakesData` array from sweepstakes page
    - Add filtering and sorting
    - **Revalidation Strategy**: `revalidatePath('/app/sweepstakes')` on sweepstakes CRUD operations
    - **Reason**: Sweepstakes list changes when sweepstakes are created, updated, or deleted

19. **Sweepstakes Detail** (`/actions/sweepstakes/get-sweepstakes-detail.ts`) - **REVALIDATED**
    - Move individual sweepstakes mock data from [id]/page.tsx
    - Add detailed sweepstakes information
    - **Revalidation Strategy**: `revalidatePath('/app/sweepstakes/[id]')` on sweepstakes updates
    - **Reason**: Individual sweepstakes data changes with updates and new entries

20. **Sweepstakes KPIs** (`/actions/sweepstakes/get-sweepstakes-kpis.ts`) - **REVALIDATED**
    - Move mock KPI data from sweepstakes-kpi-cards
    - Add performance metrics
    - **Revalidation Strategy**: `revalidateTag('sweepstakes-kpis')` every 5 minutes
    - **Reason**: KPI data updates in real-time with new entries and conversions

21. **Sweepstakes Time Series** (`/actions/sweepstakes/get-sweepstakes-time-series.ts`) - **REVALIDATED**
    - Move time series mock data from sweepstakes-time-series-chart
    - Add temporal analytics
    - **Revalidation Strategy**: `revalidateTag('sweepstakes-time-series')` every 10 minutes
    - **Reason**: Time series data updates with ongoing sweepstakes activity

22. **Sweepstakes Funnel** (`/actions/sweepstakes/get-sweepstakes-funnel.ts`) - **REVALIDATED**
    - Move funnel mock data from sweepstakes-conversion-funnel
    - Add conversion tracking
    - **Revalidation Strategy**: `revalidateTag('sweepstakes-funnel')` every 10 minutes
    - **Reason**: Funnel data updates with new conversions and user flow

23. **Sweepstakes Bot Data** (`/actions/sweepstakes/get-sweepstakes-bot-data.ts`) - **REVALIDATED**
    - Move bot detection mock data from sweepstakes-bot-pie
    - Add fraud detection analytics
    - **Revalidation Strategy**: `revalidateTag('sweepstakes-bot-data')` every 10 minutes
    - **Reason**: Bot detection data updates with fraud analysis

24. **Sweepstakes Referrers** (`/actions/sweepstakes/get-sweepstakes-referrers.ts`) - **REVALIDATED**
    - Move referrer mock data from sweepstakes-top-referrers
    - Add traffic source analysis
    - **Revalidation Strategy**: `revalidateTag('sweepstakes-referrers')` every 15 minutes
    - **Reason**: Referrer data changes with new traffic sources

25. **Sweepstakes Users** (`/actions/sweepstakes/get-sweepstakes-users.ts`) - **REVALIDATED**
    - Move user mock data from sweepstakes-latest-users
    - Add user entry tracking
    - **Revalidation Strategy**: `revalidateTag('sweepstakes-users')` every 5 minutes
    - **Reason**: User entry data updates frequently with new submissions

26. **Sweepstakes Flagged** (`/actions/sweepstakes/get-sweepstakes-flagged.ts`) - **REVALIDATED**
    - Move flagged entries mock data from sweepstakes-flagged-entries
    - Add fraud detection data
    - **Revalidation Strategy**: `revalidateTag('sweepstakes-flagged')` every 5 minutes
    - **Reason**: Flagged entries change with fraud detection algorithms

27. **Sweepstakes Entries** (`/actions/sweepstakes/get-sweepstakes-entries.ts`) - **REVALIDATED**
    - Move entry mock data from sweepstakes-entries component
    - Add entry management
    - **Revalidation Strategy**: `revalidateTag('sweepstakes-entries')` on new entries
    - **Reason**: Entry data changes frequently with new submissions

28. **Sweepstakes Winners** (`/actions/sweepstakes/get-sweepstakes-winners.ts`) - **REVALIDATED**
    - Move winner mock data from sweepstakes-winners
    - Add winner selection data
    - **Revalidation Strategy**: `revalidatePath('/app/sweepstakes/[id]')` on winner selection
    - **Reason**: Winner data changes when winners are selected or updated

#### Priority 4 (Configuration): Settings

29. **Organization Data** (`/actions/settings/get-organization-data.ts`) - **CACHED**
    - Move `mockOrgData` from org-profile component
    - Add organization management
    - Add configuration options
    - **Caching Strategy**: Use `cache()` function for organization settings
    - **Reason**: Organization settings rarely change and can be cached for the request duration

#### Priority 5 (Public Facing): Marketing

30. **Featured Giveaways** (`/actions/marketing/get-featured-giveaways.ts`) - **CACHED**
    - Move featured carousel mock data from featured-carousel component
    - Add featured content management
    - **Caching Strategy**: Use `cache()` with 1-hour revalidation for featured listings
    - **Reason**: Featured giveaways don't change frequently and can benefit from caching

31. **Giveaway Grid** (`/actions/marketing/get-giveaway-grid.ts`) - **CACHED**
    - Move giveaway grid mock data from giveaway-grid component
    - Add public giveaway listings
    - **Caching Strategy**: Use `cache()` with 30-minute revalidation for public listings
    - **Reason**: Public giveaway grid updates less frequently than analytics

32. **All Giveaways** (`/actions/marketing/get-all-giveaways.ts`) - **CACHED**
    - Move all giveaways mock data from all-giveaways-grid component
    - Add comprehensive public listings
    - **Caching Strategy**: Use `cache()` with 30-minute revalidation for all listings
    - **Reason**: Complete giveaway listings update moderately and benefit from caching

## Implementation Details

### Server Action Patterns

#### Pattern 1: Auto-Cached Actions (Static/Slow-Changing Data)
```typescript
'use server';

import { revalidatePath } from 'next/cache';

interface ActionParams {
  // typed parameters
}

interface ActionResponse {
  // typed response
}

// Next.js automatically caches this function
// IMPORTANT: Each function must be a default export in its own file
const getStaticData = async (params: ActionParams): Promise<ActionResponse> => {
  // Server-side data fetching
  // Add proper error handling
  
  // Optionally revalidate on updates (called from mutation actions)
  // revalidatePath('/app/settings');
  
  return mockData; // Initially return mock data, later replace with DB calls
};

export default getStaticData;
```

#### Pattern 2: Auto-Cached + Revalidated Actions (Dynamic/Real-time Data)
```typescript
'use server';

import { revalidateTag } from 'next/cache';

interface ActionParams {
  // typed parameters
}

interface ActionResponse {
  // typed response
}

// Next.js automatically caches this function
// Use revalidation for data that changes frequently
// IMPORTANT: Each function must be a default export in its own file
const getDynamicData = async (
  params: ActionParams
): Promise<ActionResponse> => {
  // Server-side data fetching
  // Add proper error handling
  
  // Set up revalidation intervals using background processes or webhooks
  // This is typically done outside the action function
  
  return mockData; // Initially return mock data, later replace with DB calls
};

// Example: Background revalidation (implement separately)
// setInterval(() => revalidateTag('dashboard-kpis'), 5 * 60 * 1000);

export default getDynamicData;
```

### Component Migration Pattern

```typescript
// Before (Client Component)
'use client';
const mockData = [...];
export function Component() {
  return <div>{mockData.map(...)}</div>;
}

// After (Server Component with Suspense)
import { Suspense } from 'react';
import { getActionData } from '@/actions/...';

async function ComponentContent() {
  const data = await getActionData();
  return <div>{data.map(...)}</div>;
}

export function Component() {
  return (
    <Suspense fallback={<ComponentSkeleton />}>
      <ComponentContent />
    </Suspense>
  );
}
```

### Page-Level Migration Pattern

```typescript
// Before
'use client';
const mockData = [...];
export default function Page() {
  return <ComponentUsingMockData data={mockData} />;
}

// After
import { Suspense } from 'react';
import { getPageData } from '@/actions/...';

async function PageContent() {
  const data = await getPageData();
  return <ComponentUsingServerData data={data} />;
}

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent />
    </Suspense>
  );
}
```

## Required Component Changes

### 1. Convert Client Components to Server Components

- Remove `'use client'` directive where possible
- Move interactive logic to separate client components
- Implement proper component composition

### 2. Add Loading States

- Create skeleton components for each data-driven component
- Implement proper Suspense boundaries
- Add error boundaries for failed data fetching

### 3. Update Component Interfaces

- Remove mock data props from component interfaces
- Add proper TypeScript types from actions
- Ensure components can handle loading and error states

## Benefits of Migration

### Performance

- Reduced client bundle size (no mock data in JS)
- Server-side rendering for better initial page loads
- Reduced client-side processing

### Maintainability

- Centralized data management
- Easier to replace with real database calls later
- Better separation of concerns

### User Experience

- Faster initial page loads
- Proper loading states
- Better SEO with server-rendered content

### Development Experience

- Better TypeScript integration
- Easier testing of data logic
- Cleaner component architecture

## Technical Considerations

### Caching & Revalidation Strategy

**Next.js 15 Automatic Caching**: Next.js automatically caches server actions and components by default. We only need to use revalidation for cache invalidation when data changes.

#### All Actions Use Next.js Automatic Caching + Revalidation
- **Static Data**: Relies on Next.js automatic caching, rarely needs revalidation
- **Dynamic Data**: Uses automatic caching with frequent revalidation for freshness
- **Real-time Data**: Uses automatic caching with very frequent revalidation

#### Revalidation Intervals
```typescript
// High-frequency data (every 5 minutes)
revalidateTag('dashboard-kpis');
revalidateTag('sweepstakes-analytics');

// Medium-frequency data (every 10-15 minutes)  
revalidateTag('dashboard-charts');
revalidateTag('dashboard-analytics');

// Low-frequency data (every 30 minutes)
revalidateTag('user-analytics');

// Event-based revalidation (on mutations)
revalidatePath('/app/users'); // On user CRUD
revalidatePath('/app/sweepstakes'); // On sweepstakes CRUD
revalidateTag('sweepstakes-entries'); // On new entries
```

#### Implementation Example
```typescript
'use server';

// This action is automatically cached by Next.js
const getDashboardKPIs = async () => {
  // Fetch data - Next.js caches this automatically
  const data = await fetchKPIData();
  
  return data;
};

export default getDashboardKPIs;

// Revalidation happens externally via:
// - Background processes: setInterval(() => revalidateTag('dashboard-kpis'), 5 * 60 * 1000)
// - Webhooks: revalidateTag('dashboard-kpis') when data changes
// - User actions: revalidateTag('dashboard-kpis') after mutations
```

### Error Handling

- Implement proper error boundaries
- Add fallback UI for failed requests
- Log errors for monitoring

### Performance

- Implement streaming where appropriate
- Use Suspense for progressive loading
- Monitor Core Web Vitals impact

### Future Database Integration

- Design actions to easily swap mock data for DB calls
- Ensure proper data validation
- Plan for database schema requirements

## Caching vs Revalidation Summary

### ✅ Actions Using Cache() Pattern
| Action | File | Reason |
|--------|------|--------|
| Organization Data | `/actions/settings/get-organization-data.ts` | Rarely changes, good for request-level caching |
| Export Options | `/actions/users/get-export-options.ts` | Export configuration changes infrequently |
| CRM Data | `/actions/users/get-crm-data.ts` | CRM mapping data is relatively static |
| Featured Giveaways | `/actions/marketing/get-featured-giveaways.ts` | Featured content changes less frequently |
| Giveaway Grid | `/actions/marketing/get-giveaway-grid.ts` | Public listings update moderately |
| All Giveaways | `/actions/marketing/get-all-giveaways.ts` | Complete listings benefit from caching |

### 🔄 Actions Using Revalidation Pattern  
| Action | File | Revalidation Strategy | Reason |
|--------|------|---------------------|--------|
| Dashboard KPIs | `/actions/dashboard/get-dashboard-kpis.ts` | Every 5 minutes | Real-time metrics need frequent updates |
| Daily Engagement | `/actions/dashboard/get-daily-engagement.ts` | Every 10 minutes | Engagement data updates with activity |
| Bot Detection | `/actions/dashboard/get-bot-detection.ts` | Every 10 minutes | Bot detection updates with new entries |
| Conversion Funnel | `/actions/dashboard/get-conversion-funnel.ts` | Every 10 minutes | Funnel data updates with conversions |
| Referrer Data | `/actions/dashboard/get-referrer-data.ts` | Every 15 minutes | Referrer data changes with new traffic |
| Active Sweepstakes | `/actions/dashboard/get-active-sweepstakes.ts` | Every 5 minutes | Active data changes frequently |
| Heatmap Data | `/actions/dashboard/get-heatmap-data.ts` | Every 15 minutes | Entry patterns evolve over time |
| Geolocation Data | `/actions/dashboard/get-geolocation-data.ts` | Every 15 minutes | Geographic data updates with users |
| User Distribution | `/actions/dashboard/get-user-distribution.ts` | Every 30 minutes | Distribution patterns change gradually |
| Latest Users | `/actions/dashboard/get-latest-users.ts` | Every 2 minutes | Latest users update very frequently |
| Flagged Entries | `/actions/dashboard/get-flagged-entries.ts` | Every 5 minutes | Flagged entries change with detection |
| Time to Entry | `/actions/dashboard/get-time-to-entry.ts` | Every 30 minutes | Timing patterns change gradually |
| User Analytics | `/actions/users/get-user-analytics.ts` | Every 30 minutes | Analytics update with engagement |
| User Detail | `/actions/users/get-user-detail.ts` | On user updates | Individual user data changes |
| Sweepstakes Overview | `/actions/sweepstakes/get-sweepstakes-overview.ts` | Every 5 minutes | Overview KPIs change frequently |
| Sweepstakes List | `/actions/sweepstakes/get-sweepstakes-list.ts` | On CRUD operations | List changes with operations |
| Sweepstakes Detail | `/actions/sweepstakes/get-sweepstakes-detail.ts` | On updates | Individual data changes |
| Sweepstakes KPIs | `/actions/sweepstakes/get-sweepstakes-kpis.ts` | Every 5 minutes | KPIs update in real-time |
| Sweepstakes Time Series | `/actions/sweepstakes/get-sweepstakes-time-series.ts` | Every 10 minutes | Time series updates with activity |
| Sweepstakes Funnel | `/actions/sweepstakes/get-sweepstakes-funnel.ts` | Every 10 minutes | Funnel updates with conversions |
| Sweepstakes Bot Data | `/actions/sweepstakes/get-sweepstakes-bot-data.ts` | Every 10 minutes | Bot data updates with analysis |
| Sweepstakes Referrers | `/actions/sweepstakes/get-sweepstakes-referrers.ts` | Every 15 minutes | Referrer data changes with traffic |
| Sweepstakes Users | `/actions/sweepstakes/get-sweepstakes-users.ts` | Every 5 minutes | User entries update frequently |
| Sweepstakes Flagged | `/actions/sweepstakes/get-sweepstakes-flagged.ts` | Every 5 minutes | Flagged data changes with detection |
| Sweepstakes Entries | `/actions/sweepstakes/get-sweepstakes-entries.ts` | On new entries | Entry data changes with submissions |
| Sweepstakes Winners | `/actions/sweepstakes/get-sweepstakes-winners.ts` | On winner selection | Winner data changes with selection |

### Revalidation Tags Structure
```typescript
// High-frequency (2-5 min intervals)
'dashboard-kpis'
'latest-users'
'active-sweepstakes'
'sweepstakes-overview'
'sweepstakes-kpis'
'sweepstakes-users'
'sweepstakes-flagged'
'flagged-entries'

// Medium-frequency (10-15 min intervals)
'daily-engagement'
'bot-detection'
'conversion-funnel'
'referrer-data'
'heatmap-data'
'geolocation-data'
'sweepstakes-time-series'
'sweepstakes-funnel'
'sweepstakes-bot-data'
'sweepstakes-referrers'

// Low-frequency (30 min intervals)
'user-analytics'
'user-distribution'
'time-to-entry'

// Event-based (on mutations)
'/app/users' (path)
'/app/users/[id]' (path)
'/app/sweepstakes' (path)
'/app/sweepstakes/[id]' (path)
'sweepstakes-entries' (tag)
```

## Success Criteria

- [x] All 32 server actions created with individual files and default exports
- [x] **Dashboard mock data moved from client components to server actions (12/12 actions)** ✅
- [x] **Dashboard page implements proper Suspense boundaries** ✅
- [x] **Loading states implemented for all dashboard components** ✅
- [x] **Error handling implemented across all dashboard actions** ✅
- [x] **Caching implemented for all dashboard actions with appropriate strategies** ✅
- [x] **Revalidation implemented for all dashboard actions** ✅
- [x] **TypeScript coverage maintained - dashboard types fixed** ✅
- [x] **Dashboard functionality preserved and enhanced** ✅
- [x] Each action file contains only one default exported function
- [x] Proper file naming convention followed (get-[resource]-[type].ts)
- [ ] All remaining mock data moved from 40+ other client components to server actions
- [ ] All remaining pages implement proper Suspense boundaries  
- [ ] Performance metrics maintained or improved (pending full migration)
