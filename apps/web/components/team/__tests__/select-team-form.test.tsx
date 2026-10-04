import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamRole, TeamTier } from '@prisma/client';
import { toast } from 'sonner';
import getUserTeams from '@giveaway/team-server/get-user-teams';
import selectTeam from '@giveaway/team-server/select-team';
import type { Result } from '@giveaway/rpc-model/types';
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

vi.mock('@giveaway/team-server/get-user-teams', () => ({ default: vi.fn() }));
vi.mock('@giveaway/team-server/select-team', () => ({ default: vi.fn() }));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}));

const createDeferred = <T,>() => {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((resolver) => {
    resolve = resolver;
  });
  return { promise, resolve };
};

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

  describe('while the teams are loading', () => {
    it('shows a loading message', async () => {
      const request = createDeferred<Result<DetailedUserTeam[]>>();
      vi.mocked(getUserTeams).mockReturnValue(request.promise);

      render(<SelectTeamForm />);

      expect(screen.getByText('Loading teams...')).toBeInTheDocument();
      request.resolve({ ok: true, data: teams });
      expect(await screen.findByText('Doggo Club')).toBeInTheDocument();
    });
  });

  describe('when the user has teams', () => {
    it('lists each team with its role, slug and member count', async () => {
      render(<SelectTeamForm />);

      const team = await screen.findByRole('button', { name: /Doggo Club/ });
      expect(team).toHaveTextContent('OWNER');
      expect(team).toHaveTextContent('@doggo-club • 3 members');
      expect(
        screen.getByRole('img', { name: 'Doggo Club logo' })
      ).toBeInTheDocument();
    });

    it('offers to create another team', async () => {
      render(<SelectTeamForm />);

      expect(
        await screen.findByRole('button', { name: 'Create new team' })
      ).toBeEnabled();
    });
  });

  describe('when the user has no teams', () => {
    beforeEach(() => {
      vi.mocked(getUserTeams).mockResolvedValue({ ok: true, data: [] });
    });

    it('prompts the user to create their first team', async () => {
      render(<SelectTeamForm />);

      expect(await screen.findByText('No teams yet')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Create your first team' })
      ).toBeEnabled();
    });
  });

  describe('when the user is at the team limit', () => {
    beforeEach(() => {
      vi.mocked(getUserTeams).mockResolvedValue({
        ok: true,
        data: [1, 2, 3, 4, 5].map((index) => createTeam(index))
      });
    });

    it('disables creating another team', async () => {
      render(<SelectTeamForm />);

      expect(
        await screen.findByRole('button', { name: 'Team limit reached (5/5)' })
      ).toBeDisabled();
    });

    it('explains the team limit', async () => {
      render(<SelectTeamForm />);

      expect(
        await screen.findByText('You can only be a member of up to 5 teams')
      ).toBeInTheDocument();
    });
  });

  describe('when a team is selected', () => {
    it('selects the clicked team', async () => {
      const user = userEvent.setup();
      render(<SelectTeamForm />);

      await user.click(
        await screen.findByRole('button', { name: /Cat Corner/ })
      );

      expect(selectTeam).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'team-2', slug: 'cat-corner' })
      );
    });

    it('shows a switching message while the team is selected', async () => {
      const user = userEvent.setup();
      const request = createDeferred<Result<{ name: string; slug: string }>>();
      vi.mocked(selectTeam).mockReturnValue(request.promise);
      render(<SelectTeamForm />);

      await user.click(
        await screen.findByRole('button', { name: /Doggo Club/ })
      );

      expect(screen.getByText('Switching to team...')).toBeInTheDocument();
      request.resolve({
        ok: true,
        data: { name: 'Doggo Club', slug: 'doggo-club' }
      });
      await waitFor(() =>
        expect(
          screen.queryByText('Switching to team...')
        ).not.toBeInTheDocument()
      );
    });

    it('navigates to the selected team and confirms the switch', async () => {
      const user = userEvent.setup();
      render(<SelectTeamForm />);

      await user.click(
        await screen.findByRole('button', { name: /Doggo Club/ })
      );

      await waitFor(() =>
        expect(navigation.router.push).toHaveBeenCalledWith('/app/doggo-club')
      );
      expect(toast.success).toHaveBeenCalledWith(
        'Switched to team: Doggo Club'
      );
      expect(document.cookie).toContain('last_team_slug=doggo-club');
    });

    it('shows the error and keeps the list when switching fails', async () => {
      const user = userEvent.setup();
      vi.mocked(selectTeam).mockResolvedValue({
        ok: false,
        data: { code: 'FORBIDDEN', message: 'You are not a member' }
      });
      render(<SelectTeamForm />);

      await user.click(
        await screen.findByRole('button', { name: /Doggo Club/ })
      );

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('You are not a member')
      );
      expect(navigation.router.push).not.toHaveBeenCalled();
      expect(
        await screen.findByRole('button', { name: /Doggo Club/ })
      ).toBeInTheDocument();
    });
  });

  describe('when creating a team', () => {
    it('navigates to the create step', async () => {
      const user = userEvent.setup();
      render(<SelectTeamForm />);

      await user.click(
        await screen.findByRole('button', { name: 'Create new team' })
      );

      expect(navigation.router.push).toHaveBeenCalledWith('/app?step=2');
    });
  });
});
