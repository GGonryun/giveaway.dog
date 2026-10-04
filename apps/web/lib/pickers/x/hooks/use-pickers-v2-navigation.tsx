import { useTeams } from '@/components/context/team-provider';
import { useUpdateParams } from '@giveaway/ui-hooks/use-update-params';
import { useRouter } from 'next/navigation';

export const usePickersV2Navigation = () => {
  const router = useRouter();
  const { activeTeam } = useTeams();
  const updateParams = useUpdateParams();

  const editRoute = (pickerId: string) =>
    `/app/${activeTeam.slug}/pickers/x/${pickerId}/edit`;

  const detailsRoute = (pickerId: string) =>
    `/app/${activeTeam.slug}/pickers/x/${pickerId}`;

  const navigateToDetails = (pickerId: string) => {
    router.push(detailsRoute(pickerId));
  };

  const navigateToEdit = (pickerId: string) => {
    router.push(editRoute(pickerId));
  };

  return {
    navigateToEdit,
    editRoute,
    navigateToDetails,
    detailsRoute,
    updateParams
  };
};
