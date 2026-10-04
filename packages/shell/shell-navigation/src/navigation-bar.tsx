'use client';

import { useMemo } from 'react';
import { UserSchema } from '@giveaway/user-model/user';
import { LoggedInNavigationBar } from './logged-in-navigation-bar';
import { LoggedOutNavigationBar } from './logged-out-navigation-bar';

export const NavigationBar: React.FC<{ user: UserSchema | null }> = ({
  user
}) => {
  const isLoggedIn = useMemo(() => !!user?.id, [user?.id]);

  if (isLoggedIn && user) {
    return <LoggedInNavigationBar user={user} />;
  }

  return <LoggedOutNavigationBar />;
};
