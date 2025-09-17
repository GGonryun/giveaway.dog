import { useRouter } from 'next/navigation';
import { useTeams } from '../context/team-provider';

export const useSweepstakesDetailsPage = () => {
  const { activeTeam } = useTeams();
  const router = useRouter();
  const route = (id: string) => `/app/${activeTeam.slug}/sweepstakes/${id}`;
  const navigateTo = (id: string) => {
    router.push(route(id));
  };
  return {
    route,
    navigateTo
  };
};
