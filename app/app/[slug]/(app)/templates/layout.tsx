import { Outline } from '@/components/app/outline';
import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Templates | Giveaway.dog',
  description: 'Browse sweepstakes templates',
  robots: {
    index: false,
    follow: false
  }
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Outline title="Templates" className="space-y-4">
      {children}
    </Outline>
  );
}
