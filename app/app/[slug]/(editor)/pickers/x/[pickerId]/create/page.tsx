import { CreateTwitterV2PickerPage } from '@/lib/pickers-v2/twitter-v2/pages/create-twitter-v2-picker-page';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Create X Picker | Giveaway.dog',
    description: 'Create a new X picker',
    robots: {
      index: false,
      follow: false
    }
  };
}

export default CreateTwitterV2PickerPage;
