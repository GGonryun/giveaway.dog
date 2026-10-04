import { Suspense } from 'react';
import { Outline } from '@/components/app/outline';
import { TeamPageProps } from '@giveaway/sweepstakes-model/pages';
import {
  ListPickersV2FilterSchema,
  toPickersV2Filter
} from '@giveaway/x-picker-model/schemas/list';
import { CreatePickerV2Button } from '@/lib/pickers/x/components/create-picker-v2-button';
import { PickersV2Table } from '@/lib/pickers/x/components/pickers-v2-table';
import { PickersV2Tabs } from '@/lib/pickers/x/components/pickers-v2-tabs';
import { getPickersV2List } from '@giveaway/x-picker-server/procedures/get-pickers-v2-list';
import { XPickersUpgradeCTA } from '@/lib/pickers/x/components/x-pickers-upgrade-cta';
import { hasMinimumTeamTier } from '@giveaway/team-model/team/util';
import { TeamTier } from '@prisma/client';
import db from '@giveaway/db-client/prisma';
import { auth } from '@giveaway/auth-server/config';

type XPickersPageProps = {
  params: Promise<TeamPageProps>;
  searchParams: Promise<ListPickersV2FilterSchema>;
};

export default async function XPickersPage(props: XPickersPageProps) {
  const { slug } = await props.params;
  const resolvedSearchParams = await props.searchParams;
  const session = await auth();

  if (!session?.user?.id) {
    return <div>Unauthorized</div>;
  }

  const team = await db.team.findFirst({
    where: {
      slug,
      members: {
        some: {
          userId: session.user.id
        }
      }
    },
    select: {
      tier: true
    }
  });

  if (!team) {
    return <div>Team not found</div>;
  }

  const hasProTier = hasMinimumTeamTier({
    tier: TeamTier.PRO,
    team
  });

  if (!hasProTier) {
    return <XPickersUpgradeCTA slug={slug} />;
  }

  const filters = toPickersV2Filter(resolvedSearchParams);

  return (
    <Outline title="X Picker" action={<CreatePickerV2Button />}>
      <PickersV2Tabs filters={filters}>
        <Suspense
          fallback={<div>Loading pickers...</div>}
          key={JSON.stringify(filters)}
        >
          <PickersWrapper filters={filters} slug={slug} />
        </Suspense>
      </PickersV2Tabs>
    </Outline>
  );
}

const PickersWrapper: React.FC<{
  filters: ListPickersV2FilterSchema;
  slug: string;
}> = async ({ filters, slug }) => {
  const list = await getPickersV2List({
    ...filters,
    slug: slug
  });

  if (!list.ok) {
    return <div>Error loading pickers: {list.data.message}</div>;
  }

  return <PickersV2Table data={list.data} />;
};
