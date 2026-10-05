import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import removeMember from '@giveaway/team-members-server/remove-member';
import { RemoveMemberDialog } from '../remove-member-dialog';

vi.mock('@giveaway/team-members-server/remove-member', () => ({
  default: vi.fn()
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}));

expect.addSnapshotSerializer({
  test: (value) => typeof value === 'string' && /_r_[0-9a-z]+_/.test(value),
  serialize: (value: string) => `"${value.replace(/_r_[0-9a-z]+_/g, '_r_id_')}"`
});

const renderDialog = (
  props: Partial<React.ComponentProps<typeof RemoveMemberDialog>> = {}
) => {
  const onOpenChange = vi.fn();
  const onSuccess = vi.fn();
  render(
    <RemoveMemberDialog
      open
      onOpenChange={onOpenChange}
      slug="doggo-club"
      membershipId="membership-2"
      memberName="Grace Hopper"
      memberEmail="grace@example.com"
      blockReason={null}
      onSuccess={onSuccess}
      {...props}
    />
  );
  return { onOpenChange, onSuccess };
};

describe('RemoveMemberDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(removeMember).mockResolvedValue({
      ok: true,
      data: { success: true }
    });
  });

  describe('when the member can be removed', () => {
    it('matches the snapshot', () => {
      renderDialog();

      expect(screen.getByRole('alertdialog')).toMatchSnapshot();
    });
  });

  describe('when the member cannot be removed', () => {
    it('matches the snapshot', () => {
      renderDialog({ blockReason: 'Cannot remove the team owner' });

      expect(screen.getByRole('alertdialog')).toMatchSnapshot();
    });
  });
});
