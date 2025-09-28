'use server';

import { Outline } from '@/components/app/outline';
import { SettingsTabs } from './components/tabs';
import { Suspense } from 'react';

export default async function SettingsPage() {
  return (
    <Outline
      title="Settings"
      className="pt-0 sm:pt-0 sm:pb-8"
      container={false}
    >
      <Suspense>
        <SettingsTabs />
      </Suspense>
    </Outline>
  );
}
