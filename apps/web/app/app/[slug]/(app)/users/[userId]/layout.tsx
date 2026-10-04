'use server';

import React from 'react';
import { Outline } from '@giveaway/shell-sidebar/app/outline';
import { UserDetailsTabs } from '@giveaway/audience-user-details/user-details-tabs';
import { UserParams } from '@giveaway/audience-user-details/params';
import getUser from '@giveaway/account-server/get-user';
import { UNKNOWN_USER_NAME } from '@giveaway/app-config/settings';

interface UserDetailPageProps {
  params: Promise<UserParams>;
  children: React.ReactNode;
}

export default async function Layout({
  params,
  children
}: UserDetailPageProps) {
  const { userId } = await params;

  const user = await getUser({ userId });
  if (!user.ok) {
    return <div>Error loading user: {user.data.message}</div>;
  }

  return (
    <Outline title={user.data.name || UNKNOWN_USER_NAME}>
      <UserDetailsTabs id={userId}>{children}</UserDetailsTabs>
    </Outline>
  );
}
