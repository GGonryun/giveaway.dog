import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import createTeam from '@/procedures/teams/create-team';
import type { Result } from '@giveaway/rpc-model/types';
import { CreateTeamForm } from '../create-team-form';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn() },
  searchParams: new URLSearchParams()
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation.router,
  useSearchParams: () => navigation.searchParams
}));

vi.mock('@/procedures/teams/create-team', () => ({ default: vi.fn() }));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}));

vi.mock('@giveaway/ui-file-upload/file-upload', () => ({
  FileUpload: ({
    initialUrl,
    onUpload
  }: {
    initialUrl?: string;
    onUpload?: (url: string) => void;
  }) => (
    <div data-testid="file-upload" data-initial-url={initialUrl ?? ''}>
      <button
        type="button"
        onClick={() => onUpload?.('https://blob.example.com/logo.png')}
      >
        Upload file
      </button>
    </div>
  )
}));

expect.addSnapshotSerializer({
  test: (value) => typeof value === 'string' && /_r_[0-9a-z]+_/.test(value),
  serialize: (value: string) => `"${value.replace(/_r_[0-9a-z]+_/g, '_r_id_')}"`
});

const createDeferred = <T,>() => {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((resolver) => {
    resolve = resolver;
  });
  return { promise, resolve };
};

const nameInput = () => screen.getByPlaceholderText('My Awesome Team');
const slugInput = () => screen.getByPlaceholderText('my-awesome-team');
const createButton = () => screen.getByRole('button', { name: 'Create Team' });

describe('CreateTeamForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigation.searchParams = new URLSearchParams('step=2');
    vi.mocked(createTeam).mockResolvedValue({
      ok: true,
      data: { slug: 'doggo-club' }
    });
  });

  afterEach(() => {
    document.cookie = 'last_team_slug=; max-age=0; path=/';
  });

  describe('when the form is empty', () => {
    it('disables the create button', () => {
      render(<CreateTeamForm />);

      expect(createButton()).toBeDisabled();
    });

    it('warns that the slug cannot be changed later', () => {
      render(<CreateTeamForm />);

      expect(
        screen.getByText(/The team slug cannot be changed after creation/)
      ).toBeInTheDocument();
    });
  });

  describe('when typing a team name', () => {
    it('generates the slug from the name', async () => {
      const user = userEvent.setup();
      render(<CreateTeamForm />);

      await user.type(nameInput(), 'My Awesome Team!');

      expect(slugInput()).toHaveValue('my-awesome-team');
      expect(
        screen.getByText('giveaway.dog/my-awesome-team')
      ).toBeInTheDocument();
    });

    it('keeps a trailing hyphen when the name ends with a space', async () => {
      const user = userEvent.setup();
      render(<CreateTeamForm />);

      await user.type(nameInput(), 'Dog Team ');

      expect(slugInput()).toHaveValue('dog-team-');
    });

    it('shows a validation message for a name that is too short', async () => {
      const user = userEvent.setup();
      render(<CreateTeamForm />);

      await user.type(nameInput(), 'ab');

      expect(
        await screen.findByText('Team name must be at least 3 characters')
      ).toBeInTheDocument();
      expect(createButton()).toBeDisabled();
    });

    it('enables the create button once the name and slug are valid', async () => {
      const user = userEvent.setup();
      render(<CreateTeamForm />);

      await user.type(nameInput(), 'Doggo Club');

      await waitFor(() => expect(createButton()).toBeEnabled());
    });
  });

  describe('when typing a slug', () => {
    it('lowercases it and strips characters that are not allowed', async () => {
      const user = userEvent.setup();
      render(<CreateTeamForm />);

      await user.type(slugInput(), 'My Slug_1!');

      expect(slugInput()).toHaveValue('myslug1');
    });

    it('collapses repeated hyphens', async () => {
      const user = userEvent.setup();
      render(<CreateTeamForm />);

      await user.type(slugInput(), 'dog--team');

      expect(slugInput()).toHaveValue('dog-team');
    });
  });

  describe('when the form is submitted', () => {
    it('creates the team with the entered name and slug', async () => {
      const user = userEvent.setup();
      render(<CreateTeamForm />);

      await user.type(nameInput(), 'Doggo Club');
      await waitFor(() => expect(createButton()).toBeEnabled());
      await user.click(createButton());

      await waitFor(() =>
        expect(createTeam).toHaveBeenCalledWith({
          name: 'Doggo Club',
          slug: 'doggo-club'
        })
      );
    });

    it('includes the uploaded logo url', async () => {
      const user = userEvent.setup();
      render(<CreateTeamForm />);

      await user.type(nameInput(), 'Doggo Club');
      await user.click(screen.getByRole('button', { name: 'Upload file' }));
      await waitFor(() => expect(createButton()).toBeEnabled());
      await user.click(createButton());

      await waitFor(() =>
        expect(createTeam).toHaveBeenCalledWith({
          name: 'Doggo Club',
          slug: 'doggo-club',
          logo: 'https://blob.example.com/logo.png'
        })
      );
    });

    it('shows a loading state while the team is being created', async () => {
      const user = userEvent.setup();
      const request = createDeferred<Result<{ slug: string }>>();
      vi.mocked(createTeam).mockReturnValue(request.promise);
      render(<CreateTeamForm />);

      await user.type(nameInput(), 'Doggo Club');
      await waitFor(() => expect(createButton()).toBeEnabled());
      await user.click(createButton());

      expect(
        await screen.findByText('Creating your team...')
      ).toBeInTheDocument();
      request.resolve({ ok: true, data: { slug: 'doggo-club' } });
      await waitFor(() =>
        expect(navigation.router.push).toHaveBeenCalledWith('/app/doggo-club')
      );
    });

    it('confirms the new team and navigates to it', async () => {
      const user = userEvent.setup();
      render(<CreateTeamForm />);

      await user.type(nameInput(), 'Doggo Club');
      await waitFor(() => expect(createButton()).toBeEnabled());
      await user.click(createButton());

      await waitFor(() =>
        expect(navigation.router.push).toHaveBeenCalledWith('/app/doggo-club')
      );
      expect(toast.success).toHaveBeenCalledWith('Team created: doggo-club');
      expect(document.cookie).toContain('last_team_slug=doggo-club');
    });
  });

  describe('when creating the team fails', () => {
    it('shows a slug conflict on the slug field', async () => {
      const user = userEvent.setup();
      vi.mocked(createTeam).mockResolvedValue({
        ok: false,
        data: { code: 'CONFLICT', message: 'That slug is already taken' }
      });
      render(<CreateTeamForm />);

      await user.type(nameInput(), 'Doggo Club');
      await waitFor(() => expect(createButton()).toBeEnabled());
      await user.click(createButton());

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('That slug is already taken')
      );
      expect(
        await screen.findByText('That slug is already taken')
      ).toBeInTheDocument();
      expect(slugInput()).toHaveAttribute('aria-invalid', 'true');
      expect(navigation.router.push).not.toHaveBeenCalled();
    });

    it('only shows other failures in a toast', async () => {
      const user = userEvent.setup();
      vi.mocked(createTeam).mockResolvedValue({
        ok: false,
        data: { code: 'FORBIDDEN', message: 'Team limit reached' }
      });
      render(<CreateTeamForm />);

      await user.type(nameInput(), 'Doggo Club');
      await waitFor(() => expect(createButton()).toBeEnabled());
      await user.click(createButton());

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('Team limit reached')
      );
      expect(await screen.findByPlaceholderText('my-awesome-team')).toBeValid();
      expect(screen.queryByText('Team limit reached')).not.toBeInTheDocument();
    });
  });

  describe('when going back', () => {
    it('returns to the team list and clears the form', async () => {
      const user = userEvent.setup();
      render(<CreateTeamForm />);

      await user.type(nameInput(), 'Doggo Club');
      await user.click(screen.getByRole('button', { name: 'Back' }));

      expect(navigation.router.push).toHaveBeenCalledWith('/app?step=1');
      expect(nameInput()).toHaveValue('');
      expect(slugInput()).toHaveValue('');
    });
  });

  describe('when asking what teams are', () => {
    it('opens an explanation dialog', async () => {
      const user = userEvent.setup();
      render(<CreateTeamForm />);

      await user.click(screen.getByRole('button', { name: 'What are teams?' }));

      expect(
        screen.getByRole('dialog', { name: 'What are Teams?' })
      ).toBeInTheDocument();
    });
  });
});
