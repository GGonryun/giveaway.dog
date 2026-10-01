import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import removeMember from '@/procedures/teams/remove-member';
import type { Result } from '@/lib/mrpc/types';
import { RemoveMemberDialog } from '../remove-member-dialog';

vi.mock('@/procedures/teams/remove-member', () => ({ default: vi.fn() }));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
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

const renderDialog = (
  props: Partial<React.ComponentProps<typeof RemoveMemberDialog>> = {}
) => {
  const onOpenChange = vi.fn();
  const onSuccess = vi.fn();
  render(
    <RemoveMemberDialog
      open
      onOpenChange={onOpenChange}
      slug="doggo-club"
      membershipId="membership-2"
      memberName="Grace Hopper"
      memberEmail="grace@example.com"
      blockReason={null}
      onSuccess={onSuccess}
      {...props}
    />
  );
  return { onOpenChange, onSuccess };
};

describe('RemoveMemberDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(removeMember).mockResolvedValue({
      ok: true,
      data: { success: true }
    });
  });

  describe('when the member can be removed', () => {
    it('matches the snapshot', () => {
      renderDialog();

      expect(screen.getByRole('alertdialog')).toMatchSnapshot();
    });

    it('asks to confirm removing the member by name', () => {
      renderDialog();

      expect(
        screen.getByRole('alertdialog', { name: 'Remove Team Member' })
      ).toHaveTextContent(
        'Are you sure you want to remove Grace Hopper from the team? This action cannot be undone.'
      );
    });

    it('falls back to the email when the member has no name', () => {
      renderDialog({ memberName: '' });

      expect(screen.getByRole('alertdialog')).toHaveTextContent(
        'remove grace@example.com from the team'
      );
    });

    it('removes the member when confirmed', async () => {
      const user = userEvent.setup();
      renderDialog();

      await user.click(screen.getByRole('button', { name: 'Remove Member' }));

      await waitFor(() =>
        expect(removeMember).toHaveBeenCalledWith({
          slug: 'doggo-club',
          membershipId: 'membership-2'
        })
      );
    });

    it('asks the parent to close as soon as removal is confirmed', async () => {
      const user = userEvent.setup();
      const request = createDeferred<Result<{ success: boolean }>>();
      vi.mocked(removeMember).mockReturnValue(request.promise);
      const { onOpenChange, onSuccess } = renderDialog();

      await user.click(screen.getByRole('button', { name: 'Remove Member' }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(onSuccess).not.toHaveBeenCalled();
      request.resolve({ ok: true, data: { success: true } });
      await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    });

    it('shows a removing state while the request is pending', async () => {
      const user = userEvent.setup();
      const request = createDeferred<Result<{ success: boolean }>>();
      vi.mocked(removeMember).mockReturnValue(request.promise);
      renderDialog();

      await user.click(screen.getByRole('button', { name: 'Remove Member' }));

      expect(
        screen.getByRole('button', { name: 'Removing...' })
      ).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
      request.resolve({ ok: true, data: { success: true } });
      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'Remove Member' })
        ).toBeEnabled()
      );
    });

    it('confirms the removal and notifies the parent', async () => {
      const user = userEvent.setup();
      const { onSuccess } = renderDialog();

      await user.click(screen.getByRole('button', { name: 'Remove Member' }));

      await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
      expect(toast.success).toHaveBeenCalledWith('Member removed successfully');
    });

    it('shows the error when removal fails', async () => {
      const user = userEvent.setup();
      vi.mocked(removeMember).mockResolvedValue({
        ok: false,
        data: { code: 'FORBIDDEN', message: 'Admins only' }
      });
      const { onSuccess } = renderDialog();

      await user.click(screen.getByRole('button', { name: 'Remove Member' }));

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('Admins only')
      );
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('closes without removing when cancelled', async () => {
      const user = userEvent.setup();
      const { onOpenChange } = renderDialog();

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(removeMember).not.toHaveBeenCalled();
    });
  });

  describe('when the member cannot be removed', () => {
    it('matches the snapshot', () => {
      renderDialog({ blockReason: 'Cannot remove the team owner' });

      expect(screen.getByRole('alertdialog')).toMatchSnapshot();
    });

    it('explains why the member cannot be removed', () => {
      renderDialog({ blockReason: 'Cannot remove the team owner' });

      const dialog = screen.getByRole('alertdialog', {
        name: 'Cannot Remove Member'
      });
      expect(dialog).toHaveTextContent(
        'Grace Hopper cannot be removed from the team.'
      );
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Cannot remove the team owner'
      );
    });

    it('only offers to close the dialog', async () => {
      const user = userEvent.setup();
      const { onOpenChange } = renderDialog({
        blockReason: 'Cannot remove the last member of the team'
      });

      expect(
        screen.queryByRole('button', { name: 'Remove Member' })
      ).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Close' }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(removeMember).not.toHaveBeenCalled();
    });
  });

  describe('when closed', () => {
    it('renders nothing', () => {
      renderDialog({ open: false });

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });
});
