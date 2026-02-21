'use server';

import { EditPickerPage } from '@/lib/pickers/twitter/pages/edit-picker-page';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Edit Picker | Giveaway.dog',
    description: 'Edit your picker',
    robots: {
      index: false,
      follow: false
    }
  };
}

export default EditPickerPage;
