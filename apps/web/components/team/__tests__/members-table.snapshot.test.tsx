import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamRole } from '@prisma/client';
import removeMember from '@giveaway/team-members-server/remove-member';
import updateMemberRole from '@giveaway/team-members-server/update-member-role';
import { MembersTable } from '../members-table';

vi.mock('@giveaway/team-members-server/remove-member', () => ({
  default: vi.fn()
}));
vi.mock('@giveaway/team-members-server/update-member-role', () => ({
  default: vi.fn()
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() }
}));

expect.addSnapshotSerializer({
  test: (value) => typeof value === 'string' && /_r_[0-9a-z]+_/.test(value),
  serialize: (value: string) => `"${value.replace(/_r_[0-9a-z]+_/g, '_r_id_')}"`
});

type Member = React.ComponentProps<typeof MembersTable>['members'][number];

const createMember = (
  id: string,
  role: TeamRole,
  createdAt: string,
  user: Partial<Member['user']> = {}
): Member => ({
  id,
  userId: `user-${id}`,
  role,
  createdAt: new Date(createdAt),
  user: {
    id: `user-${id}`,
    name: null,
    email: null,
    image: null,
    emoji: null,
    ...user
  }
});

const owner = createMember('m1', TeamRole.OWNER, '2026-01-10T12:00:00.000Z', {
  name: 'Ada Lovelace',
  email: 'ada@example.com'
});

const admin = createMember('m2', TeamRole.ADMIN, '2026-03-07T12:00:00.000Z', {
  email: 'grace@example.com',
  emoji: '🐶'
});

const guest = createMember('m3', TeamRole.GUEST, '2026-03-10T09:00:00.000Z', {
  email: 'linus@example.com'
});

const anonymous = createMember(
  'm4',
  TeamRole.MEMBER,
  '2026-02-24T12:00:00.000Z'
);

const renderTable = (members: Member[] = [owner, admin, guest, anonymous]) => {
  const onMemberRemoved = vi.fn();
  const view = render(
    <MembersTable
      slug="doggo-club"
      members={members}
      onMemberRemoved={onMemberRemoved}
    />
  );
  return { ...view, onMemberRemoved };
};

describe('MembersTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-03-10T12:00:00.000Z'));
    vi.mocked(removeMember).mockResolvedValue({
      ok: true,
      data: { success: true }
    });
    vi.mocked(updateMemberRole).mockResolvedValue({
      ok: true,
      data: { success: true }
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('when there are members', () => {
    it('matches the snapshot', () => {
      const { container } = renderTable();

      expect(container).toMatchSnapshot();
    });
  });
});
