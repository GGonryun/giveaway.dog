'use server';

import { Suspense } from 'react';

import { Outline } from '@/components/app/outline';
import { TeamPageProps } from '@/schemas/pages';
import { ListPickersFilterSchema, toPickersFilter } from '../schemas/list';
import { CreatePickerButton } from '../components/create-picker-button';
import { PickersTable } from '../components/pickers-table';
import { PickersTabs } from '../components/pickers-tabs';
import { getPickersLegacyList } from '../procedures/get-pickers-legacy-list';
import { getPickersV2List } from '@/lib/pickers-v2/twitter-v2/procedures/get-pickers-v2-list';

type PickersListPageProps = {
  params: Promise<TeamPageProps>;
  searchParams: Promise<ListPickersFilterSchema>;
};

export const PickersListPage: React.FC<PickersListPageProps> = async (
  props
) => {
  const { slug } = await props.params;
  const resolvedSearchParams = await props.searchParams;

  const filters = toPickersFilter(resolvedSearchParams);

  return (
    <Outline title="Pickers" action={<CreatePickerButton />}>
      <PickersTabs filters={filters}>
        <Suspense
          fallback={<div>Loading pickers...</div>}
          key={JSON.stringify(filters)}
        >
          <PickersWrapper filters={filters} slug={slug} />
        </Suspense>
      </PickersTabs>
    </Outline>
  );
};

const PickersWrapper: React.FC<{
  filters: ListPickersFilterSchema;
  slug: string;
}> = async ({ filters, slug }) => {
  const [legacyList, v2List] = await Promise.all([
    getPickersLegacyList({
      status: filters.status,
      type: filters.type,
      slug: slug
    }),
    getPickersV2List({
      status: filters.status,
      slug: slug
    })
  ]);

  if (!legacyList.ok) {
    return <div>Error loading legacy pickers: {legacyList.data.message}</div>;
  }

  if (!v2List.ok) {
    return <div>Error loading v2 pickers: {v2List.data.message}</div>;
  }

  const allPickers = [...legacyList.data.pickers, ...v2List.data.pickers].sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
  );

  return <PickersTable data={{ pickers: allPickers }} />;
};
