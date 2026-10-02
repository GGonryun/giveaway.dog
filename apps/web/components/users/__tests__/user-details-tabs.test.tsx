import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamRole, TeamTier } from '@prisma/client';
import { TeamsProvider } from '@/components/context/team-provider';
import type { DetailedUserTeam } from '@/schemas/teams';
import { UserDetailsTabs } from '../user-details-tabs';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn() },
  pathname: '/app/doggo-club/users/user-42'
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation.router,
  usePathname: () => navigation.pathname
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}));

expect.addSnapshotSerializer({
  test: (value) => typeof value === 'string' && /_r_[0-9a-z]+_/.test(value),
  serialize: (value: string) => `"${value.replace(/_r_[0-9a-z]+_/g, '_r_id_')}"`
});

const activeTeam: DetailedUserTeam = {
  id: 'team-1',
  name: 'Doggo Club',
  slug: 'doggo-club',
  logo: 'https://cdn.example.com/doggo.png',
  memberCount: 4,
  tier: TeamTier.PRO,
  role: TeamRole.ADMIN
};

const tabs = () => (
  <TeamsProvider value={{ activeTeam, teams: [activeTeam] }}>
    <UserDetailsTabs id="user-42">
      <p>User details content</p>
    </UserDetailsTabs>
  </TeamsProvider>
);

const isSelected = (name: string) =>
  screen.getByRole('tab', { name }).getAttribute('aria-selected') === 'true';

describe('UserDetailsTabs', () => {
  beforeEach(() => {
    navigation.router.push.mockReset();
    navigation.pathname = '/app/doggo-club/users/user-42';
  });

  afterEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('renders the overview and entries tabs', () => {
    render(tabs());

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Overview',
      'Entries'
    ]);
  });

  it('renders its children', () => {
    render(tabs());

    expect(screen.getByText('User details content')).toBeInTheDocument();
  });

  describe('selection from the url', () => {
    it('selects the overview tab when the url has no tab', () => {
      render(tabs());

      expect(isSelected('Overview')).toBe(true);
    });

    it('selects the tab named in the url', () => {
      navigation.pathname = '/app/doggo-club/users/user-42/entries';

      render(tabs());

      expect(isSelected('Entries')).toBe(true);
    });

    it('falls back to the overview tab for an unknown tab', () => {
      navigation.pathname = '/app/doggo-club/users/user-42/settings';

      render(tabs());

      expect(isSelected('Overview')).toBe(true);
    });

    it('follows the url when it changes', () => {
      const { rerender } = render(tabs());

      navigation.pathname = '/app/doggo-club/users/user-42/entries';
      rerender(tabs());

      expect(isSelected('Entries')).toBe(true);
    });
  });

  describe('when a tab is clicked', () => {
    it('navigates to the tab for this user', async () => {
      const user = userEvent.setup();
      render(tabs());

      await user.click(screen.getByRole('tab', { name: 'Entries' }));

      expect(navigation.router.push).toHaveBeenCalledWith(
        '/app/doggo-club/users/user-42/entries'
      );
      expect(window.location.pathname).toBe(
        '/app/doggo-club/users/user-42/entries'
      );
    });

    it('selects the clicked tab immediately', async () => {
      const user = userEvent.setup();
      render(tabs());

      await user.click(screen.getByRole('tab', { name: 'Entries' }));

      expect(isSelected('Entries')).toBe(true);
    });
  });
});
