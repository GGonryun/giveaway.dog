'use server';

import { Outline } from '@/components/app/outline';
import { SettingsTabs } from './components/tabs';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import getTeamFeatureFlags from '@/procedures/teams/get-team-feature-flags';
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

interface SettingsPageProps {
  params: Promise<TeamPageProps>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  return (
    <Outline title="Settings">
      <Suspense>
        <Wrapper params={params} />
      </Suspense>
    </Outline>
  );
}

const Wrapper: React.FC<{ params: Promise<TeamPageProps> }> = async ({
  params
}) => {
  const { slug } = await params;
  const flagsResult = await getTeamFeatureFlags({ slug });

  const teamFeatureFlags = flagsResult.ok ? flagsResult.data : [];

  return <SettingsTabs teamFeatureFlags={teamFeatureFlags} />;
};
