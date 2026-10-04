import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildTask,
  buildUser,
  buildUserEntry,
  withStableIds
} from '@giveaway/sweepstakes-ui-testing/testing/fixtures';
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

  it('matches the snapshot', () => {
    renderDialog();
    expect(withStableIds(screen.getByRole('dialog'))).toMatchSnapshot();
  });
});
