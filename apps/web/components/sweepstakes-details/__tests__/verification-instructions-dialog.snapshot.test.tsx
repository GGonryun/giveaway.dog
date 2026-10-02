import { render, screen } from '@testing-library/react';
import { type ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildProvider,
  withStableIds
} from '@/components/sweepstakes/__tests__/fixtures';
import type { TaskSchema } from '@/lib/task/schemas';
import { VerificationInstructionsDialog } from '../verification-instructions-dialog';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn(), refresh: vi.fn() }
}));

vi.mock('next/navigation', () => ({ useRouter: () => navigation.router }));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('@/procedures/sweepstakes/update-task-completion-status', () => ({
  updateTaskCompletionStatus: vi.fn()
}));

vi.mock('@/procedures/sweepstakes/reverify-task-completion', () => ({
  reverifyTaskCompletion: vi.fn()
}));

const followTask: TaskSchema = {
  id: 'task-follow',
  type: 'TWITTER_FOLLOW',
  title: 'Follow us on X',
  value: 1,
  mandatory: false,
  tasksRequired: 0,
  username: 'https://x.com/acme'
};

type DialogProps = ComponentProps<typeof VerificationInstructionsDialog>;

const twitterUser = {
  name: 'Jane Doe',
  providers: [
    buildProvider({ label: 'janedoe', link: 'https://x.com/janedoe' })
  ]
};

const renderDialog = (props: Partial<DialogProps> = {}) => {
  const onOpenChange = vi.fn();
  render(
    <VerificationInstructionsDialog
      open
      onOpenChange={onOpenChange}
      taskCompletionId="completion-1"
      sweepstakesId="sweep-1"
      task={followTask}
      user={twitterUser}
      currentStatus="PENDING"
      {...props}
    />
  );
  return { onOpenChange };
};

describe('VerificationInstructionsDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('matches the snapshot for a manual task', () => {
    renderDialog();
    expect(withStableIds(screen.getByRole('dialog'))).toMatchSnapshot();
  });
});
