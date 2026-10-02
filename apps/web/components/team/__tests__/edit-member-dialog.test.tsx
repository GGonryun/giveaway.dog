import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamRole } from '@prisma/client';
import { toast } from 'sonner';
import updateMemberRole from '@/procedures/teams/update-member-role';
import type { Result } from '@/lib/mrpc/types';
import { EditMemberDialog } from '../edit-member-dialog';

vi.mock('@/procedures/teams/update-member-role', () => ({ default: vi.fn() }));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() }
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
  props: Partial<React.ComponentProps<typeof EditMemberDialog>> = {}
) => {
  const onOpenChange = vi.fn();
  const onSuccess = vi.fn();
  render(
    <EditMemberDialog
      open
      onOpenChange={onOpenChange}
      slug="doggo-club"
      membershipId="membership-1"
      memberName="Ada Lovelace"
      memberEmail="ada@example.com"
      currentRole={TeamRole.MEMBER}
      onSuccess={onSuccess}
      {...props}
    />
  );
  return { onOpenChange, onSuccess };
};

const chooseRole = async (
  user: ReturnType<typeof userEvent.setup>,
  role: string
) => {
  await user.click(screen.getByRole('combobox', { name: 'Role' }));
  await user.click(screen.getByRole('option', { name: role }));
};

describe('EditMemberDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateMemberRole).mockResolvedValue({
      ok: true,
      data: { success: true }
    });
  });

  describe('when open', () => {
    it('describes whose role is being changed', () => {
      renderDialog();

      expect(
        screen.getByText('Change the role for Ada Lovelace')
      ).toBeInTheDocument();
    });

    it('falls back to the email when the member has no name', () => {
      renderDialog({ memberName: '' });

      expect(
        screen.getByText('Change the role for ada@example.com')
      ).toBeInTheDocument();
    });

    it('preselects the current role', () => {
      renderDialog({ currentRole: TeamRole.ADMIN });

      expect(screen.getByRole('combobox', { name: 'Role' })).toHaveTextContent(
        'Admin'
      );
    });

    it('offers every assignable role', async () => {
      const user = userEvent.setup();
      renderDialog();

      await user.click(screen.getByRole('combobox', { name: 'Role' }));

      expect(
        screen.getAllByRole('option').map((option) => option.textContent)
      ).toEqual(['Guest', 'Member', 'Admin', 'Owner']);
    });
  });

  describe('when closed', () => {
    it('renders nothing', () => {
      renderDialog({ open: false });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('when saving without changing the role', () => {
    it('closes without calling the server', async () => {
      const user = userEvent.setup();
      const { onOpenChange } = renderDialog();

      await user.click(screen.getByRole('button', { name: 'Save Changes' }));

      expect(toast.info).toHaveBeenCalledWith('No changes to save');
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(updateMemberRole).not.toHaveBeenCalled();
    });
  });

  describe('when saving a new role', () => {
    it('updates the member with the selected role', async () => {
      const user = userEvent.setup();
      renderDialog();

      await chooseRole(user, 'Admin');
      await user.click(screen.getByRole('button', { name: 'Save Changes' }));

      await waitFor(() =>
        expect(updateMemberRole).toHaveBeenCalledWith({
          slug: 'doggo-club',
          membershipId: 'membership-1',
          role: TeamRole.ADMIN
        })
      );
    });

    it('confirms the change, notifies the parent and closes', async () => {
      const user = userEvent.setup();
      const { onOpenChange, onSuccess } = renderDialog();

      await chooseRole(user, 'Guest');
      await user.click(screen.getByRole('button', { name: 'Save Changes' }));

      await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
      expect(toast.success).toHaveBeenCalledWith(
        'Member role updated successfully'
      );
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('disables both buttons while the role is being saved', async () => {
      const user = userEvent.setup();
      const request = createDeferred<Result<{ success: boolean }>>();
      vi.mocked(updateMemberRole).mockReturnValue(request.promise);
      renderDialog();

      await chooseRole(user, 'Owner');
      await user.click(screen.getByRole('button', { name: 'Save Changes' }));

      expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
      request.resolve({ ok: true, data: { success: true } });
      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'Save Changes' })
        ).toBeEnabled()
      );
    });
  });

  describe('when saving fails', () => {
    it('shows the error and stays open', async () => {
      const user = userEvent.setup();
      vi.mocked(updateMemberRole).mockResolvedValue({
        ok: false,
        data: { code: 'FORBIDDEN', message: 'Only owners can do that' }
      });
      const { onOpenChange, onSuccess } = renderDialog();

      await chooseRole(user, 'Owner');
      await user.click(screen.getByRole('button', { name: 'Save Changes' }));

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('Only owners can do that')
      );
      expect(onSuccess).not.toHaveBeenCalled();
      expect(onOpenChange).not.toHaveBeenCalled();
    });
  });

  describe('when cancelled', () => {
    it('asks the parent to close the dialog', async () => {
      const user = userEvent.setup();
      const { onOpenChange } = renderDialog();

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(updateMemberRole).not.toHaveBeenCalled();
    });
  });
});
