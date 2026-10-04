import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamRole } from '@giveaway/db-model';
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

const openRowMenu = async (
  user: ReturnType<typeof userEvent.setup>,
  name: RegExp
) => {
  const row = screen.getByRole('row', { name });
  await user.click(within(row).getByRole('button', { expanded: false }));
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

  describe('when there are no members', () => {
    it('shows an empty state instead of a table', () => {
      renderTable([]);

      expect(screen.getByText('No team members found')).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });

  describe('when there are members', () => {
    it('renders a row per member below the header', () => {
      renderTable();

      expect(screen.getAllByRole('row')).toHaveLength(5);
      expect(
        screen.getAllByRole('columnheader').map((cell) => cell.textContent)
      ).toEqual(['', 'Member', 'Role', 'Joined', '']);
    });

    it('shows the member name, obfuscated email, role and join date', () => {
      renderTable();

      const row = screen.getByRole('row', { name: /Ada Lovelace/ });
      expect(row).toHaveTextContent('a***a@example.com');
      expect(row).toHaveTextContent('OWNER');
      expect(row).toHaveTextContent('about 2 months ago');
    });

    it('labels members without a name as unnamed', () => {
      renderTable();

      expect(screen.getAllByText('Unnamed User')).toHaveLength(3);
    });

    it.each([
      ['their emoji', /g\*\*\*e@example\.com/, '🐶'],
      ['the first letter of their name', /Ada Lovelace/, 'A'],
      ['the first letter of their email', /l\*\*\*s@example\.com/, 'L'],
      ['a question mark', /14 days ago/, '?']
    ])('uses %s as the avatar fallback', (_label, rowName, fallback) => {
      renderTable();

      const row = screen.getByRole('row', { name: rowName });
      expect(within(row).getAllByRole('cell')[0]).toHaveTextContent(fallback);
    });
  });

  describe('when editing a member', () => {
    it('opens the edit dialog for that member', async () => {
      const user = userEvent.setup();
      renderTable();

      await openRowMenu(user, /Ada Lovelace/);
      await user.click(screen.getByRole('menuitem', { name: 'Edit Member' }));

      expect(
        screen.getByRole('dialog', { name: 'Edit Member Role' })
      ).toHaveTextContent('Change the role for Ada Lovelace');
    });

    it('notifies the parent after the role is saved', async () => {
      const user = userEvent.setup();
      const { onMemberRemoved } = renderTable();

      await openRowMenu(user, /Ada Lovelace/);
      await user.click(screen.getByRole('menuitem', { name: 'Edit Member' }));
      await user.click(screen.getByRole('combobox', { name: 'Role' }));
      await user.click(screen.getByRole('option', { name: 'Admin' }));
      await user.click(screen.getByRole('button', { name: 'Save Changes' }));

      await waitFor(() => expect(onMemberRemoved).toHaveBeenCalledTimes(1));
      expect(updateMemberRole).toHaveBeenCalledWith({
        slug: 'doggo-club',
        membershipId: 'm1',
        role: TeamRole.ADMIN
      });
    });
  });

  describe('when removing a member', () => {
    it('blocks removing the team owner', async () => {
      const user = userEvent.setup();
      renderTable();

      await openRowMenu(user, /Ada Lovelace/);
      await user.click(screen.getByRole('menuitem', { name: 'Remove Member' }));

      expect(
        screen.getByRole('alertdialog', { name: 'Cannot Remove Member' })
      ).toHaveTextContent('Cannot remove the team owner');
    });

    it('blocks removing the last member of the team', async () => {
      const user = userEvent.setup();
      renderTable([admin]);

      await openRowMenu(user, /g\*\*\*e@example\.com/);
      await user.click(screen.getByRole('menuitem', { name: 'Remove Member' }));

      expect(
        screen.getByRole('alertdialog', { name: 'Cannot Remove Member' })
      ).toHaveTextContent('Cannot remove the last member of the team');
    });

    it('asks to confirm removing any other member by email', async () => {
      const user = userEvent.setup();
      renderTable();

      await openRowMenu(user, /g\*\*\*e@example\.com/);
      await user.click(screen.getByRole('menuitem', { name: 'Remove Member' }));

      expect(
        screen.getByRole('alertdialog', { name: 'Remove Team Member' })
      ).toHaveTextContent('remove grace@example.com from the team');
    });

    it('removes the member and notifies the parent once confirmed', async () => {
      const user = userEvent.setup();
      const { onMemberRemoved } = renderTable();

      await openRowMenu(user, /g\*\*\*e@example\.com/);
      await user.click(screen.getByRole('menuitem', { name: 'Remove Member' }));
      await user.click(screen.getByRole('button', { name: 'Remove Member' }));

      await waitFor(() => expect(onMemberRemoved).toHaveBeenCalledTimes(1));
      expect(removeMember).toHaveBeenCalledWith({
        slug: 'doggo-club',
        membershipId: 'm2'
      });
    });
  });
});
