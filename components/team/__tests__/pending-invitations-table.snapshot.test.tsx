import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamRole } from '@prisma/client';
import revokeInvitation from '@/procedures/teams/revoke-invitation';
import { PendingInvitationsTable } from '../pending-invitations-table';

vi.mock('@/procedures/teams/revoke-invitation', () => ({ default: vi.fn() }));

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

  describe('when there are invitations', () => {
    it('matches the snapshot', () => {
      const { container } = renderTable();

      expect(container).toMatchSnapshot();
    });
  });
});
