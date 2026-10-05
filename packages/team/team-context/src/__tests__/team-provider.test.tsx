import { render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamRole, TeamTier } from '@giveaway/db-model';
import type { DetailedUserTeam } from '@giveaway/team-model/teams';
import { TeamsProvider, useTeams } from '../team-provider';

const activeTeam: DetailedUserTeam = {
  id: 'team-1',
  name: 'Doggo Club',
  slug: 'doggo-club',
  logo: 'https://cdn.example.com/doggo.png',
  memberCount: 4,
  tier: TeamTier.PRO,
  role: TeamRole.OWNER
};

const otherTeam: DetailedUserTeam = {
  id: 'team-2',
  name: 'Cat Corner',
  slug: 'cat-corner',
  logo: 'https://cdn.example.com/cat.png',
  memberCount: 1,
  tier: TeamTier.FREE,
  role: TeamRole.MEMBER
};

const ActiveTeamName = () => {
  const { activeTeam, teams } = useTeams();
  return (
    <p>
      {activeTeam.name} of {teams.length}
    </p>
  );
};

describe('TeamsProvider', () => {
  describe('when a consumer is rendered inside the provider', () => {
    it('exposes the active team and the team list', () => {
      const value = { activeTeam, teams: [activeTeam, otherTeam] };

      const { result } = renderHook(() => useTeams(), {
        wrapper: ({ children }) => (
          <TeamsProvider value={value}>{children}</TeamsProvider>
        )
      });

      expect(result.current).toBe(value);
    });

    it('renders consumers with the provided values', () => {
      render(
        <TeamsProvider value={{ activeTeam, teams: [activeTeam, otherTeam] }}>
          <ActiveTeamName />
        </TeamsProvider>
      );

      expect(screen.getByText('Doggo Club of 2')).toBeInTheDocument();
    });

    it('updates consumers when the value changes', () => {
      const { rerender } = render(
        <TeamsProvider value={{ activeTeam, teams: [activeTeam] }}>
          <ActiveTeamName />
        </TeamsProvider>
      );

      rerender(
        <TeamsProvider
          value={{ activeTeam: otherTeam, teams: [activeTeam, otherTeam] }}
        >
          <ActiveTeamName />
        </TeamsProvider>
      );

      expect(screen.getByText('Cat Corner of 2')).toBeInTheDocument();
    });
  });

  describe('when useTeams is called outside the provider', () => {
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('throws a descriptive error', () => {
      expect(() => renderHook(() => useTeams())).toThrow(
        'useTeams must be used within <TeamsProvider>'
      );
    });
  });
});
