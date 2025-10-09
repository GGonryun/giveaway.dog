'use server';

import { redirect } from 'next/navigation';
import { DEFAULT_USER_DETAILS_TAB } from '@/lib/settings';

interface UserDetailPageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { slug, id } = await params;
  redirect(`/app/${slug}/users/${id}/${DEFAULT_USER_DETAILS_TAB}`);
}
