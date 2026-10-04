import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamRole, TeamTier } from '@prisma/client';
import { TeamsProvider } from '@/components/context/team-provider';
import type { DetailedUserTeam } from '@giveaway/team-model/teams';
import { useUserDetailsPage } from '../use-user-details-page';

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

const renderPage = () =>
  renderHook(() => useUserDetailsPage(), {
    wrapper: ({ children }) => (
      <TeamsProvider value={{ activeTeam, teams: [activeTeam] }}>
        {children}
      </TeamsProvider>
    )
  });

describe('useUserDetailsPage', () => {
  beforeEach(() => {
    navigation.router.push.mockReset();
  });

  afterEach(() => {
    window.history.replaceState({}, '', '/');
  });

  describe('route', () => {
    it('builds the user details path within the active team', () => {
      const { result } = renderPage();

      expect(result.current.route('user-42')).toBe(
        '/app/doggo-club/users/user-42'
      );
    });
  });

  describe('navigateTo', () => {
    it('navigates to the user details page', () => {
      const { result } = renderPage();

      result.current.navigateTo('user-42');

      expect(navigation.router.push).toHaveBeenCalledWith(
        '/app/doggo-club/users/user-42'
      );
    });
  });

  describe('setTab', () => {
    it('updates the browser url right away', () => {
      const { result } = renderPage();

      result.current.setTab('user-42', 'entries');

      expect(window.location.pathname).toBe(
        '/app/doggo-club/users/user-42/entries'
      );
    });

    it('navigates to the tab', () => {
      const { result } = renderPage();

      result.current.setTab('user-42', 'overview');

      expect(navigation.router.push).toHaveBeenCalledWith(
        '/app/doggo-club/users/user-42/overview'
      );
    });

    it('replaces the history entry instead of adding one', () => {
      const { result } = renderPage();
      const historyLength = window.history.length;

      result.current.setTab('user-42', 'entries');

      expect(window.history.length).toBe(historyLength);
    });
  });
});
