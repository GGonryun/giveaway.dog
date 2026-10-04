import { EditTwitterV2PickerPage } from '@giveaway/x-picker-editor/pages/edit-twitter-v2-picker-page';
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
