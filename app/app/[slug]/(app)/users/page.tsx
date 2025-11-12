'use server';

import { Outline } from '@/components/app/outline';
import { UsersTable } from './components/users-table';
import getParticipatingUsers from '@/procedures/users/get-participating-users';
import type { Metadata } from 'next';
import { TeamPageProps } from '@/schemas/pages';

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
};

const Page: React.FC<Props> = async ({ params }) => {
  const resolvedParams = await params;

  const result = await getParticipatingUsers({
    ...resolvedParams
  });

  if (!result.ok) {
    return <div>Failed to load users: {result.data.message}</div>;
  }

  return (
    <Outline title="Users">
      <UsersTable users={result.data.users} />
    </Outline>
  );
};

export default Page;
