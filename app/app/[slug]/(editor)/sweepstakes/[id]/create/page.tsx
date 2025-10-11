'use server';

import { SweepstakeFormPage } from '@/components/sweepstakes-editor/sweepstakes-form-page';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Sweepstakes | Giveaway.dog',
  description: 'Create a new sweepstakes',
  robots: {
    index: false,
    follow: false
  }
};

export default SweepstakeFormPage;
