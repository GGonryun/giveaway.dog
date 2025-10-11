'use server';

import { SweepstakeFormPage } from '@/components/sweepstakes-editor/sweepstakes-form-page';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Edit Sweepstakes | Giveaway.dog',
    description: 'Edit your sweepstakes',
    robots: {
      index: false,
      follow: false
    }
  };
}

export default SweepstakeFormPage;
