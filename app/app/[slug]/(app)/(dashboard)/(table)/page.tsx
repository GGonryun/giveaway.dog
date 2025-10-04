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
import { Outline } from '@/components/app/outline';
import { CreateGiveawayButton } from '@/components/sweepstakes/create-giveaway-button';

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
    <Outline title="Sweepstakes" action={<CreateGiveawayButton />}>
      <SweepstakesTabs filters={filters}>
        <SweepstakesFilterBar filters={filters} />
        <Suspense
          fallback={<SweepstakesTableSkeleton />}
          key={JSON.stringify(filters)}
        >
          <SweepstakesWrapper filters={filters} slug={slug} />
        </Suspense>
      </SweepstakesTabs>
    </Outline>
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

  return <SweepstakesTable data={list.data} filters={filters} />;
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
