import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamRole, TeamTier } from '@prisma/client';
import { toast } from 'sonner';
import getUserTeams from '@/procedures/teams/get-user-teams';
import type { DetailedUserTeam } from '@giveaway/team-model/teams';
import type { Result } from '@giveaway/rpc-model/types';
import { useUserTeams } from '../use-user-teams';

vi.mock('@/procedures/teams/get-user-teams', () => ({ default: vi.fn() }));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}));

const getUserTeamsMock = vi.mocked(getUserTeams);

const teams: DetailedUserTeam[] = [
  {
    id: 'team-1',
    name: 'Doggo Club',
    slug: 'doggo-club',
    logo: 'https://cdn.example.com/doggo.png',
    memberCount: 3,
    tier: TeamTier.FREE,
    role: TeamRole.OWNER
  },
  {
    id: 'team-2',
    name: 'Cat Corner',
    slug: 'cat-corner',
    logo: 'https://cdn.example.com/cat.png',
    memberCount: 1,
    tier: TeamTier.PRO,
    role: TeamRole.MEMBER
  }
];

describe('useUserTeams', () => {
  beforeEach(() => {
    getUserTeamsMock.mockReset();
    vi.mocked(toast.error).mockReset();
  });

  describe('while the teams are loading', () => {
    it('starts pending with an empty list', async () => {
      let resolve: (value: Result<DetailedUserTeam[]>) => void = () => {};
      getUserTeamsMock.mockReturnValue(
        new Promise((resolver) => {
          resolve = resolver;
        })
      );

      const { result } = renderHook(() => useUserTeams());

      expect(result.current.data).toEqual([]);
      expect(result.current.isPending).toBe(true);
      expect(result.current.isLoading).toBe(true);

      resolve({ ok: true, data: teams });
      await waitFor(() => expect(result.current.isLoading).toBe(false));
    });

    it('requests the teams once on mount', async () => {
      getUserTeamsMock.mockResolvedValue({ ok: true, data: teams });

      const { rerender } = renderHook(() => useUserTeams());
      rerender();

      await waitFor(() => expect(getUserTeamsMock).toHaveBeenCalledTimes(1));
    });
  });

  describe('when the teams load successfully', () => {
    it('exposes the teams and stops loading', async () => {
      getUserTeamsMock.mockResolvedValue({ ok: true, data: teams });

      const { result } = renderHook(() => useUserTeams());

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.data).toEqual(teams);
      expect(result.current.isPending).toBe(false);
    });
  });

  describe('when loading the teams fails', () => {
    it('shows the error message in a toast', async () => {
      getUserTeamsMock.mockResolvedValue({
        ok: false,
        data: { code: 'INTERNAL_SERVER_ERROR', message: 'Teams unavailable' }
      });

      renderHook(() => useUserTeams());

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('Teams unavailable')
      );
    });

    it('keeps the list empty and stops pending', async () => {
      getUserTeamsMock.mockResolvedValue({
        ok: false,
        data: { code: 'INTERNAL_SERVER_ERROR', message: 'Teams unavailable' }
      });

      const { result } = renderHook(() => useUserTeams());

      await waitFor(() => expect(result.current.isPending).toBe(false));
      expect(result.current.data).toEqual([]);
    });
  });
});
