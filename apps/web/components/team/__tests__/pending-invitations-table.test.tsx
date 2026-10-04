import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamRole } from '@prisma/client';
import { toast } from 'sonner';
import revokeInvitation from '@giveaway/team-invites-server/revoke-invitation';
import { PendingInvitationsTable } from '../pending-invitations-table';

vi.mock('@giveaway/team-invites-server/revoke-invitation', () => ({
  default: vi.fn()
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}));

expect.addSnapshotSerializer({
  test: (value) => typeof value === 'string' && /_r_[0-9a-z]+_/.test(value),
  serialize: (value: string) => `"${value.replace(/_r_[0-9a-z]+_/g, '_r_id_')}"`
});

type Invitation = React.ComponentProps<
  typeof PendingInvitationsTable
>['invitations'][number];

const invitations: Invitation[] = [
  {
    id: 'invite-1',
    email: 'ada@example.com',
    role: TeamRole.ADMIN,
    createdAt: new Date('2026-03-07T12:00:00.000Z')
  },
  {
    id: 'invite-2',
    email: 'grace@example.com',
    role: TeamRole.GUEST,
    createdAt: new Date('2026-03-10T09:00:00.000Z')
  }
];

const renderTable = (items: Invitation[] = invitations) => {
  const onInvitationRevoked = vi.fn();
  const view = render(
    <PendingInvitationsTable
      slug="doggo-club"
      invitations={items}
      onInvitationRevoked={onInvitationRevoked}
    />
  );
  return { ...view, onInvitationRevoked };
};

const startRevoking = async (
  user: ReturnType<typeof userEvent.setup>,
  email: string
) => {
  const row = screen.getByRole('row', { name: new RegExp(email) });
  await user.click(within(row).getByRole('button'));
  await user.click(screen.getByRole('menuitem', { name: 'Revoke Invitation' }));
};

describe('PendingInvitationsTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-03-10T12:00:00.000Z'));
    vi.mocked(revokeInvitation).mockResolvedValue({
      ok: true,
      data: { success: true }
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('when there are no invitations', () => {
    it('shows an empty state instead of a table', () => {
      renderTable([]);

      expect(screen.getByText('No pending invitations')).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });

  describe('when there are invitations', () => {
    it('lists each invitation with its role and when it was sent', () => {
      renderTable();

      const row = screen.getByRole('row', { name: /ada@example\.com/ });
      expect(within(row).getAllByText('ADMIN')).toHaveLength(2);
      expect(row).toHaveTextContent('3 days ago');
      expect(
        screen.getByRole('row', { name: /grace@example\.com/ })
      ).toHaveTextContent('about 3 hours ago');
    });

    it('renders a header and one row per invitation', () => {
      renderTable();

      expect(
        screen.getAllByRole('columnheader').map((cell) => cell.textContent)
      ).toEqual(['Email', 'Role', 'Invited', '']);
      expect(screen.getAllByRole('row')).toHaveLength(3);
    });
  });

  describe('when revoking an invitation', () => {
    it('asks to confirm revoking that email', async () => {
      const user = userEvent.setup();
      renderTable();

      await startRevoking(user, 'grace@example\\.com');

      expect(
        screen.getByRole('alertdialog', { name: 'Revoke Invitation' })
      ).toHaveTextContent(
        'Are you sure you want to revoke the invitation for grace@example.com?'
      );
    });

    it('revokes the invitation and notifies the parent once confirmed', async () => {
      const user = userEvent.setup();
      const { onInvitationRevoked } = renderTable();

      await startRevoking(user, 'grace@example\\.com');
      await user.click(
        screen.getByRole('button', { name: 'Revoke Invitation' })
      );

      await waitFor(() => expect(onInvitationRevoked).toHaveBeenCalledTimes(1));
      expect(revokeInvitation).toHaveBeenCalledWith({
        slug: 'doggo-club',
        invitationId: 'invite-2'
      });
      expect(toast.success).toHaveBeenCalledWith(
        'Invitation revoked successfully'
      );
    });

    it('closes the confirmation after revoking', async () => {
      const user = userEvent.setup();
      renderTable();

      await startRevoking(user, 'ada@example\\.com');
      await user.click(
        screen.getByRole('button', { name: 'Revoke Invitation' })
      );

      await waitFor(() =>
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      );
    });

    it('shows the error when revoking fails', async () => {
      const user = userEvent.setup();
      vi.mocked(revokeInvitation).mockResolvedValue({
        ok: false,
        data: { code: 'NOT_FOUND', message: 'Invitation no longer exists' }
      });
      const { onInvitationRevoked } = renderTable();

      await startRevoking(user, 'ada@example\\.com');
      await user.click(
        screen.getByRole('button', { name: 'Revoke Invitation' })
      );

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('Invitation no longer exists')
      );
      expect(onInvitationRevoked).not.toHaveBeenCalled();
    });

    it('does not revoke when cancelled', async () => {
      const user = userEvent.setup();
      renderTable();

      await startRevoking(user, 'ada@example\\.com');
      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(revokeInvitation).not.toHaveBeenCalled();
    });
  });
});
