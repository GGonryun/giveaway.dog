'use server';

import { Outline } from '@/components/app/outline';
import { UsersTable } from './components/users-table';
import getParticipatingUsers from '@/procedures/users/get-participating-users';
import { SlugPageParams } from '../../layout';

export type UsersPageSearchParams = {
  search?: string;
  page?: string;
  sortField?: string;
  sortDirection?: string;
  status?: string;
  dateRange?: string;
  minScore?: string;
  maxScore?: string;
};

type UsersPageParams = {
  params: Promise<SlugPageParams>;
  searchParams: Promise<UsersPageSearchParams>;
};

const Page: React.FC<UsersPageParams> = async ({ params, searchParams }) => {
  const resolvedSearchParams = await searchParams;
  const resolvedParams = await params;

  const filters = {
    search: resolvedSearchParams.search || '',
    page: resolvedSearchParams.page || '1',
    sortField: resolvedSearchParams.sortField || 'lastEntryAt',
    sortDirection: resolvedSearchParams.sortDirection || 'desc',
    status: resolvedSearchParams.status || 'all',
    dateRange: resolvedSearchParams.dateRange || 'all',
    minScore: resolvedSearchParams.minScore || '0',
    maxScore: resolvedSearchParams.maxScore || '100'
  };

  const numericFilters = {
    ...filters,
    page: parseInt(filters.page, 10),
    sortDirection: filters.sortDirection as 'asc' | 'desc',
    minScore: parseInt(filters.minScore, 10),
    maxScore: parseInt(filters.maxScore, 10)
  };

  const result = await getParticipatingUsers({
    ...resolvedParams,
    ...numericFilters
  });

  if (!result.ok) {
    return <div>Failed to load users: {result.data.message}</div>;
  }

  return (
    <Outline title="Users" container={true}>
      <UsersTable
        users={result.data.users}
        totalUsers={result.data.totalUsers}
        totalPages={result.data.totalPages}
        currentPage={numericFilters.page}
        filters={numericFilters}
      />
    </Outline>
  );
};

export default Page;
