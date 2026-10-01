import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import deleteUser from '@/procedures/user/delete-user';
import { DangerZone } from '../danger-zone';

vi.mock('@/procedures/user/delete-user', () => ({ default: vi.fn() }));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}));

expect.addSnapshotSerializer({
  test: (value) => typeof value === 'string' && /_r_[0-9a-z]+_/.test(value),
  serialize: (value: string) => `"${value.replace(/_r_[0-9a-z]+_/g, '_r_id_')}"`
});

const openConfirmation = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: 'Delete Account' }));
  return screen.getByRole('alertdialog', {
    name: 'Are you sure you want to delete your account?'
  });
};

describe('DangerZone', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(deleteUser).mockResolvedValue({ ok: true, data: undefined });
  });

  it('matches the snapshot', () => {
    const { container } = render(<DangerZone />);

    expect(container.firstChild).toMatchSnapshot();
  });

  describe('when first rendered', () => {
    it('explains that deletion is permanent', () => {
      render(<DangerZone />);

      expect(screen.getByText('Account Actions')).toBeInTheDocument();
      expect(
        screen.getByText(/Account deletion is permanent and cannot be reversed/)
      ).toBeInTheDocument();
    });

    it('does not show a save button', () => {
      render(<DangerZone />);

      expect(
        screen.queryByRole('button', { name: 'Save' })
      ).not.toBeInTheDocument();
    });
  });

  describe('when Delete Account is clicked', () => {
    it('asks for confirmation before deleting', async () => {
      const user = userEvent.setup();
      render(<DangerZone />);

      const dialog = await openConfirmation(user);

      expect(dialog).toHaveTextContent(
        'This action cannot be undone. Your account will be permanently deleted.'
      );
      expect(deleteUser).not.toHaveBeenCalled();
    });

    it('explains that deletion waits for entered giveaways to finish', async () => {
      const user = userEvent.setup();
      render(<DangerZone />);

      await openConfirmation(user);

      expect(screen.getByRole('alert')).toHaveTextContent(
        "Your account deletion will be fully processed after any giveaways you've entered have completed."
      );
    });
  });

  describe('when deletion is confirmed', () => {
    it('deletes the account and confirms it', async () => {
      const user = userEvent.setup();
      render(<DangerZone />);

      await openConfirmation(user);
      await user.click(screen.getByRole('button', { name: 'Delete Account' }));

      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith(
          'Account deleted successfully'
        )
      );
      expect(deleteUser).toHaveBeenCalledTimes(1);
    });

    it('shows the error when deletion fails', async () => {
      const user = userEvent.setup();
      vi.mocked(deleteUser).mockResolvedValue({
        ok: false,
        data: { code: 'INTERNAL_SERVER_ERROR', message: 'Could not delete' }
      });
      render(<DangerZone />);

      await openConfirmation(user);
      await user.click(screen.getByRole('button', { name: 'Delete Account' }));

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('Could not delete')
      );
      expect(toast.success).not.toHaveBeenCalled();
    });
  });

  describe('when deletion is cancelled', () => {
    it('closes the confirmation without deleting', async () => {
      const user = userEvent.setup();
      render(<DangerZone />);

      await openConfirmation(user);
      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(deleteUser).not.toHaveBeenCalled();
    });
  });
});
