import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamsProvider } from '@giveaway/team-context/team-provider';
import { useCreateSweepstakesPage } from '@giveaway/sweepstakes-routes/use-create-sweepstakes-page';
import { useEditSweepstakesPage } from '@giveaway/sweepstakes-routes/use-edit-sweepstakes-page';
import { useSweepstakesDetailsPage } from '@giveaway/sweepstakes-routes/use-sweepstakes-details-page';
import { buildTeam } from '@giveaway/sweepstakes-ui-testing/testing/fixtures';

const navigation = vi.hoisted(() => ({ router: { push: vi.fn() } }));

vi.mock('next/navigation', () => ({ useRouter: () => navigation.router }));

const team = buildTeam({ slug: 'globex' });

const wrapper = ({ children }: { children: ReactNode }) => (
  <TeamsProvider value={{ activeTeam: team, teams: [team] }}>
    {children}
  </TeamsProvider>
);

describe('team sweepstakes routes', () => {
  beforeEach(() => {
    navigation.router.push.mockReset();
  });

  describe('useCreateSweepstakesPage', () => {
    it('builds the create route of the active team', () => {
      const { result } = renderHook(() => useCreateSweepstakesPage(), {
        wrapper
      });
      expect(result.current.route('sweep-1')).toBe(
        '/app/globex/sweepstakes/sweep-1/create'
      );
    });

    it('navigates to the create route', () => {
      const { result } = renderHook(() => useCreateSweepstakesPage(), {
        wrapper
      });
      result.current.navigateTo('sweep-1');
      expect(navigation.router.push).toHaveBeenCalledWith(
        '/app/globex/sweepstakes/sweep-1/create'
      );
    });
  });

  describe('useEditSweepstakesPage', () => {
    it('builds the edit route of the active team', () => {
      const { result } = renderHook(() => useEditSweepstakesPage(), {
        wrapper
      });
      expect(result.current.route('sweep-1')).toBe(
        '/app/globex/sweepstakes/sweep-1/edit'
      );
    });

    it('navigates to the edit route', () => {
      const { result } = renderHook(() => useEditSweepstakesPage(), {
        wrapper
      });
      result.current.navigateTo('sweep-1');
      expect(navigation.router.push).toHaveBeenCalledWith(
        '/app/globex/sweepstakes/sweep-1/edit'
      );
    });
  });

  describe('useSweepstakesDetailsPage', () => {
    it('builds the details route of the active team', () => {
      const { result } = renderHook(() => useSweepstakesDetailsPage(), {
        wrapper
      });
      expect(result.current.route('sweep-1')).toBe(
        '/app/globex/sweepstakes/sweep-1'
      );
    });

    it('navigates to the details route', () => {
      const { result } = renderHook(() => useSweepstakesDetailsPage(), {
        wrapper
      });
      result.current.navigateTo('sweep-1');
      expect(navigation.router.push).toHaveBeenCalledWith(
        '/app/globex/sweepstakes/sweep-1'
      );
    });

    it('navigates to a tab of the details page', () => {
      const { result } = renderHook(() => useSweepstakesDetailsPage(), {
        wrapper
      });
      result.current.setTab('sweep-1', 'winners');
      expect(navigation.router.push).toHaveBeenCalledWith(
        '/app/globex/sweepstakes/sweep-1/winners'
      );
    });
  });

  it('throws when used outside of the teams provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useEditSweepstakesPage())).toThrow(
      'useTeams must be used within <TeamsProvider>'
    );
    vi.mocked(console.error).mockRestore();
  });
});
