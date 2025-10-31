'use server';

import { redirect } from 'next/navigation';
import { DEFAULT_PICKER_TAB } from '@/lib/pickers/schemas/tabs';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Picker Overview | Giveaway.dog',
    description: 'View picker details and manage entries',
    robots: {
      index: false,
      follow: false
    }
  };
}

interface PickerDetailPageProps {
  params: Promise<{ slug: string; pickerId: string }>;
}

export default async function PickerDetailPage({
  params
}: PickerDetailPageProps) {
  const { slug, pickerId } = await params;
  redirect(`/app/${slug}/pickers/${pickerId}/${DEFAULT_PICKER_TAB}`);
}
