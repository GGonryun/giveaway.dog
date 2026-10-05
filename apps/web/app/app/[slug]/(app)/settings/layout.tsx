'use server';

import React from 'react';
import { Outline } from '@giveaway/shell-sidebar/app/outline';
import { TeamPageProps } from '@giveaway/sweepstakes-model/pages';
import { SettingsTabs } from '@giveaway/team-settings-shell/settings-tabs';

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
