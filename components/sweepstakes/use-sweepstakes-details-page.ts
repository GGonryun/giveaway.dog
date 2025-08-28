import { useTeams } from '../context/team-provider';

export const useSweepstakesDetailsPage = () => {
  const { activeTeam } = useTeams();
  const route = (id: string) => `/app/${activeTeam.slug}/sweepstakes/${id}`;
  return {
    route
  };
};
