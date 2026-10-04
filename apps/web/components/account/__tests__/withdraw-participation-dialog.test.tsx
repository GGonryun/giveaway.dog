import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import withdrawParticipation from '@/procedures/user/withdraw-participation';
import type { Result } from '@giveaway/rpc-model/types';
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

const createDeferred = <T,>() => {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((resolver) => {
    resolve = resolver;
  });
  return { promise, resolve };
};

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

  describe('when open', () => {
    it('asks to confirm withdrawing from the named giveaway', () => {
      renderDialog();

      expect(
        screen.getByRole('alertdialog', { name: 'Withdraw from Giveaway' })
      ).toHaveTextContent(
        'Are you sure you want to withdraw from Summer Gear Giveaway?'
      );
    });

    it('warns that all progress will be deleted', () => {
      renderDialog();

      expect(screen.getByRole('alert')).toHaveTextContent(
        'This will delete all your progress, entries, and form data for this giveaway.'
      );
    });
  });

  describe('when closed', () => {
    it('renders nothing', () => {
      renderDialog(false);

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });

  describe('when withdrawal is confirmed', () => {
    it('withdraws from the giveaway', async () => {
      const user = userEvent.setup();
      renderDialog();

      await user.click(screen.getByRole('button', { name: 'Withdraw' }));

      await waitFor(() =>
        expect(withdrawParticipation).toHaveBeenCalledWith({
          sweepstakesId: 'sweepstakes-1'
        })
      );
    });

    it('confirms, closes and notifies the parent', async () => {
      const user = userEvent.setup();
      const { onOpenChange, onSuccess } = renderDialog();

      await user.click(screen.getByRole('button', { name: 'Withdraw' }));

      await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
      expect(toast.success).toHaveBeenCalledWith(
        'Successfully withdrew from giveaway'
      );
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('disables both buttons while withdrawing', async () => {
      const user = userEvent.setup();
      const request = createDeferred<Result<{ success: boolean }>>();
      vi.mocked(withdrawParticipation).mockReturnValue(request.promise);
      renderDialog();

      await user.click(screen.getByRole('button', { name: 'Withdraw' }));

      expect(
        screen.getByRole('button', { name: 'Withdrawing...' })
      ).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
      request.resolve({ ok: true, data: { success: true } });
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Withdraw' })).toBeEnabled()
      );
    });
  });

  describe('when withdrawal fails', () => {
    it('shows the error without notifying the parent', async () => {
      const user = userEvent.setup();
      vi.mocked(withdrawParticipation).mockResolvedValue({
        ok: false,
        data: { code: 'BAD_REQUEST', message: 'This giveaway has ended' }
      });
      const { onSuccess } = renderDialog();

      await user.click(screen.getByRole('button', { name: 'Withdraw' }));

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('This giveaway has ended')
      );
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  describe('when cancelled', () => {
    it('closes without withdrawing', async () => {
      const user = userEvent.setup();
      const { onOpenChange } = renderDialog();

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(withdrawParticipation).not.toHaveBeenCalled();
    });
  });
});
