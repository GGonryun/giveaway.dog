'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useGiveawayParticipation } from '../giveaway-participation-context';
import Link from 'next/link';

export const NotEligible: React.FC = () => {
  const { sweepstakes } = useGiveawayParticipation();

  return (
    <div className="text-center my-4">
      <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
      <h3 className="text-lg font-semibold mb-2">Not Eligible</h3>
      <p className="text-muted-foreground mb-4">
        You are not eligible to participate in this giveaway due to age, region,
        or other restrictions.
      </p>
      <p className="text-sm text-muted-foreground">
        If you believe this is an error, please contact{' '}
        <Link href="/support" className="underline">
          support
        </Link>
        .
      </p>
    </div>
  );
};
