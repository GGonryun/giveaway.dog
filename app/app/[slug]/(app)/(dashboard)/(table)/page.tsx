'use server';

import { SweepstakesTable } from './components/sweepstakes-table';
import { Suspense } from 'react';
import { LoaderCircle, Trophy } from 'lucide-react';
import getSweepstakesList from '@/procedures/sweepstakes/get-sweepstakes-list';
import {
  ListSweepstakesFilters,
  toSweepstakesFilter
} from '@/schemas/sweepstakes';
import { SweepstakesFilterBar } from './components/sweepstakes-filter-bar';
import { SweepstakesTabs } from './components/sweepstakes-tabs';

type SweepstakesPageParams = Promise<{ slug: string }>;
type SweepstakesPageSearchParams = Promise<ListSweepstakesFilters>;

type SweepstakesPageProps = {
  params: SweepstakesPageParams;
  searchParams: SweepstakesPageSearchParams;
};

type SweepstakesPageComponent = React.FC<SweepstakesPageProps>;

const SweepstakesPage: SweepstakesPageComponent = async (props) => {
  const { slug } = await props.params;

  const resolvedSearchParams = await props.searchParams;
  const filters = toSweepstakesFilter(resolvedSearchParams);

  return (
    <div className="space-y-4">
      <SweepstakesTabs filters={filters} />
      <SweepstakesFilterBar filters={filters} />

      <Suspense
        fallback={<SweepstakesTableSkeleton />}
        key={JSON.stringify(filters)}
      >
        <SweepstakesWrapper filters={filters} slug={slug} />
      </Suspense>
    </div>
  );
};

const SweepstakesWrapper: React.FC<{
  filters: ListSweepstakesFilters;
  slug: string;
}> = async ({ filters, slug }) => {
  const list = await getSweepstakesList({
    ...filters,
    slug: slug
  });

  if (!list.ok) {
    return <div>There was an unexpected error loading sweepstakes...</div>;
  }

  return <SweepstakesTable sweepstakes={list.data} filters={filters} />;
};

const SweepstakesTableSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-center py-8">
      <div className="flex items-center space-x-3 text-muted-foreground">
        <Trophy className="h-5 w-5" />
        <LoaderCircle className="h-4 w-4 animate-spin" />
        <span className="text-sm font-medium">Loading sweepstakes...</span>
      </div>
    </div>
  </div>
);

export default SweepstakesPage;
