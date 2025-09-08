'use client';

import React from 'react';
import { useGiveawayParticipation } from './giveaway-participation-context';
import Link from 'next/link';

export const UserInfoSection: React.FC = () => {
  const { userProfile } = useGiveawayParticipation();

  if (!userProfile) return null;

  return (
    <div className="text-xs text-muted-foreground">
      {userProfile ? (
        <div className="flex justify-between">
          <div>
            Signed in as{' '}
            <Link href="/account" className="font-semibold">
              {userProfile.name}
            </Link>
          </div>
          <div className="gap-1.5 flex">
            <Link href="/account">Edit</Link>
            <Link href="/logout">Logout</Link>
          </div>
        </div>
      ) : (
        'Not signed in'
      )}
    </div>
  );
};
