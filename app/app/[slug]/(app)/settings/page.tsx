'use server';

import { Outline } from '@/components/app/outline';
import { SettingsTabs } from './components/tabs';
import { Suspense } from 'react';

export default async function SettingsPage() {
  return (
    <Outline title="Settings">
      <Suspense>
        <SettingsTabs />
      </Suspense>
    </Outline>
  );
}
