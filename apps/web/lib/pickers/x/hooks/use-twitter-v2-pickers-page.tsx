import { useTeams } from '@/components/context/team-provider';
import { useUpdateParams } from '@giveaway/ui-hooks/use-update-params';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

export const useTwitterV2PickersPage = () => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const updateParams = useUpdateParams();
  const { activeTeam } = useTeams();

  const listPath = useMemo(
    () => `/app/${activeTeam.slug}/pickers/x`,
    [activeTeam]
  );
  const selectTypePath = useMemo(() => `${listPath}/create`, [listPath]);
  const createPath = useCallback(
    (id: string) => `${listPath}/x/${id}/create`,
    [listPath]
  );

  const navigateTo = (
    route:
      | { path: 'list' }
      | { path: 'select-type' }
      | {
          path: 'create';
          id: string;
        }
  ) => {
    switch (route.path) {
      case 'list':
        router.push(listPath);
        break;
      case 'select-type':
        router.push(selectTypePath);
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
