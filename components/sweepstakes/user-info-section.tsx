'use client';

import React, { useMemo } from 'react';
import { useGiveawayParticipation } from './giveaway-participation-context';
import Link from 'next/link';
import { useLogout } from '../auth/use-logout';
import { usePathname } from 'next/navigation';
import { ProviderIcon } from '@/components/ui/patterns/provider-icon';
import { useBrowseSweepstakesPage } from './use-browse-sweepstakes-page';

export const UserInfoSection: React.FC = () => {
  const { userProfile } = useGiveawayParticipation();
  const logout = useLogout();
  const pathname = usePathname();

  const loginPath = useMemo(() => {
    const path = '/login';
    const params = new URLSearchParams();
    params.append('redirectTo', pathname);
    return `${path}?${params.toString()}`;
  }, [pathname]);

  return (
    <div className="text-xs text-muted-foreground">
      {userProfile ? (
        <div className="flex justify-between">
          <div className="flex items-center gap-1.5">
            <span>
              Signed in as{' '}
              <Link href="/account" className="font-semibold">
                {userProfile.name}
              </Link>
            </span>
            <div className="flex items-center gap-1">
              {/* Social provider icons */}
              {userProfile.providers?.map((provider) => (
                <div
                  key={provider}
                  className="w-4 h-4 rounded bg-white border border-border flex items-center justify-center"
                >
                  <ProviderIcon
                    type={provider as any}
                    className="w-2.5 h-2.5 text-foreground"
                  />
                </div>
              ))}
              {/* Email icon for verified email */}
              {userProfile.email && userProfile.emailVerified && (
                <div className="w-4 h-4 rounded bg-white border border-border flex items-center justify-center">
                  <ProviderIcon
                    type="email"
                    className="w-2.5 h-2.5 text-foreground"
                  />
                </div>
              )}
            </div>
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
        <div className="flex justify-between">
          <div>Not signed in</div>
          <Link href={loginPath} className="hover:underline">
            Sign In
          </Link>
        </div>
      )}
    </div>
  );
};
