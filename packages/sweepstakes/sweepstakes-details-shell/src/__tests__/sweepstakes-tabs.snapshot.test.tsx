import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamsProvider } from '@giveaway/team-context/team-provider';
import {
  buildTeam,
  withStableIds
} from '@giveaway/sweepstakes-ui-testing/testing/fixtures';
import { SweepstakesDetailsTabs } from '../sweepstakes-tabs';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn() },
  pathname: '/app/acme/sweepstakes/sweep-1'
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation.router,
  usePathname: () => navigation.pathname
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const team = buildTeam();

const tabs = (pathname: string) => {
  navigation.pathname = pathname;
  return (
    <TeamsProvider value={{ activeTeam: team, teams: [team] }}>
      <SweepstakesDetailsTabs id="sweep-1">
        <p>tab body</p>
      </SweepstakesDetailsTabs>
    </TeamsProvider>
  );
};

describe('SweepstakesDetailsTabs', () => {
  beforeEach(() => {
    navigation.router.push.mockReset();
  });

  it('matches the snapshot', () => {
    const { container } = render(tabs('/app/acme/sweepstakes/sweep-1'));
    expect(withStableIds(container)).toMatchSnapshot();
  });
});
