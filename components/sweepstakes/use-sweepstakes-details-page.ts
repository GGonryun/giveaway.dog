import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTeams } from '../context/team-provider';
import { SweepstakesTabSchema } from '@/schemas/sweepstakes';

export const useSweepstakesDetailsPage = () => {
  const { activeTeam } = useTeams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

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
