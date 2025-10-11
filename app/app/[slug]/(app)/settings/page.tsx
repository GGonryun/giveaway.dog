'use server';

import { Outline } from '@/components/app/outline';
import { SettingsTabs } from './components/tabs';
import { Suspense } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings | Giveaway.dog',
  description: 'Manage your account and team settings',
  robots: {
    index: false,
    follow: false
  }
};

export default async function SettingsPage() {
  return (
    <Outline title="Settings">
      <Suspense>
        <SettingsTabs />
      </Suspense>
    </Outline>
  );
}
