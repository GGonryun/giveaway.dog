import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTeams } from '../context/team-provider';
import { useMemo } from 'react';

export const useSweepstakesPage = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { activeTeam } = useTeams();

  const path = useMemo(
    () => `/app/${activeTeam.slug}/sweepstakes`,
    [activeTeam]
  );

  const computeSearchParams = (updater: (params: URLSearchParams) => void) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    updater(newSearchParams);
    return `${pathname}?${newSearchParams.toString()}`;
  };

  const updateParams = (updater: (params: URLSearchParams) => void) => {
    const newPathname = computeSearchParams(updater);
    router.push(newPathname);
    return newPathname;
  };

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
