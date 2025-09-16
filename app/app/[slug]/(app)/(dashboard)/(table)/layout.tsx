import React from 'react';
import { CreateGiveawayButton } from '@/components/sweepstakes/create-giveaway-button';
import { Outline } from '@/components/app/outline';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Outline
      title="Sweepstakes"
      className="space-y-4 pt-0 sm:pt-8"
      action={<CreateGiveawayButton />}
    >
      {children}
    </Outline>
  );
}
