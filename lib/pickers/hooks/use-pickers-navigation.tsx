import { useTeams } from '@/components/context/team-provider';
import { useUpdateParams } from '@/components/hooks/use-update-params';
import { useRouter } from 'next/navigation';

export const usePickersNavigation = () => {
  const router = useRouter();
  const { activeTeam } = useTeams();
  const updateParams = useUpdateParams();

  const editRoute = (pickerId: string, isV2?: boolean) =>
    isV2
      ? `/app/${activeTeam.slug}/pickers/x/${pickerId}/edit`
      : `/app/${activeTeam.slug}/pickers/twitter/${pickerId}/edit`;

  const detailsRoute = (pickerId: string, isV2?: boolean) =>
    isV2
      ? `/app/${activeTeam.slug}/pickers/x/${pickerId}`
      : `/app/${activeTeam.slug}/pickers/twitter/${pickerId}`;

  const navigateToDetails = (pickerId: string, isV2?: boolean) => {
    router.push(detailsRoute(pickerId, isV2));
  };

  const navigateToEdit = (pickerId: string, isV2?: boolean) => {
    router.push(editRoute(pickerId, isV2));
  };

  return {
    navigateToEdit,
    editRoute,
    navigateToDetails,
    detailsRoute,
    updateParams
  };
};
