import { useTeams } from '../context/team-provider';

import { useRouter } from 'next/navigation';

export const useCreateSweepstakesPage = () => {
  const router = useRouter();
  const { activeTeam } = useTeams();

  const route = (id: string) =>
    `/app/${activeTeam.slug}/sweepstakes/${id}/create`;

  const navigateTo = (id: string) => {
    router.push(route(id));
  };
  return {
    navigateTo,
    route
  };
};
