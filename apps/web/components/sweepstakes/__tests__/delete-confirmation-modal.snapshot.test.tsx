import { render, screen } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import deleteSweepstakes from '@/procedures/sweepstakes/delete-sweepstakes';
import { DeleteConfirmationModal } from '../delete-confirmation-modal';
import { withStableIds } from '@giveaway/sweepstakes-ui-testing/testing/fixtures';

vi.mock('@/procedures/sweepstakes/delete-sweepstakes', () => ({
  default: vi.fn()
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const sweepstakes = { id: 'sweep-1', name: 'Summer Giveaway' };

const renderModal = (
  target: { id: string; name: string } | null = sweepstakes
) => {
  const onClose = vi.fn();
  const result = render(
    <DeleteConfirmationModal sweepstakes={target} onClose={onClose} />
  );
  return { ...result, onClose };
};

describe('DeleteConfirmationModal', () => {
  beforeEach(() => {
    vi.mocked(deleteSweepstakes).mockReset();
    vi.mocked(toast.success).mockReset();
    vi.mocked(toast.error).mockReset();
  });

  it('matches the snapshot', () => {
    renderModal();
    expect(withStableIds(screen.getByRole('dialog'))).toMatchSnapshot();
  });
});
