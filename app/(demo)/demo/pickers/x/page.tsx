'use server';

import { MockTeamProvider } from '@/components/demo/mock-team-provider';
import { PickerForm } from '@/lib/pickers/components/picker-form';
import { PickerUnvalidatedFormSchema } from '@/lib/pickers/schemas/form';
import { TWITTER_POST_URL } from '@/lib/settings';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Twitter Picker Demo | Giveaway.dog',
    description: 'Try our Twitter picker tool with interactive demo',
    robots: {
      index: false,
      follow: false
    }
  };
}

const DEMO_PICKER_FORM: Omit<PickerUnvalidatedFormSchema, 'id'> = {
  setup: {
    postUrl: TWITTER_POST_URL,
    name: 'Win a $10 Steam Gift Card!',
    integrationId: 'demo-integration'
  },
  timing: null,
  winners: {
    quota: 3
  },
  actions: {
    like: true,
    repost: true,
    quote: true,
    reply: false
  },
  filters: {
    minimumPostCount: 10,
    minimumAccountAgeDays: 30,
    minimumFollowers: 100,
    minimumFollowing: null
  },
  requirements: {
    hasProfileImage: true,
    hasBanner: false,
    hasLocation: false,
    hasDescription: true
  }
};

const DEMO_INTEGRATIONS = [
  {
    id: 'demo-integration',
    label: 'Demo Twitter Account',
    url: null,
    provider: 'TWITTER' as const,
    status: 'ACTIVE' as const
  }
];

export default async function TwitterPickerDemoPage() {
  return (
    <Suspense>
      <MockTeamProvider>
        <PickerForm
          picker={DEMO_PICKER_FORM}
          teamFeatureFlags={[]}
          integrations={DEMO_INTEGRATIONS}
          isDemo={true}
        />
      </MockTeamProvider>
    </Suspense>
  );
}
