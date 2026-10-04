import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import updateTeamName from '@/procedures/teams/update-team-name';
import type { Result } from '@giveaway/rpc-model/types';
import { TeamNameCard } from '../team-name-card';

vi.mock('@/procedures/teams/update-team-name', () => ({ default: vi.fn() }));

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

const nameInput = () => screen.getByRole('textbox');
const saveButton = () => screen.getByRole('button', { name: 'Save' });

const renderCard = (onUpdate = vi.fn()) => {
  const view = render(
    <TeamNameCard
      slug="doggo-club"
      initialName="Doggo Club"
      onUpdate={onUpdate}
    />
  );
  return { ...view, onUpdate };
};

describe('TeamNameCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateTeamName).mockResolvedValue({
      ok: true,
      data: { success: true }
    });
  });

  describe('when first rendered', () => {
    it('shows the current team name', () => {
      renderCard();

      expect(nameInput()).toHaveValue('Doggo Club');
    });

    it('limits the name to 100 characters', () => {
      renderCard();

      expect(nameInput()).toHaveAttribute('maxlength', '100');
    });

    it('disables saving', () => {
      renderCard();

      expect(saveButton()).toBeDisabled();
    });
  });

  describe('when the name is edited', () => {
    it('enables saving for a new name', async () => {
      const user = userEvent.setup();
      renderCard();

      await user.type(nameInput(), ' Plus');

      expect(saveButton()).toBeEnabled();
    });

    it('keeps saving disabled for a blank name', async () => {
      const user = userEvent.setup();
      renderCard();

      await user.clear(nameInput());
      await user.type(nameInput(), '   ');

      expect(saveButton()).toBeDisabled();
    });

    it('disables saving again when the original name is restored', async () => {
      const user = userEvent.setup();
      renderCard();

      await user.type(nameInput(), '!');
      await user.type(nameInput(), '{Backspace}');

      expect(saveButton()).toBeDisabled();
    });
  });

  describe('when the new name is saved', () => {
    it('saves the trimmed name', async () => {
      const user = userEvent.setup();
      renderCard();

      await user.clear(nameInput());
      await user.type(nameInput(), '  Doggo Squad  ');
      await user.click(saveButton());

      await waitFor(() =>
        expect(updateTeamName).toHaveBeenCalledWith({
          slug: 'doggo-club',
          name: 'Doggo Squad'
        })
      );
    });

    it('confirms the change and notifies the parent', async () => {
      const user = userEvent.setup();
      const { onUpdate } = renderCard();

      await user.type(nameInput(), ' Plus');
      await user.click(saveButton());

      await waitFor(() => expect(onUpdate).toHaveBeenCalledTimes(1));
      expect(toast.success).toHaveBeenCalledWith(
        'Team name updated successfully'
      );
    });

    it('shows a saving state while pending', async () => {
      const user = userEvent.setup();
      const request = createDeferred<Result<{ success: boolean }>>();
      vi.mocked(updateTeamName).mockReturnValue(request.promise);
      renderCard();

      await user.type(nameInput(), ' Plus');
      await user.click(saveButton());

      expect(
        await screen.findByRole('button', { name: 'Saving...' })
      ).toBeDisabled();
      request.resolve({ ok: true, data: { success: true } });
      await waitFor(() => expect(saveButton()).toBeEnabled());
    });
  });

  describe('when saving fails', () => {
    it('shows the error without notifying the parent', async () => {
      const user = userEvent.setup();
      vi.mocked(updateTeamName).mockResolvedValue({
        ok: false,
        data: { code: 'FORBIDDEN', message: 'Only admins can rename' }
      });
      const { onUpdate } = renderCard();

      await user.type(nameInput(), ' Plus');
      await user.click(saveButton());

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('Only admins can rename')
      );
      expect(onUpdate).not.toHaveBeenCalled();
    });
  });

  describe('when the initial name changes', () => {
    it('resets the field to the new name', async () => {
      const user = userEvent.setup();
      const { rerender } = renderCard();

      await user.type(nameInput(), ' Plus');
      rerender(<TeamNameCard slug="doggo-club" initialName="Doggo Squad" />);

      expect(nameInput()).toHaveValue('Doggo Squad');
      expect(saveButton()).toBeDisabled();
    });
  });

  describe('without an update callback', () => {
    it('still saves the name', async () => {
      const user = userEvent.setup();
      render(<TeamNameCard slug="doggo-club" initialName="Doggo Club" />);

      await user.type(nameInput(), ' Plus');
      await user.click(saveButton());

      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith(
          'Team name updated successfully'
        )
      );
    });
  });
});
