import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamRole, TeamTier } from '@prisma/client';
import getUserTeams from '@/procedures/teams/get-user-teams';
import selectTeam from '@/procedures/teams/select-team';
import type { DetailedUserTeam } from '@giveaway/team-model/teams';
import { SelectTeamForm } from '../select-team-form';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn() },
  searchParams: new URLSearchParams()
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation.router,
  useSearchParams: () => navigation.searchParams
}));

vi.mock('@/procedures/teams/get-user-teams', () => ({ default: vi.fn() }));
vi.mock('@/procedures/teams/select-team', () => ({ default: vi.fn() }));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}));

const createTeam = (
  index: number,
  overrides: Partial<DetailedUserTeam> = {}
): DetailedUserTeam => ({
  id: `team-${index}`,
  name: `Team ${index}`,
  slug: `team-${index}`,
  logo: `https://cdn.example.com/team-${index}.png`,
  memberCount: index,
  tier: TeamTier.FREE,
  role: TeamRole.MEMBER,
  ...overrides
});

const teams: DetailedUserTeam[] = [
  createTeam(1, {
    name: 'Doggo Club',
    slug: 'doggo-club',
    memberCount: 3,
    role: TeamRole.OWNER
  }),
  createTeam(2, {
    name: 'Cat Corner',
    slug: 'cat-corner',
    memberCount: 1,
    role: TeamRole.GUEST
  })
];

describe('SelectTeamForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigation.searchParams = new URLSearchParams();
    vi.mocked(getUserTeams).mockResolvedValue({ ok: true, data: teams });
    vi.mocked(selectTeam).mockResolvedValue({
      ok: true,
      data: { name: 'Doggo Club', slug: 'doggo-club' }
    });
  });

  afterEach(() => {
    document.cookie = 'last_team_slug=; max-age=0; path=/';
  });

  describe('when the user has teams', () => {
    it('matches the snapshot', async () => {
      const { container } = render(<SelectTeamForm />);
      await screen.findByText('Doggo Club');

      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('when the user has no teams', () => {
    beforeEach(() => {
      vi.mocked(getUserTeams).mockResolvedValue({ ok: true, data: [] });
    });

    it('matches the snapshot', async () => {
      const { container } = render(<SelectTeamForm />);
      await screen.findByText('No teams yet');

      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
