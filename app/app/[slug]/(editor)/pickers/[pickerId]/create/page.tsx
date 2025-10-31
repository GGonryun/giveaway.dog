import { PickerForm } from '@/lib/pickers/components/picker-form';
import { DEFAULT_PICKER_CONFIG } from '@/lib/pickers/data/defaults';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Create Picker | Giveaway.dog',
    description: 'Create a new picker',
    robots: {
      index: false,
      follow: false
    }
  };
}

export default function CreatePickerPage() {
  return <PickerForm picker={DEFAULT_PICKER_CONFIG} teamFeatureFlags={[]} />;
}
