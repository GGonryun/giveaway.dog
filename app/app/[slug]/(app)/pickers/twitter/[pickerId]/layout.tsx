'use server';

import React from 'react';
import { Outline } from '@/components/app/outline';
import { PickerDetailsTabs } from '@/lib/pickers/components/picker-details-tabs';

interface PickerDetailLayoutProps {
  params: Promise<{ slug: string; pickerId: string }>;
  children: React.ReactNode;
}

export default async function Layout({
  params,
  children
}: PickerDetailLayoutProps) {
  const { pickerId } = await params;

  return (
    <Outline title="Picker">
      <PickerDetailsTabs pickerId={pickerId}>{children}</PickerDetailsTabs>
    </Outline>
  );
}
