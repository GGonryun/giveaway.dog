'use server';

import React from 'react';
import { Outline } from '@giveaway/shell-sidebar/app/outline';
import { UserDetailsTabs } from '@giveaway/audience-user-details/user-details-tabs';
import { UserParams } from '@giveaway/audience-user-details/params';
import { getTeamParticipant } from '@giveaway/participant-server/get-team-participant';
import { UNKNOWN_USER_NAME } from '@giveaway/app-config/settings';

interface UserDetailPageProps {
  params: Promise<UserParams>;
  children: React.ReactNode;
}

export default async function Layout({
  params,
  children
}: UserDetailPageProps) {
  const { userId, slug } = await params;

  const participant = await getTeamParticipant({ userId, slug });
  if (!participant.ok) {
    return <div>Error loading user: {participant.data.message}</div>;
  }

  return (
    <Outline title={participant.data.user.name || UNKNOWN_USER_NAME}>
      <UserDetailsTabs id={userId}>{children}</UserDetailsTabs>
    </Outline>
  );
}
