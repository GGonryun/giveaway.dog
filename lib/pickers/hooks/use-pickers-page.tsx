import { useTeams } from '@/components/context/team-provider';
import { useUpdateParams } from '@/components/hooks/use-update-params';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

export const usePickersPage = () => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const updateParams = useUpdateParams();
  const { activeTeam } = useTeams();

  const listPath = useMemo(
    () => `/app/${activeTeam.slug}/pickers`,
    [activeTeam]
  );
  const createPath = useCallback(
    (id: string) => `${listPath}/${id}/create`,
    [listPath]
  );

  const navigateTo = (
    route:
      | { path: 'list' }
      | {
          path: 'create';
          id: string;
        }
  ) => {
    switch (route.path) {
      case 'list':
        router.push(listPath);
        break;
      case 'create':
        router.push(createPath(route.id));
        break;
    }
  };

  return {
    listPath,
    pathname,
    searchParams,
    updateParams,
    navigateTo
  };
};
