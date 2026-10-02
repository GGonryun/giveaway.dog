import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTeamPage } from '../use-team-page';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn() }
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation.router
}));

describe('useTeamPage', () => {
  beforeEach(() => {
    navigation.router.push.mockReset();
  });

  afterEach(() => {
    document.cookie = 'last_team_slug=; max-age=0; path=/';
  });

  describe('navigateToTeam', () => {
    it('navigates to the team dashboard', () => {
      const { result } = renderHook(() => useTeamPage());

      result.current.navigateToTeam({ slug: 'doggo-club' });

      expect(navigation.router.push).toHaveBeenCalledWith('/app/doggo-club');
    });

    it('remembers the team in the last team cookie', () => {
      const { result } = renderHook(() => useTeamPage());

      result.current.navigateToTeam({ slug: 'doggo-club' });

      expect(document.cookie).toContain('last_team_slug=doggo-club');
    });

    it('replaces the remembered team when switching teams', () => {
      const { result } = renderHook(() => useTeamPage());

      result.current.navigateToTeam({ slug: 'doggo-club' });
      result.current.navigateToTeam({ slug: 'cat-corner' });

      expect(document.cookie).toContain('last_team_slug=cat-corner');
      expect(document.cookie).not.toContain('doggo-club');
    });
  });
});
