import { render } from '@testing-library/react';
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

describe('UserDetailsTabs', () => {
  beforeEach(() => {
    navigation.router.push.mockReset();
    navigation.pathname = '/app/doggo-club/users/user-42';
  });

  afterEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('matches the snapshot', () => {
    const { container } = render(tabs());

    expect(container.firstChild).toMatchSnapshot();
  });
});
