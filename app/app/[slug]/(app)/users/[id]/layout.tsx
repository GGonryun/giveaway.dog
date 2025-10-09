'use server';

import React from 'react';
import { Outline } from '@/components/app/outline';
import { UserDetailsTabs } from '@/components/users/user-details-tabs';

interface UserDetailPageProps {
  params: Promise<{ id: string; slug: string }>;
  children: React.ReactNode;
}

export default async function Layout({
  params,
  children
}: UserDetailPageProps) {
  const { id } = await params;

  return (
    <Outline title={`User ${id.replace('user_', '')}`}>
      <UserDetailsTabs id={id}>{children}</UserDetailsTabs>
    </Outline>
  );
}
