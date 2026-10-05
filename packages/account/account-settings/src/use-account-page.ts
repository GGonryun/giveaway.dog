'use client';

import { useRouter } from 'next/navigation';
import { AccountTabSchema } from '@giveaway/user-model/account';

const base = '/account';

export const useAccountPage = () => {
  const router = useRouter();

  const route = (tab?: AccountTabSchema) => {
    return tab ? `${base}/${tab}` : base;
  };

  const navigateTo = (tab?: AccountTabSchema) => {
    router.push(route(tab));
  };

  const setTab = (tab: AccountTabSchema) => {
    router.push(route(tab));
  };

  return {
    route,
    navigateTo,
    setTab,
    navigateToAccountOverview: () => router.push(base),
    routes: {
      base,
      overview: base,
      profile: `${base}/profile`,
      history: `${base}/history`,
      features: `${base}/features`,
      appearance: `${base}/appearance`,
      notifications: `${base}/notifications`,
      dangerZone: `${base}/danger-zone`
    }
  };
};
