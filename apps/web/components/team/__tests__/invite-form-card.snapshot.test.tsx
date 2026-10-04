import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import inviteMembers from '@giveaway/team-invites-server/invite-members';
import { TeamInviteLinkProvider } from '@/lib/invites/context/team-invite-link-context';
import { InviteFormCard } from '../invite-form-card';

vi.mock('@giveaway/team-invites-server/invite-members', () => ({
  default: vi.fn()
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() }
}));

expect.addSnapshotSerializer({
  test: (value) => typeof value === 'string' && /_r_[0-9a-z]+_/.test(value),
  serialize: (value: string) => `"${value.replace(/_r_[0-9a-z]+_/g, '_r_id_')}"`
});

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

describe('InviteFormCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(inviteMembers).mockResolvedValue({
      ok: true,
      data: { success: true, invited: ['ada@example.com'], skipped: [] }
    });
  });

  it('matches the snapshot', () => {
    const { container } = renderCard();

    expect(container.firstChild).toMatchSnapshot();
  });
});
