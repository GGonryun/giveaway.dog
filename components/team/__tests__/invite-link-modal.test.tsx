import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { TeamInviteLinkProvider } from '@/lib/invites/context/team-invite-link-context';
import { InviteLinkModal } from '../invite-link-modal';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}));

expect.addSnapshotSerializer({
  test: (value) => typeof value === 'string' && /_r_[0-9a-z]+_/.test(value),
  serialize: (value: string) => `"${value.replace(/_r_[0-9a-z]+_/g, '_r_id_')}"`
});

const INVITE_URL = 'https://giveaway.dog/invite/abc123';

const renderModal = ({
  open = true,
  inviteUrl = INVITE_URL,
  isLoading = false
}: {
  open?: boolean;
  inviteUrl?: string | null;
  isLoading?: boolean;
} = {}) => {
  const onOpenChange = vi.fn();
  const regenerate = vi.fn();
  render(
    <TeamInviteLinkProvider
      inviteUrl={inviteUrl}
      inviteCode="abc123"
      isLoading={isLoading}
      regenerate={regenerate}
    >
      <InviteLinkModal open={open} onOpenChange={onOpenChange} />
    </TeamInviteLinkProvider>
  );
  return { onOpenChange, regenerate };
};

describe('InviteLinkModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when the invite link has loaded', () => {
    it('matches the snapshot', () => {
      renderModal();

      expect(screen.getByRole('dialog')).toMatchSnapshot();
    });

    it('shows the invite url in a read-only field', () => {
      renderModal();

      const field = screen.getByRole('textbox');
      expect(field).toHaveValue(INVITE_URL);
      expect(field).toHaveAttribute('readonly');
    });

    it('copies the invite url to the clipboard', async () => {
      const user = userEvent.setup();
      renderModal();

      await user.click(screen.getByRole('button', { name: 'Copy link' }));

      await expect(navigator.clipboard.readText()).resolves.toBe(INVITE_URL);
      expect(toast.success).toHaveBeenCalledWith('Link copied to clipboard');
    });

    it('warns that regenerating invalidates the current link', () => {
      renderModal();

      expect(
        screen.getByText('Warning').closest('[role="alert"]')
      ).toHaveTextContent(
        'Regenerating this link will make the current link invalid.'
      );
    });

    it('regenerates the link', async () => {
      const user = userEvent.setup();
      const { regenerate } = renderModal();

      await user.click(screen.getByRole('button', { name: 'Regenerate' }));

      expect(regenerate).toHaveBeenCalledTimes(1);
    });

    it('closes when Done is clicked', async () => {
      const user = userEvent.setup();
      const { onOpenChange } = renderModal();

      await user.click(screen.getByRole('button', { name: 'Done' }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('when there is no invite link', () => {
    it('disables copying and shows an empty field', () => {
      renderModal({ inviteUrl: null });

      expect(screen.getByRole('textbox')).toHaveValue('');
      expect(screen.getByRole('button', { name: 'Copy link' })).toBeDisabled();
    });
  });

  describe('while the invite link is loading', () => {
    it('hides the link and the instructions', () => {
      renderModal({ isLoading: true });

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(
        screen.queryByText('How to use this link')
      ).not.toBeInTheDocument();
    });

    it('disables regenerating the link', () => {
      renderModal({ isLoading: true });

      expect(screen.getByRole('button', { name: 'Regenerate' })).toBeDisabled();
    });
  });

  describe('when closed', () => {
    it('renders nothing', () => {
      renderModal({ open: false });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
