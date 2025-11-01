'use server';

import React from 'react';
import { Outline } from '@/components/app/outline';
import { TeamPageProps } from '@/schemas/pages';
import { SettingsTabs } from '@/lib/settings/components/settings-tabs';

interface PickerDetailLayoutProps {
  params: Promise<TeamPageProps>;
  children: React.ReactNode;
}

export default async function Layout({
  params,
  children
}: PickerDetailLayoutProps) {
  const { slug } = await params;

  return (
    <Outline title="Team Settings">
      <SettingsTabs slug={slug}>{children}</SettingsTabs>
    </Outline>
  );
}
