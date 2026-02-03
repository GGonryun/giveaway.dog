'use server';

import React from 'react';
import { Outline } from '@/components/app/outline';

interface PickerDetailLayoutProps {
  params: Promise<{ slug: string; pickerId: string }>;
  children: React.ReactNode;
}

export default async function Layout({
  params,
  children
}: PickerDetailLayoutProps) {
  return <Outline title="X Picker">{children}</Outline>;
}
