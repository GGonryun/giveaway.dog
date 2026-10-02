'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { EmailVerification } from '@/components/auth/email-verification';
import { useGiveawayParticipation } from '../giveaway-participation-context';

export const EmailRequired: React.FC = () => {
  const { participant, verifyEmail } = useGiveawayParticipation();
  const pathname = usePathname();

  if (!participant) {
    return (
      <div>
        <div className="text-center">
          <h3 className="text-lg font-semibold">Email Verification Required</h3>
          <p className="text-muted-foreground">
            Please log in to verify your email for this giveaway.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <EmailVerification
        verifyEmail={verifyEmail}
        showCard={false}
        user={participant.user}
        redirectTo={pathname}
      />
    </div>
  );
};
