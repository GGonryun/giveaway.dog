import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildCompletion,
  buildGiveawayPrize,
  buildParticipant,
  buildPrizeDraw,
  buildSweepstakes,
  buildTask
} from '@/components/sweepstakes/__tests__/fixtures';
import { renderWithParticipation } from '@/components/sweepstakes/__tests__/participation-fixtures';
import type { GiveawayParticipationProps } from '@/components/sweepstakes/giveaway-participation-context';
import { WinnersAnnouncedParticipation } from '../winners-announced-participation';

const navigation = vi.hoisted(() => ({
  pathname: '/browse/summer-giveaway',
  searchParams: new URLSearchParams()
}));

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useSearchParams: () => navigation.searchParams
}));

vi.mock('@giveaway/auth-actions/logout', () => ({ default: vi.fn() }));

vi.mock('@/lib/task/components/public-sweepstakes/task-list', () => ({
  TaskList: ({
    open,
    setOpen
  }: {
    open: string | null;
    setOpen: (open: string | null) => void;
  }) => (
    <div data-testid="task-list">
      <span>open task: {open ?? 'none'}</span>
      <button onClick={() => setOpen('task-2')}>open second task</button>
    </div>
  )
}));

const setUrl = (search: string) => {
  navigation.searchParams = new URLSearchParams(search);
  window.history.replaceState(
    {},
    '',
    `${navigation.pathname}${search ? `?${search}` : ''}`
  );
};

const renderParticipation = (
  overrides: Partial<GiveawayParticipationProps> = {}
) =>
  renderWithParticipation(<WinnersAnnouncedParticipation />, {
    state: 'winners-announced',
    sweepstakes: buildSweepstakes({ status: 'COMPLETED' }),
    prizes: [buildGiveawayPrize({ draws: [buildPrizeDraw()] })],
    ...overrides
  });

describe('WinnersAnnouncedParticipation', () => {
  beforeEach(() => {
    setUrl('');
  });

  it('opens the prizes tab with the announced winners', () => {
    renderParticipation();
    expect(screen.getByRole('tab', { name: 'Prizes' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(
      screen.getByRole('heading', { name: 'Winners Announced!' })
    ).toBeInTheDocument();
  });

  it('shows the task list on the tasks tab', async () => {
    const user = userEvent.setup();
    renderParticipation();
    await user.click(screen.getByRole('tab', { name: 'Tasks' }));
    expect(screen.getByTestId('task-list')).toBeInTheDocument();
  });

  it('explains that there are no entry methods on the tasks tab', async () => {
    const user = userEvent.setup();
    renderParticipation({ sweepstakes: buildSweepstakes({ tasks: [] }) });
    await user.click(screen.getByRole('tab', { name: 'Tasks' }));
    expect(
      screen.getByRole('heading', { name: 'No Entry Methods' })
    ).toBeInTheDocument();
  });

  it('shows the progress of the participant', () => {
    const tasks = [
      buildTask({ id: 'task-1', value: 3 }),
      buildTask({ id: 'task-2', value: 4 })
    ];
    renderParticipation({
      sweepstakes: buildSweepstakes({ status: 'COMPLETED', tasks }),
      participant: buildParticipant({
        completions: [buildCompletion({ task: tasks[1] })]
      })
    });
    expect(screen.getByText('Your entries: 4')).toBeInTheDocument();
    expect(screen.getByText('1/2 completed')).toBeInTheDocument();
  });

  it('hides progress for a visitor when there are no tasks', () => {
    renderParticipation({ sweepstakes: buildSweepstakes({ tasks: [] }) });
    expect(screen.queryByText(/Your entries/)).not.toBeInTheDocument();
  });

  it('dims the page while a task from the url is open', () => {
    setUrl('taskId=task-1');
    const { container } = renderParticipation();
    expect(container.querySelector('.fixed.inset-0')).toBeInTheDocument();
  });

  it('clears the open task and the url params when the overlay is clicked', async () => {
    const user = userEvent.setup();
    setUrl('taskId=task-1&prizeId=prize-1');
    const { container } = renderParticipation();

    await user.click(container.querySelector('.fixed.inset-0') as Element);

    expect(container.querySelector('.fixed.inset-0')).not.toBeInTheDocument();
    expect(window.location.search).toBe('');
  });

  it('writes the opened task to the url', async () => {
    const user = userEvent.setup();
    renderParticipation();
    await user.click(screen.getByRole('tab', { name: 'Tasks' }));
    await user.click(screen.getByRole('button', { name: 'open second task' }));
    expect(screen.getByText('open task: task-2')).toBeInTheDocument();
    expect(window.location.search).toBe('?taskId=task-2');
  });

  it('clears the open task when switching tabs', async () => {
    const user = userEvent.setup();
    renderParticipation();
    await user.click(screen.getByRole('tab', { name: 'Tasks' }));
    await user.click(screen.getByRole('button', { name: 'open second task' }));
    await user.click(screen.getByRole('tab', { name: 'Prizes' }));
    await user.click(screen.getByRole('tab', { name: 'Tasks' }));
    expect(screen.getByText('open task: none')).toBeInTheDocument();
    expect(window.location.search).toBe('');
  });
});
