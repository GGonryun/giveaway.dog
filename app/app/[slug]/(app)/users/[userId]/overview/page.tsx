'use server';

import { Suspense } from 'react';
import { UserDetailsOverview } from '../components/overview/user-details-overview';
import getParticipatingUser from '@/procedures/users/get-participating-user';
import { UserParams } from '../params';
import getUser from '@/procedures/user/get-user';

interface PageProps {
  params: Promise<UserParams>;
}

export default async function Page({ params }: PageProps) {
  const awaited = await params;

  return (
    <Suspense fallback={<div>Loading Overview...</div>}>
      <Wrapper {...awaited} />
    </Suspense>
  );
}

const Wrapper: React.FC<UserParams> = async ({ userId, slug }) => {
  const user = await getUser({ userId });
  const participant = await getParticipatingUser({ userId, slug });

  if (!user.ok) {
    return <div>Error loading user: {user.data.message}</div>;
  }
  if (!participant.ok) {
    return (
      <div>Error loading participant data: {participant.data.message}</div>
    );
  }

  return (
    <UserDetailsOverview
      slug={slug}
      participant={participant.data}
      user={user.data}
    />
  );
};
