import { useRouter } from 'next/navigation';
import { useTeams } from '@giveaway/team-context/team-provider';
import { SweepstakesTabSchema } from '@giveaway/sweepstakes-model/sweepstakes';

export const useSweepstakesDetailsPage = () => {
  const { activeTeam } = useTeams();
  const router = useRouter();

  const route = (id: string) => `/app/${activeTeam.slug}/sweepstakes/${id}`;
  const navigateTo = (id: string) => {
    router.push(route(id));
  };

  const setTab = (id: string, tab: SweepstakesTabSchema) => {
    const baseRoute = `${route(id)}/${tab}`;
    router.push(baseRoute);
  };

  return {
    route,
    navigateTo,
    setTab
  };
};
