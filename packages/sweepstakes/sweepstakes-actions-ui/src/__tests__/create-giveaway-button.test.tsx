import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamsProvider } from '@giveaway/team-context/team-provider';
import { createTemplate } from '@giveaway/templates-server/create-template';
import { timezone } from '@giveaway/util-time/time';
import { createSweepstakes } from '@giveaway/sweepstakes-editor-server/create-sweepstakes';
import { CreateGiveawayButton } from '../create-giveaway-button';
import { buildTeam } from '@giveaway/sweepstakes-ui-testing/testing/fixtures';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn(), refresh: vi.fn() }
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation.router,
  useParams: () => ({ slug: 'acme' })
}));

vi.mock('@giveaway/sweepstakes-editor-server/create-sweepstakes', () => ({
  createSweepstakes: vi.fn()
}));

vi.mock('@giveaway/templates-server/create-template', () => ({
  createTemplate: vi.fn()
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const team = buildTeam();

const renderButton = (
  props: ComponentProps<typeof CreateGiveawayButton> = {}
) =>
  render(
    <TeamsProvider value={{ activeTeam: team, teams: [team] }}>
      <CreateGiveawayButton {...props} />
    </TeamsProvider>
  );

const createdSweepstakes = {
  ok: true,
  data: { id: 'sweep-new' }
} as Awaited<ReturnType<typeof createSweepstakes>>;

const createdTemplate = {
  ok: true,
  data: { id: 'template-new' }
} as Awaited<ReturnType<typeof createTemplate>>;

describe('CreateGiveawayButton', () => {
  beforeEach(() => {
    vi.mocked(createSweepstakes).mockReset();
    vi.mocked(createTemplate).mockReset();
    navigation.router.push.mockReset();
  });

  it('renders a create button with a plus icon and a dropdown trigger', () => {
    renderButton();
    const create = screen.getByRole('button', { name: 'Create' });
    expect(create).toHaveClass('rounded-r-none');
    expect(create.querySelector('.lucide-plus')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('uses a custom label', () => {
    renderButton({ text: 'New giveaway' });
    expect(
      screen.getByRole('button', { name: 'New giveaway' })
    ).toBeInTheDocument();
  });

  it('can hide the icon', () => {
    renderButton({ showIcon: false });
    expect(
      screen.getByRole('button', { name: 'Create' }).querySelector('svg')
    ).not.toBeInTheDocument();
  });

  it('can hide the dropdown', () => {
    renderButton({ showDropdown: false });
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Create' })).not.toHaveClass(
      'rounded-r-none'
    );
  });

  describe('creating a sweepstakes', () => {
    it('creates a sweepstakes for the active team in the local time zone', async () => {
      const user = userEvent.setup();
      vi.mocked(createSweepstakes).mockResolvedValue(createdSweepstakes);
      renderButton();

      await user.click(screen.getByRole('button', { name: 'Create' }));

      expect(createSweepstakes).toHaveBeenCalledWith({
        ...team,
        timezone: timezone.current()
      });
    });

    it('opens the editor of the new sweepstakes', async () => {
      const user = userEvent.setup();
      vi.mocked(createSweepstakes).mockResolvedValue(createdSweepstakes);
      renderButton();

      await user.click(screen.getByRole('button', { name: 'Create' }));

      await waitFor(() =>
        expect(navigation.router.push).toHaveBeenCalledWith(
          '/app/acme/sweepstakes/sweep-new/create'
        )
      );
    });

    it('disables both buttons while creating', async () => {
      const user = userEvent.setup();
      let finishCreating = () => {};
      vi.mocked(createSweepstakes).mockReturnValue(
        new Promise((resolve) => {
          finishCreating = () => resolve(createdSweepstakes);
        })
      );
      renderButton();

      await user.click(screen.getByRole('button', { name: 'Create' }));

      const creating = await screen.findByRole('button', {
        name: 'Creating...'
      });
      expect(creating).toBeDisabled();
      expect(screen.getAllByRole('button')[1]).toBeDisabled();

      await act(async () => finishCreating());
    });
  });

  describe('dropdown', () => {
    const openMenu = async () => {
      const user = userEvent.setup();
      renderButton();
      await user.click(screen.getAllByRole('button')[1]);
      return user;
    };

    it('starts from scratch', async () => {
      vi.mocked(createSweepstakes).mockResolvedValue(createdSweepstakes);
      const user = await openMenu();
      await user.click(
        screen.getByRole('menuitem', { name: 'Start from scratch' })
      );
      expect(createSweepstakes).toHaveBeenCalledTimes(1);
    });

    it('opens the template gallery', async () => {
      const user = await openMenu();
      await user.click(
        screen.getByRole('menuitem', { name: 'Use a template' })
      );
      expect(navigation.router.push).toHaveBeenCalledWith(
        '/app/acme/templates'
      );
      expect(createSweepstakes).not.toHaveBeenCalled();
    });

    it('creates a template and opens it', async () => {
      vi.mocked(createTemplate).mockResolvedValue(createdTemplate);
      const user = await openMenu();

      await user.click(
        screen.getByRole('menuitem', { name: 'Create a template' })
      );

      expect(createTemplate).toHaveBeenCalledWith({
        slug: 'acme',
        sourceTemplateId: undefined
      });
      await waitFor(() =>
        expect(navigation.router.push).toHaveBeenCalledWith(
          '/app/acme/templates/template-new/create'
        )
      );
    });
  });
});
