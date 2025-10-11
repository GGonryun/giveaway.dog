'use server';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Entries | Giveaway.dog',
  description: 'View and manage sweepstakes entries',
  robots: {
    index: false,
    follow: false
  }
};

export default async function Page() {
  return null;
}
