import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
  });
});
