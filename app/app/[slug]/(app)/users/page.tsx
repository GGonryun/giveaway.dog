'use server';

import { Outline } from '@/components/app/outline';
import { UsersTable } from './components/users-table';

import type { Metadata } from 'next';
import { TeamPageProps } from '@/schemas/pages';
import { getTeamParticipants } from '@/lib/team-participant/procedures/get-team-participants';
import { getTeamTasks } from '@/lib/team-participant/procedures/get-team-tasks';

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

  const participants = await getTeamParticipants({
    ...resolvedParams
  });

  const tasks = await getTeamTasks({
    ...resolvedParams
  });

  if (!participants.ok) {
    return <div>Failed to load users: {participants.data.message}</div>;
  }

  if (!tasks.ok) {
    return <div>Failed to load tasks: {tasks.data.message}</div>;
  }

  return (
    <Outline title="Users">
      <UsersTable
        participants={participants.data}
        totalTasks={tasks.data.length}
      />
    </Outline>
  );
};

export default Page;
