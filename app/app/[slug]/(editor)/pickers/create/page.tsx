import { SelectPickerType } from '@/lib/pickers/components/select-picker-type';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Select Picker Type | Giveaway.dog',
    description: 'Choose the type of picker to create',
    robots: {
      index: false,
      follow: false
    }
  };
}

interface SelectPickerTypePageProps {
  params: Promise<{ slug: string }>;
}

export default async function SelectPickerTypePage({
  params
}: SelectPickerTypePageProps) {
  const { slug } = await params;

  return <SelectPickerType slug={slug} />;
}
