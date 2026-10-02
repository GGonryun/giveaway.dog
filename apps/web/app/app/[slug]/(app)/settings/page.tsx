'use server';

import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { DEFAULT_SETTINGS_TAB } from '@/lib/settings/schemas/tabs';
import { TeamPageProps } from '@/schemas/pages';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Settings | Giveaway.dog',
    description: 'Manage your account and team settings',
    robots: {
      index: false,
      follow: false
    }
  };
}

interface PickerDetailPageProps {
  params: Promise<TeamPageProps>;
}

export default async function Page({ params }: PickerDetailPageProps) {
  const { slug } = await params;
  redirect(`/app/${slug}/settings/${DEFAULT_SETTINGS_TAB}`);
}
