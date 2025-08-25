import { useRouter } from 'next/navigation';

const base = '/account';
const tab = 'tab';
export const useAccountPage = () => {
  const router = useRouter();
  return {
    navigateToAccountOverview: () => router.push(base),

    routes: {
      base,
      notifications: `${base}?${tab}=notifications`,
      settings: `${base}?${tab}=settings`,
      overview: base
    }
  };
};
