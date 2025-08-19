import { SweepstakesOverviewKPIs } from './components/sweepstakes-overview-kpis';
import { SweepstakesMobileKPIs } from './components/sweepstakes-mobile-kpis';
import { SweepstakesTableWithFilters } from './components/sweepstakes-table';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import getSweepstakesOverview from '@/actions/sweepstakes/get-sweepstakes-overview';
import getSweepstakesList from '@/actions/sweepstakes/get-sweepstakes-list';

// Loading skeleton components
const SweepstakesOverviewSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>
    ))}
  </div>
);

const SweepstakesTableSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-48" />
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  </div>
);

// Server component for overview KPIs
async function SweepstakesOverviewSection() {
  const overviewData = await getSweepstakesOverview();

  return (
    <>
      {/* Desktop Analytics */}
      <div className="hidden md:block">
        <SweepstakesOverviewKPIs data={overviewData} />
      </div>

      {/* Mobile Analytics */}
      <div className="md:hidden">
        <SweepstakesMobileKPIs data={overviewData} />
      </div>
    </>
  );
}

// Server component for sweepstakes table
async function SweepstakesTableSection() {
  const sweepstakesData = await getSweepstakesList();

  return <SweepstakesTableWithFilters sweepstakes={sweepstakesData} />;
}

export default function SweepstakesPage() {
  return (
    <div className="space-y-6">
      {/* Overview KPIs */}
      <Suspense fallback={<SweepstakesOverviewSkeleton />}>
        <SweepstakesOverviewSection />
      </Suspense>

      {/* Sweepstakes Table with Filters */}
      <Suspense fallback={<SweepstakesTableSkeleton />}>
        <SweepstakesTableSection />
      </Suspense>
    </div>
  );
}
