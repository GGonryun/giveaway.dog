import { EditTwitterV2PickerPage } from '@/lib/pickers-v2/twitter-v2/pages/edit-twitter-v2-picker-page';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Edit X Picker | Giveaway.dog',
    description: 'Edit X picker',
    robots: {
      index: false,
      follow: false
    }
  };
}

export default EditTwitterV2PickerPage;
