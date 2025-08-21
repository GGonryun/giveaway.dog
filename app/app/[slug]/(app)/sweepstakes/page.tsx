import { SweepstakesTableWithFilters } from './components/sweepstakes-table';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Loading skeleton components
const SweepstakesTableSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-48" />
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  </div>
);

export default function SweepstakesPage() {
  return (
    <div>
      {/* Sweepstakes Table with Filters */}
      <Suspense fallback={<SweepstakesTableSkeleton />}>
        <SweepstakesTableWithFilters />
      </Suspense>
    </div>
  );
}
