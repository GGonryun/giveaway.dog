'use server';

import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { DEFAULT_SETTINGS_TAB } from '@giveaway/team-settings-shell/schemas/tabs';
import { TeamPageProps } from '@giveaway/sweepstakes-model/pages';

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
