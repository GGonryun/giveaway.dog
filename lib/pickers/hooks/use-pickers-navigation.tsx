import { useTeams } from '@/components/context/team-provider';
import { useUpdateParams } from '@/components/hooks/use-update-params';
import { useRouter } from 'next/navigation';

export const usePickersNavigation = () => {
  const router = useRouter();
  const { activeTeam } = useTeams();
  const updateParams = useUpdateParams();

  const editRoute = (id: string) =>
    `/app/${activeTeam.slug}/pickers/${id}/edit`;

  const detailsRoute = (id: string) => `/app/${activeTeam.slug}/pickers/${id}`;

  const navigateToDetails = (id: string) => {
    router.push(detailsRoute(id));
  };

  const navigateToEdit = (id: string) => {
    router.push(editRoute(id));
  };

  return {
    navigateToEdit,
    editRoute,
    navigateToDetails,
    detailsRoute,
    updateParams
  };
};
