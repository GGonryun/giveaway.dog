import { SweepstakesTableWithFilters } from './components/sweepstakes-table';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import getSweepstakesList from '@/actions/sweepstakes/get-sweepstakes-list';

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

// Server component for sweepstakes table
async function SweepstakesTableSection() {
  const sweepstakesData = await getSweepstakesList();

  return <SweepstakesTableWithFilters sweepstakes={sweepstakesData} />;
}


export default function SweepstakesPage() {
  return (
    <div>
      {/* Sweepstakes Table with Filters */}
      <Suspense fallback={<SweepstakesTableSkeleton />}>
        <SweepstakesTableSection />
      </Suspense>
    </div>
  );
}
