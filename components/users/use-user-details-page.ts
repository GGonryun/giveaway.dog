import { useRouter } from 'next/navigation';
import { useTeams } from '../context/team-provider';
import { UserDetailsTabSchema } from '@/schemas/user';

export const useUserDetailsPage = () => {
  const { activeTeam } = useTeams();
  const router = useRouter();

  const route = (id: string) => `/app/${activeTeam.slug}/users/${id}`;
  const navigateTo = (id: string) => {
    router.push(route(id));
  };

  const setTab = (id: string, tab: UserDetailsTabSchema) => {
    const baseRoute = `${route(id)}/${tab}`;
    router.push(baseRoute);
  };

  return {
    route,
    navigateTo,
    setTab
  };
};
