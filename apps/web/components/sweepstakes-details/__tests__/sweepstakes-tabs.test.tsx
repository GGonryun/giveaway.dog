import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamsProvider } from '@/components/context/team-provider';
import { buildTeam } from '@/components/sweepstakes/__tests__/fixtures';
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

const selectedTab = () => screen.getByRole('tab', { selected: true });

describe('SweepstakesDetailsTabs', () => {
  beforeEach(() => {
    navigation.router.push.mockReset();
  });

  it('renders every details tab in order and the children', () => {
    render(tabs('/app/acme/sweepstakes/sweep-1'));
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Preview',
      'Analytics',
      'Promotion',
      'Entries',
      'Participants',
      'Winners'
    ]);
    expect(screen.getByText('tab body')).toBeInTheDocument();
  });

  it.each([
    ['/app/acme/sweepstakes/sweep-1', 'Preview'],
    ['/app/acme/sweepstakes/sweep-1/winners', 'Winners'],
    ['/app/acme/sweepstakes/sweep-1/entries/task/task-1', 'Entries'],
    ['/app/acme/sweepstakes/sweep-1/participants/user-1', 'Participants'],
    ['/app/acme/sweepstakes/sweep-1/edit', 'Preview']
  ])('selects the tab for %s', (pathname, label) => {
    render(tabs(pathname));
    expect(selectedTab()).toHaveTextContent(label);
  });

  it('follows the pathname when it changes', () => {
    const { rerender } = render(tabs('/app/acme/sweepstakes/sweep-1/entries'));
    rerender(tabs('/app/acme/sweepstakes/sweep-1/analytics'));
    expect(selectedTab()).toHaveTextContent('Analytics');
  });

  it('navigates to the clicked tab and selects it', async () => {
    const user = userEvent.setup();
    render(tabs('/app/acme/sweepstakes/sweep-1'));

    await user.click(screen.getByRole('tab', { name: 'Participants' }));

    expect(navigation.router.push).toHaveBeenCalledWith(
      '/app/acme/sweepstakes/sweep-1/participants'
    );
    expect(selectedTab()).toHaveTextContent('Participants');
  });
});
