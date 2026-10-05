'use server';

import { SweepstakeFormPage } from '@giveaway/sweepstakes-editor/sweepstakes-form-page';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Create Sweepstakes | Giveaway.dog',
    description: 'Create a new sweepstakes',
    robots: {
      index: false,
      follow: false
    }
  };
}

export default SweepstakeFormPage;
