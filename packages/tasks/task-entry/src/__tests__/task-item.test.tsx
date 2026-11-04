import { act, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildTask } from '@giveaway/sweepstakes-ui-testing/testing/fixtures';
import { renderWithParticipation } from '@giveaway/sweepstakes-participation-core/testing/participation-fixtures';
import { TaskItem } from '../task-item';

const navigation = vi.hoisted(() => ({
  router: { refresh: vi.fn() }
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation.router
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('../task-action', () => ({
  TaskAction: ({ onSubmit }: { onSubmit: () => void }) => (
    <button onClick={() => onSubmit()}>Continue</button>
  )
}));

const flushPromises = () =>
  act(async () => {
    await Promise.resolve();
  });

describe('TaskItem', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    navigation.router.refresh.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('when the participant completes the task', () => {
    it('closes the task, then refreshes the page in a later task', async () => {
      const onOpen = vi.fn();
      const onTaskComplete = vi.fn().mockResolvedValue(true);
      renderWithParticipation(
        <TaskItem task={buildTask()} open submissions={[]} onOpen={onOpen} />,
        { onTaskComplete }
      );

      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
      await flushPromises();

      expect(onTaskComplete).toHaveBeenCalledWith('task-1', undefined);
      expect(onOpen).toHaveBeenCalledWith(false);
      expect(navigation.router.refresh).not.toHaveBeenCalled();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(navigation.router.refresh).toHaveBeenCalledTimes(1);
    });
  });

  describe('when the task fails', () => {
    it('keeps the task open and does not refresh the page', async () => {
      const onOpen = vi.fn();
      const onTaskComplete = vi.fn().mockRejectedValue({
        code: 'VALIDATION_ERROR',
        message: 'You have already completed this task. Refresh the page.'
      });
      renderWithParticipation(
        <TaskItem task={buildTask()} open submissions={[]} onOpen={onOpen} />,
        { onTaskComplete }
      );

      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(onOpen).not.toHaveBeenCalled();
      expect(navigation.router.refresh).not.toHaveBeenCalled();
    });
  });

  describe('header', () => {
    it('is a button that announces whether the task is expanded', () => {
      renderWithParticipation(
        <TaskItem
          task={buildTask()}
          open={false}
          submissions={[]}
          onOpen={vi.fn()}
        />
      );

      const header = screen.getByRole('button', { name: /^Say hello/ });
      expect(header).toHaveAttribute('type', 'button');
      expect(header).toHaveAttribute('aria-expanded', 'false');
    });

    it('opens the task when the header is clicked', () => {
      const onOpen = vi.fn();
      renderWithParticipation(
        <TaskItem
          task={buildTask()}
          open={false}
          submissions={[]}
          onOpen={onOpen}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /^Say hello/ }));

      expect(onOpen).toHaveBeenCalledWith(true);
    });

    it('opens the task when the task button is clicked', () => {
      const onOpen = vi.fn();
      renderWithParticipation(
        <TaskItem
          task={buildTask()}
          open={false}
          submissions={[]}
          onOpen={onOpen}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
      expect(buttons[1]).toHaveAttribute('aria-expanded', 'false');
      fireEvent.click(buttons[1]);

      expect(onOpen).toHaveBeenCalledWith(true);
    });

    it('marks the header as expanded when the task is open', () => {
      renderWithParticipation(
        <TaskItem task={buildTask()} open submissions={[]} onOpen={vi.fn()} />
      );

      expect(
        screen.getByRole('button', { name: /^Say hello/ })
      ).toHaveAttribute('aria-expanded', 'true');
    });
  });
});
