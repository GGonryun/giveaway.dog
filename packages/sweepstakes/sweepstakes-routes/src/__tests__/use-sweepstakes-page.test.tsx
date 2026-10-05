import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamsProvider } from '@giveaway/team-context/team-provider';
import { useSweepstakesPage } from '../use-sweepstakes-page';
import { buildTeam } from '@giveaway/sweepstakes-ui-testing/testing/fixtures';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn() },
  pathname: '/app/acme',
  searchParams: new URLSearchParams('status=RUNNING')
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation.router,
  usePathname: () => navigation.pathname,
  useSearchParams: () => navigation.searchParams
}));

const team = buildTeam();

const wrapper = ({ children }: { children: ReactNode }) => (
  <TeamsProvider value={{ activeTeam: team, teams: [team] }}>
    {children}
  </TeamsProvider>
);

describe('useSweepstakesPage', () => {
  beforeEach(() => {
    navigation.router.push.mockReset();
  });

  it('exposes the team dashboard path and the current location', () => {
    const { result } = renderHook(() => useSweepstakesPage(), { wrapper });
    expect(result.current.path).toBe('/app/acme');
    expect(result.current.pathname).toBe('/app/acme');
    expect(result.current.searchParams.get('status')).toBe('RUNNING');
  });

  it('navigates to the team dashboard', () => {
    const { result } = renderHook(() => useSweepstakesPage(), { wrapper });
    result.current.navigateTo();
    expect(navigation.router.push).toHaveBeenCalledWith('/app/acme');
  });

  it('pushes updated search params while keeping the existing ones', () => {
    const { result } = renderHook(() => useSweepstakesPage(), { wrapper });
    const url = result.current.updateParams((params) => {
      params.set('page', '2');
    });
    expect(url).toBe('/app/acme?status=RUNNING&page=2');
    expect(navigation.router.push).toHaveBeenCalledWith(
      '/app/acme?status=RUNNING&page=2'
    );
  });
});
