import { Suspense } from 'react';
import { Outline } from '@/components/app/outline';
import { TeamPageProps } from '@/schemas/pages';
import {
  ListPickersFilterSchema,
  toPickersFilter
} from '@/lib/pickers/schemas/list';
import { CreatePickerButton } from '@/lib/pickers/components/create-picker-button';
import { PickersTable } from '@/lib/pickers/components/pickers-table';
import { PickersTabs } from '@/lib/pickers/components/pickers-tabs';
import { getPickersLegacyList } from '@/lib/pickers/procedures/get-pickers-legacy-list';

type TwitterPickersPageProps = {
  params: Promise<TeamPageProps>;
  searchParams: Promise<ListPickersFilterSchema>;
};

export default async function TwitterPickersPage(
  props: TwitterPickersPageProps
) {
  const { slug } = await props.params;
  const resolvedSearchParams = await props.searchParams;

  const filters = toPickersFilter(resolvedSearchParams);

  return (
    <Outline title="Twitter Pickers" action={<CreatePickerButton />}>
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
}

const PickersWrapper: React.FC<{
  filters: ListPickersFilterSchema;
  slug: string;
}> = async ({ filters, slug }) => {
  const list = await getPickersLegacyList({
    ...filters,
    slug: slug
  });

  if (!list.ok) {
    return <div>Error loading pickers: {list.data.message}</div>;
  }

  return <PickersTable data={list.data} />;
};
