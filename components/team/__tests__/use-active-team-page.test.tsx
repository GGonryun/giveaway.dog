import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamRole, TeamTier } from '@prisma/client';
import { TeamsProvider } from '@/components/context/team-provider';
import type { DetailedUserTeam } from '@/schemas/teams';
import { useActiveTeam } from '../use-active-team-page';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn() }
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation.router
}));

const activeTeam: DetailedUserTeam = {
  id: 'team-1',
  name: 'Doggo Club',
  slug: 'doggo-club',
  logo: 'https://cdn.example.com/doggo.png',
  memberCount: 4,
  tier: TeamTier.PRO,
  role: TeamRole.ADMIN
};

const renderWithTeams = () =>
  renderHook(() => useActiveTeam(), {
    wrapper: ({ children }) => (
      <TeamsProvider value={{ activeTeam, teams: [activeTeam] }}>
        {children}
      </TeamsProvider>
    )
  });

describe('useActiveTeam', () => {
  beforeEach(() => {
    navigation.router.push.mockReset();
  });

  describe('when rendered inside a TeamsProvider', () => {
    it('exposes the active team details', () => {
      const { result } = renderWithTeams();

      expect(result.current).toMatchObject({
        id: 'team-1',
        name: 'Doggo Club',
        slug: 'doggo-club',
        role: TeamRole.ADMIN,
        memberCount: 4
      });
    });

    it('navigates to the active team dashboard', () => {
      const { result } = renderWithTeams();

      result.current.navigateToActiveTeam();

      expect(navigation.router.push).toHaveBeenCalledWith('/app/doggo-club');
    });
  });

  describe('when rendered outside a TeamsProvider', () => {
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('throws because there is no active team', () => {
      expect(() => renderHook(() => useActiveTeam())).toThrow(
        'useTeams must be used within <TeamsProvider>'
      );
    });
  });
});
