# Cache Tag Example with Next.js 15

Now that you've enabled the experimental `cacheComponents: true` feature, here's how to use `cacheTag` in your server actions:

## Updated Server Action Pattern

```typescript
'use server';

import { unstable_cacheTag as cacheTag } from 'next/cache';

interface DashboardKPIData {
  entriesTotal: number;
  entriesChange: number;
  newUsers: number;
  newUsersChange: number;
  activeSweepstakes: number;
  botFilterRate: number;
}

const getDashboardKPIs = async (): Promise<DashboardKPIData> => {
  // Tag this cached data for targeted invalidation
  cacheTag('dashboard-kpis');

  // Your mock data (later replace with DB calls)
  const mockKPIData = {
    entriesTotal: 1247,
    entriesChange: 15.2,
    newUsers: 432,
    newUsersChange: 8.7,
    activeSweepstakes: 3,
    botFilterRate: 12.4
  };

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  return mockKPIData;
};

export default getDashboardKPIs;
```

## Cache Invalidation

When you need to invalidate the cache, use `revalidateTag`:

```typescript
import { revalidateTag } from 'next/cache';

// Invalidate specific tagged cache
revalidateTag('dashboard-kpis');
```

## Benefits of Cache Tags

1. **Granular Control**: Invalidate specific cached data instead of entire paths
2. **Performance**: Only revalidate what actually changed
3. **Flexibility**: Tag multiple related actions with the same tag
4. **Debugging**: Easier to track which cache is being invalidated

## Next Steps

Now you can proceed with the migration checklist, adding `cacheTag()` calls to each server action for targeted cache invalidation.
