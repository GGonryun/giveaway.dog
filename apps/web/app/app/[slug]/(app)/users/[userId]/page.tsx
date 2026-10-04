'use server';

import { redirect } from 'next/navigation';
import { DEFAULT_USER_DETAILS_TAB } from '@giveaway/user-model/user';
import { UserParams } from './params';

interface UserDetailPageProps {
  params: Promise<UserParams>;
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { slug, userId } = await params;
  redirect(`/app/${slug}/users/${userId}/${DEFAULT_USER_DETAILS_TAB}`);
}
