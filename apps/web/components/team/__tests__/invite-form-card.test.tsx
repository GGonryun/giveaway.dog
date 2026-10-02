import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamRole } from '@prisma/client';
import { toast } from 'sonner';
import inviteMembers from '@/procedures/teams/invite-members';
import type { Result } from '@/lib/mrpc/types';
import { TeamInviteLinkProvider } from '@/lib/invites/context/team-invite-link-context';
import { InviteFormCard } from '../invite-form-card';

vi.mock('@/procedures/teams/invite-members', () => ({ default: vi.fn() }));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() }
}));

expect.addSnapshotSerializer({
  test: (value) => typeof value === 'string' && /_r_[0-9a-z]+_/.test(value),
  serialize: (value: string) => `"${value.replace(/_r_[0-9a-z]+_/g, '_r_id_')}"`
});

type InviteResult = {
  success: boolean;
  invited: string[];
  skipped: { email: string; reason: string }[];
};

const createDeferred = <T,>() => {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((resolver) => {
    resolve = resolver;
  });
  return { promise, resolve };
};

const renderCard = () => {
  const onInvitesSent = vi.fn();
  const view = render(
    <TeamInviteLinkProvider
      inviteUrl="https://giveaway.dog/invite/abc123"
      inviteCode="abc123"
      isLoading={false}
      regenerate={vi.fn()}
    >
      <InviteFormCard slug="doggo-club" onInvitesSent={onInvitesSent} />
    </TeamInviteLinkProvider>
  );
  return { ...view, onInvitesSent };
};

const emailInputs = () =>
  screen.getAllByRole('textbox', { name: 'Email Address' });

const rowOf = (input: HTMLElement) => {
  const row = input.parentElement?.parentElement;
  if (!row) throw new Error('Invitation row not found');
  return row;
};

const sendButton = () =>
  screen.getByRole('button', { name: 'Send Invitations' });

describe('InviteFormCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(inviteMembers).mockResolvedValue({
      ok: true,
      data: { success: true, invited: ['ada@example.com'], skipped: [] }
    });
  });

  describe('when first rendered', () => {
    it('starts with one empty invitation for a member', () => {
      renderCard();

      expect(emailInputs()).toHaveLength(1);
      expect(emailInputs()[0]).toHaveValue('');
      expect(screen.getByRole('combobox', { name: 'Role' })).toHaveTextContent(
        'Member'
      );
    });

    it('does not offer to remove the only invitation', () => {
      renderCard();

      expect(within(rowOf(emailInputs()[0])).queryByRole('button')).toBeNull();
    });

    it('only offers guest, member and admin roles', async () => {
      const user = userEvent.setup();
      renderCard();

      await user.click(screen.getByRole('combobox', { name: 'Role' }));

      expect(
        screen.getAllByRole('option').map((option) => option.textContent)
      ).toEqual(['Guest', 'Member', 'Admin']);
    });
  });

  describe('when managing invitation rows', () => {
    it('adds another invitation row', async () => {
      const user = userEvent.setup();
      renderCard();

      await user.click(
        screen.getByRole('button', { name: 'Add Another Member' })
      );

      expect(emailInputs()).toHaveLength(2);
    });

    it('removes the chosen invitation row', async () => {
      const user = userEvent.setup();
      renderCard();

      await user.type(emailInputs()[0], 'ada@example.com');
      await user.click(
        screen.getByRole('button', { name: 'Add Another Member' })
      );
      await user.type(emailInputs()[1], 'grace@example.com');
      await user.click(within(rowOf(emailInputs()[0])).getByRole('button'));

      expect(emailInputs()).toHaveLength(1);
      expect(emailInputs()[0]).toHaveValue('grace@example.com');
    });
  });

  describe('when an email is invalid', () => {
    it('shows a validation message and does not send', async () => {
      const user = userEvent.setup();
      renderCard();

      await user.type(emailInputs()[0], 'not-an-email');
      await user.click(sendButton());

      expect(
        await screen.findByText('Invalid email address')
      ).toBeInTheDocument();
      expect(inviteMembers).not.toHaveBeenCalled();
    });
  });

  describe('when the invitations are sent', () => {
    it('sends every invitation with its role', async () => {
      const user = userEvent.setup();
      renderCard();

      await user.type(emailInputs()[0], 'ada@example.com');
      await user.click(
        screen.getByRole('button', { name: 'Add Another Member' })
      );
      await user.type(emailInputs()[1], 'grace@example.com');
      await user.click(screen.getAllByRole('combobox', { name: 'Role' })[1]);
      await user.click(screen.getByRole('option', { name: 'Admin' }));
      await user.click(sendButton());

      await waitFor(() =>
        expect(inviteMembers).toHaveBeenCalledWith({
          slug: 'doggo-club',
          invitations: [
            { email: 'ada@example.com', role: TeamRole.MEMBER },
            { email: 'grace@example.com', role: TeamRole.ADMIN }
          ]
        })
      );
    });

    it('shows a sending state while the request is pending', async () => {
      const user = userEvent.setup();
      const request = createDeferred<Result<InviteResult>>();
      vi.mocked(inviteMembers).mockReturnValue(request.promise);
      renderCard();

      await user.type(emailInputs()[0], 'ada@example.com');
      await user.click(sendButton());

      expect(
        await screen.findByRole('button', { name: 'Sending...' })
      ).toBeDisabled();
      request.resolve({
        ok: true,
        data: { success: true, invited: ['ada@example.com'], skipped: [] }
      });
      await waitFor(() => expect(sendButton()).toBeEnabled());
    });

    it('confirms a single invitation', async () => {
      const user = userEvent.setup();
      renderCard();

      await user.type(emailInputs()[0], 'ada@example.com');
      await user.click(sendButton());

      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith(
          'Invited 1 member successfully'
        )
      );
    });

    it('pluralises the confirmation for several invitations', async () => {
      const user = userEvent.setup();
      vi.mocked(inviteMembers).mockResolvedValue({
        ok: true,
        data: {
          success: true,
          invited: ['ada@example.com', 'grace@example.com'],
          skipped: []
        }
      });
      renderCard();

      await user.type(emailInputs()[0], 'ada@example.com');
      await user.click(sendButton());

      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith(
          'Invited 2 members successfully'
        )
      );
    });

    it('warns about each skipped invitation without a success toast', async () => {
      const user = userEvent.setup();
      vi.mocked(inviteMembers).mockResolvedValue({
        ok: true,
        data: {
          success: true,
          invited: [],
          skipped: [{ email: 'ada@example.com', reason: 'Already a member' }]
        }
      });
      renderCard();

      await user.type(emailInputs()[0], 'ada@example.com');
      await user.click(sendButton());

      await waitFor(() =>
        expect(toast.warning).toHaveBeenCalledWith(
          'ada@example.com: Already a member'
        )
      );
      expect(toast.success).not.toHaveBeenCalled();
    });

    it('resets the form and notifies the parent', async () => {
      const user = userEvent.setup();
      const { onInvitesSent } = renderCard();

      await user.type(emailInputs()[0], 'ada@example.com');
      await user.click(
        screen.getByRole('button', { name: 'Add Another Member' })
      );
      await user.type(emailInputs()[1], 'grace@example.com');
      await user.click(sendButton());

      await waitFor(() => expect(onInvitesSent).toHaveBeenCalledTimes(1));
      expect(emailInputs()).toHaveLength(1);
      expect(emailInputs()[0]).toHaveValue('');
    });
  });

  describe('when sending fails', () => {
    it('shows the error and keeps the form', async () => {
      const user = userEvent.setup();
      vi.mocked(inviteMembers).mockResolvedValue({
        ok: false,
        data: { code: 'FORBIDDEN', message: 'Only admins can invite' }
      });
      const { onInvitesSent } = renderCard();

      await user.type(emailInputs()[0], 'ada@example.com');
      await user.click(sendButton());

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('Only admins can invite')
      );
      expect(onInvitesSent).not.toHaveBeenCalled();
      expect(emailInputs()[0]).toHaveValue('ada@example.com');
    });
  });

  describe('when opening the invite link', () => {
    it('shows the invite link dialog', async () => {
      const user = userEvent.setup();
      renderCard();

      await user.click(screen.getByRole('button', { name: 'Invite Link' }));

      expect(
        screen.getByRole('dialog', { name: 'Team Invite Link' })
      ).toBeInTheDocument();
    });
  });
});
