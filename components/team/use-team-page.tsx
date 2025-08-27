import { useRouter } from 'next/navigation';
import { useTeams } from '../context/team-provider';

const base = '/app';

export const useTeamPage = () => {
  const router = useRouter();
  const { activeTeam } = useTeams();

  const navigateToTeam = ({ slug }: { slug: string }) => {
    router.push(`${base}/${slug}`);
  };

  const navigateToActiveTeam = () => {
    return navigateToTeam(activeTeam);
  };

  return {
    navigateToTeam,
    navigateToActiveTeam
  };
};
