'use server';

import { Suspense } from 'react';

import { Outline } from '@/components/app/outline';
import { TeamPageProps } from '@/schemas/pages';
import { ListPickersFilterSchema, toPickersFilter } from '../schemas/list';
import { CreatePickerButton } from '../components/create-picker-button';
import { PickersTable } from '../components/pickers-table';
import { PickersTabs } from '../components/pickers-tabs';
import { getPickersList } from '../procedures/get-pickers-list';
import getTeamFeatureFlags from '@/procedures/teams/get-team-feature-flags';
import { PICKERS_FEATURE_FLAG_KEY } from '@/schemas/feature-flags';
import { PickersFeatureDisabledCTA } from '../components/pickers-feature-disabled-cta';

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

  const featureFlagsResult = await getTeamFeatureFlags({ slug });

  if (!featureFlagsResult.ok) {
    return (
      <Outline title="Pickers">
        <div>Error loading team settings</div>
      </Outline>
    );
  }

  const pickersEnabled = featureFlagsResult.data.includes(
    PICKERS_FEATURE_FLAG_KEY
  );

  if (!pickersEnabled) {
    return (
      <Outline title="Pickers">
        <PickersFeatureDisabledCTA slug={slug} />
      </Outline>
    );
  }

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
  const list = await getPickersList({
    ...filters,
    slug: slug
  });

  if (!list.ok) {
    return <div>Error loading pickers: {list.data.message}</div>;
  }

  return <PickersTable data={list.data} />;
};
