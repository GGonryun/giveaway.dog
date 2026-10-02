'use server';

import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Entries | Giveaway.dog',
    description: 'View and manage sweepstakes entries',
    robots: {
      index: false,
      follow: false
    }
  };
}

export default async function Page() {
  return null;
}
