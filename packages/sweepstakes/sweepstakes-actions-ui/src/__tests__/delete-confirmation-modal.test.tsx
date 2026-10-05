import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import deleteSweepstakes from '@giveaway/sweepstakes-editor-server/delete-sweepstakes';
import { DEFAULT_SWEEPSTAKES_NAME } from '@giveaway/app-config/settings';
import { DeleteConfirmationModal } from '../delete-confirmation-modal';

vi.mock('@giveaway/sweepstakes-editor-server/delete-sweepstakes', () => ({
  default: vi.fn()
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const sweepstakes = { id: 'sweep-1', name: 'Summer Giveaway' };

const renderModal = (
  target: { id: string; name: string } | null = sweepstakes
) => {
  const onClose = vi.fn();
  const result = render(
    <DeleteConfirmationModal sweepstakes={target} onClose={onClose} />
  );
  return { ...result, onClose };
};

const confirmInput = () => screen.getByRole('textbox');
const deleteButton = () =>
  screen.getByRole('button', { name: /Delete Sweepstakes|Deleting/ });

describe('DeleteConfirmationModal', () => {
  beforeEach(() => {
    vi.mocked(deleteSweepstakes).mockReset();
    vi.mocked(toast.success).mockReset();
    vi.mocked(toast.error).mockReset();
  });

  it('renders nothing without a sweepstakes', () => {
    const { container } = renderModal(null);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('warns that the deletion is permanent', () => {
    renderModal();
    expect(
      screen.getByRole('dialog', { name: 'Delete Sweepstakes' })
    ).toHaveAccessibleDescription(
      'You are about to permanently delete the sweepstakes "Summer Giveaway".'
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'This action cannot be undone.'
    );
  });

  it('asks the user to type the name to confirm', () => {
    renderModal();
    expect(
      screen.getByLabelText("Type 'Summer Giveaway' to confirm deletion:")
    ).toHaveAttribute('placeholder', 'Summer Giveaway');
  });

  describe('confirmation', () => {
    it('disables the delete button until the name is typed', () => {
      renderModal();
      expect(deleteButton()).toBeDisabled();
    });

    it('keeps the delete button disabled for a partial name', async () => {
      const user = userEvent.setup();
      renderModal();
      await user.type(confirmInput(), 'Summer');
      expect(deleteButton()).toBeDisabled();
    });

    it('enables the delete button for the name in any letter case', async () => {
      const user = userEvent.setup();
      renderModal();
      await user.type(confirmInput(), 'sUMMER gIVEAWAY');
      expect(deleteButton()).toBeEnabled();
    });

    it('expects the default name for an unnamed sweepstakes', async () => {
      const user = userEvent.setup();
      renderModal({ id: 'sweep-2', name: '' });
      expect(
        screen.getByLabelText(
          `Type '${DEFAULT_SWEEPSTAKES_NAME}' to confirm deletion:`
        )
      ).toBeInTheDocument();
      await user.type(confirmInput(), DEFAULT_SWEEPSTAKES_NAME);
      expect(deleteButton()).toBeEnabled();
    });
  });

  describe('deleting', () => {
    it('deletes the sweepstakes, confirms and closes', async () => {
      const user = userEvent.setup();
      vi.mocked(deleteSweepstakes).mockResolvedValue({
        ok: true,
        data: { slug: 'acme' }
      });
      const { onClose } = renderModal();

      await user.type(confirmInput(), 'Summer Giveaway');
      await user.click(deleteButton());

      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith('Sweepstakes deleted')
      );
      expect(deleteSweepstakes).toHaveBeenCalledWith(sweepstakes);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('locks the dialog while the deletion is in progress', async () => {
      const user = userEvent.setup();
      vi.mocked(deleteSweepstakes).mockReturnValue(new Promise(() => {}));
      const { onClose } = renderModal();

      await user.type(confirmInput(), 'Summer Giveaway');
      await user.click(deleteButton());

      expect(await screen.findByText('Deleting...')).toBeInTheDocument();
      expect(deleteButton()).toBeDisabled();
      expect(confirmInput()).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
      expect(onClose).not.toHaveBeenCalled();
    });

    it('explains that a missing sweepstakes could not be found', async () => {
      const user = userEvent.setup();
      vi.mocked(deleteSweepstakes).mockResolvedValue({
        ok: false,
        data: { code: 'NOT_FOUND', message: 'Sweepstakes not found' }
      });
      const { onClose } = renderModal();

      await user.type(confirmInput(), 'Summer Giveaway');
      await user.click(deleteButton());

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(
          "The item you're trying to delete could not be found. Refresh the page, or try again later."
        )
      );
      expect(onClose).not.toHaveBeenCalled();
    });

    it('shows the server message for other failures', async () => {
      const user = userEvent.setup();
      vi.mocked(deleteSweepstakes).mockResolvedValue({
        ok: false,
        data: { code: 'FORBIDDEN', message: 'Only owners can delete' }
      });
      renderModal();

      await user.type(confirmInput(), 'Summer Giveaway');
      await user.click(deleteButton());

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('Only owners can delete')
      );
    });
  });

  it('closes and clears the typed name when cancelled', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();

    await user.type(confirmInput(), 'Summer');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(confirmInput()).toHaveValue('');
    expect(deleteSweepstakes).not.toHaveBeenCalled();
  });
});
