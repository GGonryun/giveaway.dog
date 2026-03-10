import { useRouter } from 'next/navigation';
import { setLastTeamSlugCookie } from '@/lib/team/cookies';

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
