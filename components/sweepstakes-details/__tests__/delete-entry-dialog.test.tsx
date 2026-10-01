import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildTask,
  buildUser,
  buildUserEntry
} from '@/components/sweepstakes/__tests__/fixtures';
import { deleteTaskCompletion } from '@/procedures/sweepstakes/delete-task-completion';
import { DeleteEntryDialog } from '../delete-entry-dialog';

vi.mock('@/procedures/sweepstakes/delete-task-completion', () => ({
  deleteTaskCompletion: vi.fn()
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const completion = buildUserEntry({
  id: 'entry-7',
  user: buildUser({ name: 'Sam Smith' }),
  task: buildTask({ title: 'Follow us on X' })
});

const renderDialog = (onDeleted?: () => void) => {
  const onOpenChange = vi.fn();
  render(
    <DeleteEntryDialog
      open
      onOpenChange={onOpenChange}
      completion={completion}
      sweepstakesId="sweep-1"
      onDeleted={onDeleted}
    />
  );
  return { onOpenChange };
};

describe('DeleteEntryDialog', () => {
  beforeEach(() => {
    vi.mocked(deleteTaskCompletion).mockReset();
  });

  it('names the participant and the task of the entry', () => {
    renderDialog();
    const dialog = screen.getByRole('dialog', { name: 'Delete Entry' });
    expect(dialog).toHaveTextContent('Participant: Sam Smith');
    expect(dialog).toHaveTextContent('Task: Follow us on X');
  });

  it('closes without deleting when cancelled', async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(deleteTaskCompletion).not.toHaveBeenCalled();
  });

  it('deletes the entry, closes and notifies the parent', async () => {
    const user = userEvent.setup();
    const onDeleted = vi.fn();
    vi.mocked(deleteTaskCompletion).mockResolvedValue({
      ok: true,
      data: { success: true }
    });
    const { onOpenChange } = renderDialog(onDeleted);

    await user.click(screen.getByRole('button', { name: 'Delete Entry' }));

    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1));
    expect(deleteTaskCompletion).toHaveBeenCalledWith({
      taskCompletionId: 'entry-7',
      sweepstakesId: 'sweep-1'
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('stays open when the deletion fails', async () => {
    const user = userEvent.setup();
    const onDeleted = vi.fn();
    vi.mocked(deleteTaskCompletion).mockResolvedValue({
      ok: false,
      data: { code: 'FORBIDDEN', message: 'Not allowed' }
    });
    const { onOpenChange } = renderDialog(onDeleted);

    await user.click(screen.getByRole('button', { name: 'Delete Entry' }));

    await waitFor(() => expect(deleteTaskCompletion).toHaveBeenCalled());
    expect(onDeleted).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('disables both buttons while deleting', async () => {
    const user = userEvent.setup();
    vi.mocked(deleteTaskCompletion).mockReturnValue(new Promise(() => {}));
    renderDialog();

    await user.click(screen.getByRole('button', { name: 'Delete Entry' }));

    expect(
      await screen.findByRole('button', { name: 'Deleting...' })
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });
});
