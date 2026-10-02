import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import withdrawParticipation from '@/procedures/user/withdraw-participation';
import { WithdrawParticipationDialog } from '../withdraw-participation-dialog';

vi.mock('@/procedures/user/withdraw-participation', () => ({
  default: vi.fn()
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}));

expect.addSnapshotSerializer({
  test: (value) => typeof value === 'string' && /_r_[0-9a-z]+_/.test(value),
  serialize: (value: string) => `"${value.replace(/_r_[0-9a-z]+_/g, '_r_id_')}"`
});

const renderDialog = (open = true) => {
  const onOpenChange = vi.fn();
  const onSuccess = vi.fn();
  render(
    <WithdrawParticipationDialog
      open={open}
      onOpenChange={onOpenChange}
      sweepstakesId="sweepstakes-1"
      sweepstakesName="Summer Gear Giveaway"
      onSuccess={onSuccess}
    />
  );
  return { onOpenChange, onSuccess };
};

describe('WithdrawParticipationDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(withdrawParticipation).mockResolvedValue({
      ok: true,
      data: { success: true }
    });
  });

  it('matches the snapshot', () => {
    renderDialog();

    expect(screen.getByRole('alertdialog')).toMatchSnapshot();
  });
});
