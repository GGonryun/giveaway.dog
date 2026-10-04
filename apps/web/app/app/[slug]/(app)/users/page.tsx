import { Suspense } from 'react';
import { Outline } from '@giveaway/shell-sidebar/app/outline';
import { UsersTableWrapper } from './components/users-table-wrapper';
import { UsersTableSkeleton } from './components/users-table-skeleton';

import type { Metadata } from 'next';
import { TeamPageProps } from '@giveaway/sweepstakes-model/pages';
import {
  parseUsersSearchParams,
  type UsersSearchParams
} from './lib/parse-search-params';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Users | Giveaway.dog',
    description: 'Manage users and participants',
    robots: {
      index: false,
      follow: false
    }
  };
}

type Props = {
  params: Promise<TeamPageProps>;
  searchParams: Promise<UsersSearchParams>;
};

const Page: React.FC<Props> = async ({ params, searchParams }) => {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const parsedParams = parseUsersSearchParams(resolvedSearchParams);

  return (
    <Outline title="Users">
      <Suspense fallback={<UsersTableSkeleton />}>
        <UsersTableWrapper
          teamParams={resolvedParams}
          parsedParams={parsedParams}
        />
      </Suspense>
    </Outline>
  );
};

export default Page;
