'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { LoginOptions } from '@/components/auth/login-options';

export const NotLoggedIn: React.FC = () => {
  const pathname = usePathname();

  return (
    <div className="my-4 space-y-2">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Login Required</h3>
        <p className="text-muted-foreground">
          You need to log in to participate in this giveaway.
        </p>
      </div>
      <div className="flex max-w-xs mx-auto">
        <LoginOptions className="grow" redirectTo={pathname} />
      </div>
    </div>
  );
};
