'use server';

import React from 'react';
import { Outline } from '@/components/app/outline';
import { UserDetailsTabs } from '@/components/users/user-details-tabs';
import { UserParams } from './params';
import getUser from '@/procedures/user/get-user';
import { UNKNOWN_USER_NAME } from '@/lib/settings';

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
