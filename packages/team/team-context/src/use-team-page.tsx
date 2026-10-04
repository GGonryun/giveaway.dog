import { useRouter } from 'next/navigation';
import { setLastTeamSlugCookie } from '@giveaway/team-model/team/cookies';

const base = '/app';

export const useTeamPage = () => {
  const router = useRouter();

  const navigateToTeam = ({ slug }: { slug: string }) => {
    setLastTeamSlugCookie(slug);
    router.push(`${base}/${slug}`);
  };

  return {
    navigateToTeam
  };
};
