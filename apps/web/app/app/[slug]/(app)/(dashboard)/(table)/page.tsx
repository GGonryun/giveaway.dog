'use server';

import { SweepstakesTable } from './components/sweepstakes-table';
import { Suspense } from 'react';
import { Skeleton } from '@giveaway/ui-primitives/skeleton';
import { Card } from '@giveaway/ui-primitives/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@giveaway/ui-primitives/table';
import getSweepstakesList from '@giveaway/sweepstakes-insights-server/get-sweepstakes-list';
import {
  ListSweepstakesFilters,
  toSweepstakesFilter
} from '@giveaway/sweepstakes-model/sweepstakes';
import { SweepstakesFilterBar } from './components/sweepstakes-filter-bar';
import { SweepstakesTabs } from './components/sweepstakes-tabs';
import { Outline } from '@/components/app/outline';
import { CreateGiveawayButton } from '@/components/sweepstakes/create-giveaway-button';
import type { Metadata } from 'next';
import { TeamPageProps } from '@giveaway/sweepstakes-model/pages';
import { TemplatesGrid } from '@/lib/templates/components/templates-grid';
import { getTemplates } from '@/lib/templates/procedures/get-templates';
import { TemplatesGridHeader } from '@/lib/templates/components/templates-grid-header';
import { SweepstakesGridSkeleton } from '@/lib/templates/components/templates-grid-skeleton';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Sweepstakes Dashboard | Giveaway.dog',
    description: 'View and manage all your sweepstakes',
    robots: {
      index: false,
      follow: false
    }
  };
}

type SweepstakesPageSearchParams = Promise<ListSweepstakesFilters>;

type SweepstakesPageProps = {
  params: Promise<TeamPageProps>;
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
        <div className="space-y-4 mt-8">
          <TemplatesGridHeader slug={slug} />
          <Suspense fallback={<SweepstakesGridSkeleton />}>
            {/* Future place for analytics or other components */}
            <TemplatesGridWrapper slug={slug} />
          </Suspense>
        </div>
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
  <div className="space-y-4">
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">
              <Skeleton className="h-4 w-24" />
            </TableHead>
            <TableHead className="w-[15%]">
              <Skeleton className="h-4 w-16" />
            </TableHead>
            <TableHead className="w-[15%]">
              <Skeleton className="h-4 w-20" />
            </TableHead>
            <TableHead className="w-[15%] text-right">
              <Skeleton className="h-4 w-20 ml-auto" />
            </TableHead>
            <TableHead className="w-[15%] text-right">
              <Skeleton className="h-4 w-16 ml-auto" />
            </TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-16 rounded-full" />
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-4 w-8 ml-auto" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-4 w-12 ml-auto" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-8 rounded-md" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  </div>
);

const TemplatesGridWrapper: React.FC<{ slug: string }> = async ({ slug }) => {
  const templates = await getTemplates({ slug });
  if (!templates.ok) {
    return (
      <div>There was an error loading templates: {templates.data.message}</div>
    );
  }
  return <TemplatesGrid slug={slug} items={templates.data} />;
};

export default SweepstakesPage;
