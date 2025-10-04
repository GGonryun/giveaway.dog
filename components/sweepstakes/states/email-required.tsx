'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { EmailVerification } from '@/components/auth/email-verification';
import { useGiveawayParticipation } from '../giveaway-participation-context';

export const EmailRequired: React.FC = () => {
  const { userProfile } = useGiveawayParticipation();
  const pathname = usePathname();

  if (!userProfile) {
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
        showCard={false}
        user={userProfile}
        redirectTo={pathname}
      />
    </div>
  );
};
