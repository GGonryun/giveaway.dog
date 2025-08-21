import { useRouter } from 'next/navigation';

const base = '/app';

export const useTeamPage = () => {
  const router = useRouter();

  const navigateToTeam = ({ slug }: { slug: string }) => {
    router.push(`${base}/${slug}`);
  };

  return {
    navigateToTeam
  };
};
