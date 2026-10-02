import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { useState, type ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildProvider,
  buildTask
} from '@/components/sweepstakes/__tests__/fixtures';
import type { TaskSchema } from '@/lib/task/schemas';
import { reverifyTaskCompletion } from '@/procedures/sweepstakes/reverify-task-completion';
import { updateTaskCompletionStatus } from '@/procedures/sweepstakes/update-task-completion-status';
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

const discordTask: TaskSchema = {
  id: 'task-discord',
  type: 'DISCORD_JOIN',
  title: 'Join our Discord',
  value: 2,
  mandatory: false,
  tasksRequired: 0,
  invite: 'https://discord.gg/acme',
  channel: 'https://discord.com/channels/1/2'
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

const ControlledDialog = () => {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button onClick={() => setOpen(true)}>reopen</button>
      <VerificationInstructionsDialog
        open={open}
        onOpenChange={setOpen}
        taskCompletionId="completion-1"
        sweepstakesId="sweep-1"
        task={followTask}
        user={twitterUser}
        currentStatus="PENDING"
      />
    </>
  );
};

describe('VerificationInstructionsDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing while closed', () => {
    renderDialog({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('titles the dialog with the instructions and the current status', () => {
    renderDialog();
    const dialog = screen.getByRole('dialog');
    const title = screen.getByRole('heading', {
      name: /Verify Twitter\/X Follow/
    });
    expect(title).toHaveTextContent('Verify Twitter/X FollowPending Review');
    expect(dialog).toHaveAccessibleDescription(
      'Check if Jane Doe followed your Twitter/X account'
    );
  });

  describe('profile link', () => {
    it('links to the profile of the participant on the task platform', () => {
      renderDialog();
      const link = screen.getByRole('link', { name: "View janedoe's profile" });
      expect(link).toHaveAttribute('href', 'https://x.com/janedoe');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('is hidden when the participant has not connected the platform', () => {
      renderDialog({ user: { name: 'Jane Doe', providers: [] } });
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
  });

  describe('steps', () => {
    it('lists the numbered steps with their notes', () => {
      renderDialog();
      expect(screen.getByText('Verification Steps:')).toBeInTheDocument();
      expect(
        screen.getByText('Search for @janedoe in your followers')
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'You can use the search function to find specific followers'
        )
      ).toBeInTheDocument();
      ['1', '2', '3'].forEach((step) =>
        expect(screen.getByText(step)).toBeInTheDocument()
      );
    });

    it('explains when no manual verification is needed', () => {
      renderDialog({ task: buildTask() });
      expect(
        screen.getByText('No manual verification is needed for this task.')
      ).toBeInTheDocument();
      expect(screen.queryByText('Verification Steps:')).not.toBeInTheDocument();
    });
  });

  describe('automatic verification', () => {
    it('is not offered for manual tasks', () => {
      renderDialog();
      expect(
        screen.queryByRole('button', { name: 'Re-verify Automatically' })
      ).not.toBeInTheDocument();
    });

    it('re-verifies an automatic task and refreshes the page', async () => {
      const user = userEvent.setup();
      vi.mocked(reverifyTaskCompletion).mockResolvedValue({
        ok: true,
        data: { success: true, status: 'COMPLETED' }
      });
      renderDialog({ task: discordTask });

      expect(
        screen.getByText('This task supports automatic verification')
      ).toBeInTheDocument();
      await user.click(
        screen.getByRole('button', { name: 'Re-verify Automatically' })
      );

      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith(
          'Task completion re-verified successfully'
        )
      );
      expect(reverifyTaskCompletion).toHaveBeenCalledWith({
        taskCompletionId: 'completion-1',
        sweepstakesId: 'sweep-1'
      });
      expect(navigation.router.refresh).toHaveBeenCalledTimes(1);
    });

    it('reports a re-verification that did not pass', async () => {
      const user = userEvent.setup();
      vi.mocked(reverifyTaskCompletion).mockResolvedValue({
        ok: true,
        data: { success: false, status: 'REJECTED', error: 'Not a member' }
      });
      renderDialog({ task: discordTask });

      await user.click(
        screen.getByRole('button', { name: 'Re-verify Automatically' })
      );

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(
          'Re-verification failed: Not a member'
        )
      );
      expect(navigation.router.refresh).toHaveBeenCalledTimes(1);
    });

    it('reports a failed re-verification request', async () => {
      const user = userEvent.setup();
      vi.mocked(reverifyTaskCompletion).mockResolvedValue({
        ok: false,
        data: { code: 'INTERNAL_SERVER_ERROR', message: 'Discord is down' }
      });
      renderDialog({ task: discordTask });

      await user.click(
        screen.getByRole('button', { name: 'Re-verify Automatically' })
      );

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to re-verify: Discord is down'
        )
      );
      expect(navigation.router.refresh).not.toHaveBeenCalled();
    });

    it('shows progress while re-verifying', async () => {
      const user = userEvent.setup();
      vi.mocked(reverifyTaskCompletion).mockReturnValue(new Promise(() => {}));
      renderDialog({ task: discordTask });

      await user.click(
        screen.getByRole('button', { name: 'Re-verify Automatically' })
      );

      expect(
        await screen.findByRole('button', { name: 'Verifying...' })
      ).toBeDisabled();
    });
  });

  describe('approving', () => {
    it('marks the entry as completed and closes the dialog', async () => {
      const user = userEvent.setup();
      vi.mocked(updateTaskCompletionStatus).mockResolvedValue({
        ok: true,
        data: { success: true }
      });
      const { onOpenChange } = renderDialog();

      await user.click(screen.getByRole('button', { name: 'Approve' }));

      expect(updateTaskCompletionStatus).toHaveBeenCalledWith({
        taskCompletionId: 'completion-1',
        status: 'COMPLETED',
        sweepstakesId: 'sweep-1'
      });
      expect(onOpenChange).toHaveBeenCalledWith(false);
      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith(
          'Task completion status updated'
        )
      );
      expect(navigation.router.refresh).toHaveBeenCalledTimes(1);
    });

    it('reports a failed status update', async () => {
      const user = userEvent.setup();
      vi.mocked(updateTaskCompletionStatus).mockResolvedValue({
        ok: false,
        data: { code: 'FORBIDDEN', message: 'Not your sweepstakes' }
      });
      renderDialog();

      await user.click(screen.getByRole('button', { name: 'Approve' }));

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to update status: Not your sweepstakes'
        )
      );
    });

    it('cannot approve an entry that is already completed', () => {
      renderDialog({ currentStatus: 'COMPLETED' });
      expect(screen.getByRole('button', { name: 'Approve' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Reject' })).toBeEnabled();
    });
  });

  describe('rejecting', () => {
    it('asks for a reason before rejecting', async () => {
      const user = userEvent.setup();
      const { onOpenChange } = renderDialog();

      await user.click(screen.getByRole('button', { name: 'Reject' }));

      expect(
        screen.getByLabelText('Rejection Reason (required)')
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Confirm Reject' })
      ).toBeInTheDocument();
      expect(updateTaskCompletionStatus).not.toHaveBeenCalled();
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('rejects the entry with the reason and closes the dialog', async () => {
      const user = userEvent.setup();
      vi.mocked(updateTaskCompletionStatus).mockResolvedValue({
        ok: true,
        data: { success: true }
      });
      const { onOpenChange } = renderDialog();

      await user.click(screen.getByRole('button', { name: 'Reject' }));
      await user.type(
        screen.getByLabelText('Rejection Reason (required)'),
        'Not following'
      );
      await user.click(screen.getByRole('button', { name: 'Confirm Reject' }));

      expect(updateTaskCompletionStatus).toHaveBeenCalledWith({
        taskCompletionId: 'completion-1',
        status: 'REJECTED',
        reason: 'Not following',
        sweepstakesId: 'sweep-1'
      });
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('keeps asking for a reason when only whitespace was typed', async () => {
      const user = userEvent.setup();
      renderDialog();

      await user.click(screen.getByRole('button', { name: 'Reject' }));
      await user.type(
        screen.getByLabelText('Rejection Reason (required)'),
        '   '
      );
      await user.click(screen.getByRole('button', { name: 'Confirm Reject' }));

      expect(updateTaskCompletionStatus).not.toHaveBeenCalled();
    });

    it('cannot reject an entry that is already rejected', () => {
      renderDialog({ currentStatus: 'REJECTED' });
      expect(screen.getByRole('button', { name: 'Reject' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Approve' })).toBeEnabled();
    });

    it('forgets the reason when the dialog is dismissed', async () => {
      const user = userEvent.setup();
      render(<ControlledDialog />);

      await user.click(screen.getByRole('button', { name: 'Reject' }));
      await user.type(
        screen.getByLabelText('Rejection Reason (required)'),
        'Draft reason'
      );
      await user.keyboard('{Escape}');
      await user.click(screen.getByRole('button', { name: 'reopen' }));

      expect(
        screen.queryByLabelText('Rejection Reason (required)')
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Reject' })
      ).toBeInTheDocument();
    });
  });
});
