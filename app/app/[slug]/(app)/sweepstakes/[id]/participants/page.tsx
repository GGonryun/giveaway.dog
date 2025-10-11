'use server';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Participants | Giveaway.dog',
  description: 'View sweepstakes participants',
  robots: {
    index: false,
    follow: false
  }
};

export default async function Page() {
  return null;
}
