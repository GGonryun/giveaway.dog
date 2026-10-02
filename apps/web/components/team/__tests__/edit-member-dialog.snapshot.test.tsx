import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamRole } from '@prisma/client';
import updateMemberRole from '@/procedures/teams/update-member-role';
import { EditMemberDialog } from '../edit-member-dialog';

vi.mock('@/procedures/teams/update-member-role', () => ({ default: vi.fn() }));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() }
}));

expect.addSnapshotSerializer({
  test: (value) => typeof value === 'string' && /_r_[0-9a-z]+_/.test(value),
  serialize: (value: string) => `"${value.replace(/_r_[0-9a-z]+_/g, '_r_id_')}"`
});

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

describe('EditMemberDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateMemberRole).mockResolvedValue({
      ok: true,
      data: { success: true }
    });
  });

  it('matches the snapshot', () => {
    renderDialog();

    expect(screen.getByRole('dialog')).toMatchSnapshot();
  });
});
