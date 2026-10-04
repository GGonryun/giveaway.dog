'use client';

import React from 'react';
import { useUser } from '@giveaway/account-context/user-provider';
import { EmailVerification } from '../auth/email-verification';
import { SocialProviders } from '@/lib/auth/components/social-providers';
import { UpdateProfileImage } from './update-profile-image';
import { UpdateDisplayName } from './update-display-name';
import { UpdatePreferredContact } from './update-preferred-contact';

export const UserSettings = () => {
  const user = useUser();

  return (
    <div className="space-y-4">
      <UpdateProfileImage />
      <UpdateDisplayName />
      <UpdatePreferredContact />
      <EmailVerification
        verifyEmail
        user={user}
        redirectTo="/account"
        showCard={true}
        verificationText="Improve your account security by verifying your email address."
      />
      <SocialProviders />
    </div>
  );
};
