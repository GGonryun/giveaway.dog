'use client';

import React from 'react';
import { useGiveawayParticipation } from './giveaway-participation-context';
import Link from 'next/link';
import { useLogout } from '../auth/use-logout';
import { usePathname } from 'next/navigation';

export const UserInfoSection: React.FC = () => {
  const { userProfile } = useGiveawayParticipation();
  const logout = useLogout();
  const pathname = usePathname();

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
            <Link href="/account" className="hover:underline">
              Edit
            </Link>
            <span
              className="cursor-pointer hover:underline"
              onClick={() => {
                logout.run(pathname);
              }}
            >
              Logout
            </span>
          </div>
        </div>
      ) : (
        'Not signed in'
      )}
    </div>
  );
};
