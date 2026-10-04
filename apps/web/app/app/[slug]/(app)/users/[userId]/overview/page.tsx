'use server';

import { Suspense } from 'react';
import { UserDetailsOverview } from '../components/overview/user-details-overview';
import { UserDetailsOverviewSkeleton } from '../components/overview/user-details-overview-skeleton';
import { UserParams } from '../params';
import getUser from '@giveaway/account-server/get-user';
import { getTeamParticipant } from '@/lib/participant/procedures/get-team-participant';
import { getTeamTasks } from '@/lib/participant/procedures/get-team-tasks';
import { getUserSignals } from '@/procedures/user/get-user-signals';
import type { UserSignals } from '@/procedures/user/get-user-signals';

const IMPORTED_SOURCES = [
  'TWITTER_IMPORT',
  'BLUESKY_IMPORT',
  'DISCORD_IMPORT',
  'TWITCH_IMPORT'
] as const;

interface PageProps {
  params: Promise<UserParams>;
}

export default async function Page({ params }: PageProps) {
  const awaited = await params;

  return (
    <Suspense fallback={<UserDetailsOverviewSkeleton />}>
      <Wrapper {...awaited} />
    </Suspense>
  );
}

const Wrapper: React.FC<UserParams> = async ({ userId, slug }) => {
  const user = await getUser({ userId });
  const participant = await getTeamParticipant({ userId, slug });
  const tasks = await getTeamTasks({ slug });

  if (!user.ok) {
    return <div>Error loading user: {user.data.message}</div>;
  }
  if (!participant.ok) {
    return (
      <div>Error loading participant data: {participant.data.message}</div>
    );
  }
  if (!tasks.ok) {
    return <div>Error loading tasks: {tasks.data.message}</div>;
  }

  const isImported = (IMPORTED_SOURCES as readonly string[]).includes(
    participant.data.user.source
  );

  let signals: UserSignals | null = null;
  if (!isImported) {
    signals = await getUserSignals(userId);
  }

  return (
    <UserDetailsOverview
      slug={slug}
      participant={participant.data}
      totalTasks={tasks.data.length}
      signals={signals}
    />
  );
};
