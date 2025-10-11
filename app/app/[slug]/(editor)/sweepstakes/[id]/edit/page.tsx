'use server';

import { SweepstakeFormPage } from '@/components/sweepstakes-editor/sweepstakes-form-page';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Edit Sweepstakes | Giveaway.dog',
  description: 'Edit your sweepstakes',
  robots: {
    index: false,
    follow: false
  }
};

export default SweepstakeFormPage;
