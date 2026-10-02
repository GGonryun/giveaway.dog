import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTeams } from '../context/team-provider';
import { useMemo } from 'react';
import { useUpdateParams } from '../hooks/use-update-params';

export const useSweepstakesPage = () => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const updateParams = useUpdateParams();
  const { activeTeam } = useTeams();

  const path = useMemo(() => `/app/${activeTeam.slug}`, [activeTeam]);

  const navigateTo = () => {
    router.push(path);
  };

  return {
    path,
    pathname,
    searchParams,
    updateParams,
    navigateTo
  };
};
