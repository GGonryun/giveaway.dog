import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildCompletion,
  buildCriteria,
  buildParticipant,
  buildPrize,
  buildProvider,
  buildSweepstakes,
  buildTask,
  buildUser,
  renderWithParticipation,
  withStableIds
} from '@/components/sweepstakes/__tests__/fixtures';
import type { GiveawayParticipationProps } from '@/components/sweepstakes/giveaway-participation-context';
import { ActiveParticipation } from '../active-participation';

const navigation = vi.hoisted(() => ({
  pathname: '/browse/summer-giveaway',
  searchParams: new URLSearchParams()
}));

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useSearchParams: () => navigation.searchParams
}));

vi.mock('@/lib/auth/procedures/logout', () => ({ default: vi.fn() }));

vi.mock('@/components/auth/login-options', () => ({
  LoginOptions: () => <div data-testid="login-options" />
}));

vi.mock('@/lib/task/components/public-sweepstakes/task-list', () => ({
  TaskList: ({
    open,
    setOpen,
    setActiveTab
  }: {
    open: string | null;
    setOpen: (open: string | null) => void;
    setActiveTab: (tab: string) => void;
  }) => (
    <div data-testid="task-list">
      <span>open task: {open ?? 'none'}</span>
      <button onClick={() => setOpen('task-1')}>open first task</button>
      <button onClick={() => setActiveTab('prizes')}>show prizes</button>
    </div>
  )
}));

const connectedUser = buildUser({
  providers: [buildProvider({ type: 'TWITTER' })]
});

const prizes = [
  buildPrize({ id: 'prize-1', name: 'Gaming Headset', quota: 1 }),
  buildPrize({ id: 'prize-2', name: 'Gift Card', quota: 2 })
];

const setUrl = (search: string) => {
  navigation.searchParams = new URLSearchParams(search);
  window.history.replaceState(
    {},
    '',
    `${navigation.pathname}${search ? `?${search}` : ''}`
  );
};

const renderActive = (overrides: Partial<GiveawayParticipationProps> = {}) =>
  renderWithParticipation(<ActiveParticipation />, overrides);

const selectionSweepstakes = buildSweepstakes({
  prizes,
  criteria: buildCriteria({ allowUserSelection: true })
});

describe('ActiveParticipation', () => {
  beforeEach(() => {
    setUrl('');
  });

  describe('snapshots', () => {
    it('matches the snapshot for a participant on the tasks tab', () => {
      const { container } = renderActive({
        participant: buildParticipant({
          completions: [buildCompletion()]
        })
      });
      expect(withStableIds(container)).toMatchSnapshot();
    });

    it('matches the snapshot when winners are pending', () => {
      const { container } = renderActive({
        state: 'winners-pending',
        sweepstakes: buildSweepstakes({ prizes }),
        participant: buildParticipant({
          user: connectedUser,
          allocation: { prize: { id: 'prize-2', name: 'Gift Card' } }
        })
      });
      expect(withStableIds(container)).toMatchSnapshot();
    });
  });

  describe('initial tab', () => {
    it('opens the tasks tab by default', () => {
      renderActive();
      expect(screen.getByRole('tab', { name: 'Tasks' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      expect(screen.getByTestId('task-list')).toBeInTheDocument();
    });

    it('opens the prizes tab when the participant still has to pick a prize', () => {
      renderActive({
        sweepstakes: selectionSweepstakes,
        participant: buildParticipant({ user: connectedUser })
      });
      expect(screen.getByRole('tab', { name: 'Prizes' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      expect(screen.getByRole('alert')).toHaveTextContent(
        'What prize are you competing for?'
      );
    });

    it('opens the tasks tab when the participant already picked a prize', () => {
      renderActive({
        sweepstakes: selectionSweepstakes,
        participant: buildParticipant({
          user: connectedUser,
          allocation: { prize: { id: 'prize-1', name: 'Gaming Headset' } }
        })
      });
      expect(screen.getByRole('tab', { name: 'Tasks' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
    });

    it('opens the prizes tab and shows the pending notice when winners are pending', () => {
      renderActive({ state: 'winners-pending' });
      expect(screen.getByRole('tab', { name: 'Prizes' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      expect(screen.getByText('Winners Being Selected')).toBeInTheDocument();
    });
  });

  describe('progress', () => {
    it('counts completed tasks without rejected ones and sums entries of every completion', () => {
      const tasks = [
        buildTask({ id: 'task-1', value: 1 }),
        buildTask({ id: 'task-2', value: 2 }),
        buildTask({ id: 'task-3', value: 5 })
      ];
      renderActive({
        sweepstakes: buildSweepstakes({ tasks }),
        participant: buildParticipant({
          completions: [
            buildCompletion({ id: 'c-1', task: tasks[0], status: 'COMPLETED' }),
            buildCompletion({ id: 'c-2', task: tasks[1], status: 'REJECTED' }),
            buildCompletion({ id: 'c-3', task: tasks[2], status: 'PENDING' })
          ]
        })
      });
      expect(screen.getByText('Your entries: 8')).toBeInTheDocument();
      expect(screen.getByText('2/3 completed')).toBeInTheDocument();
    });

    it('shows zero progress for a visitor who is not signed in', () => {
      renderActive();
      expect(screen.getByText('Your entries: 0')).toBeInTheDocument();
      expect(screen.getByText('0/1 completed')).toBeInTheDocument();
    });

    it('hides progress for a visitor when there are no tasks', () => {
      renderActive({ sweepstakes: buildSweepstakes({ tasks: [] }) });
      expect(screen.queryByText(/Your entries/)).not.toBeInTheDocument();
    });
  });

  describe('empty states', () => {
    it('explains that there are no entry methods', () => {
      renderActive({ sweepstakes: buildSweepstakes({ tasks: [] }) });
      expect(
        screen.getByRole('heading', { name: 'No Entry Methods' })
      ).toBeInTheDocument();
      expect(screen.queryByTestId('task-list')).not.toBeInTheDocument();
    });

    it('explains that there are no prizes', async () => {
      const user = userEvent.setup();
      renderActive({ sweepstakes: buildSweepstakes({ prizes: [] }) });
      await user.click(screen.getByRole('tab', { name: 'Prizes' }));
      expect(
        screen.getByRole('heading', { name: 'No Prizes' })
      ).toBeInTheDocument();
    });
  });

  describe('prizes tab', () => {
    it('lists every prize', async () => {
      const user = userEvent.setup();
      renderActive({ sweepstakes: buildSweepstakes({ prizes }) });
      await user.click(screen.getByRole('tab', { name: 'Prizes' }));
      expect(
        screen.getByRole('heading', { name: 'Gaming Headset' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: 'Gift Card' })
      ).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('confirms which prize the participant is competing for', async () => {
      const user = userEvent.setup();
      renderActive({
        sweepstakes: selectionSweepstakes,
        participant: buildParticipant({
          user: connectedUser,
          allocation: { prize: { id: 'prize-2', name: 'Gift Card' } }
        })
      });
      await user.click(screen.getByRole('tab', { name: 'Prizes' }));
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('You are competing for Gift Card');
      expect(alert).toHaveTextContent(
        'Complete tasks to earn entries and increase your chances of winning!'
      );
    });

    it('uses the past tense for the allocation once winners are pending', () => {
      renderActive({
        state: 'winners-pending',
        sweepstakes: selectionSweepstakes,
        participant: buildParticipant({
          user: connectedUser,
          allocation: { prize: { id: 'prize-2', name: 'Gift Card' } }
        })
      });
      const alerts = screen.getAllByRole('alert');
      expect(alerts[1]).toHaveTextContent('You competed for Gift Card');
      expect(alerts[1]).not.toHaveTextContent('Complete tasks');
      expect(
        screen.queryByText('What prize are you competing for?')
      ).not.toBeInTheDocument();
    });

    it('lets the participant select a prize and collapses it afterwards', async () => {
      const user = userEvent.setup();
      let finishAllocation: () => void = () => {};
      const onAllocate = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            finishAllocation = resolve;
          })
      );
      renderActive({
        sweepstakes: selectionSweepstakes,
        participant: buildParticipant({ user: connectedUser }),
        onAllocate
      });

      await user.click(screen.getByRole('heading', { name: 'Gift Card' }));
      await user.click(
        screen.getByRole('button', { name: 'Select This Prize' })
      );

      expect(onAllocate).toHaveBeenCalledWith({ prize: prizes[1] });
      expect(
        screen.getByRole('button', { name: 'Selecting...' })
      ).toBeDisabled();

      await act(async () => {
        finishAllocation();
      });

      expect(screen.queryByText('Prize Details')).not.toBeInTheDocument();
      expect(window.location.search).toBe('');
    });

    it('does not offer prize selection when winners are pending', async () => {
      const user = userEvent.setup();
      renderActive({
        state: 'winners-pending',
        sweepstakes: selectionSweepstakes,
        participant: buildParticipant({ user: connectedUser })
      });
      await user.click(screen.getByRole('heading', { name: 'Gift Card' }));
      expect(screen.getByText('Prize Details')).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Select This Prize' })
      ).not.toBeInTheDocument();
    });

    it('asks a participant without an allowed identity to connect', async () => {
      const user = userEvent.setup();
      renderActive({
        sweepstakes: selectionSweepstakes,
        participant: buildParticipant()
      });
      await user.click(screen.getByRole('heading', { name: 'Gift Card' }));
      expect(screen.getByTestId('login-options')).toBeInTheDocument();
    });
  });

  describe('opening tasks and prizes from the url', () => {
    it('opens the task from the taskId search param and dims the page', () => {
      setUrl('taskId=task-1');
      const { container } = renderActive();
      expect(screen.getByText('open task: task-1')).toBeInTheDocument();
      expect(container.querySelector('.fixed.inset-0')).toBeInTheDocument();
    });

    it('closes the open task and clears the url param when the overlay is clicked', async () => {
      const user = userEvent.setup();
      setUrl('taskId=task-1');
      const { container } = renderActive();

      await user.click(container.querySelector('.fixed.inset-0') as Element);

      expect(screen.getByText('open task: none')).toBeInTheDocument();
      expect(container.querySelector('.fixed.inset-0')).not.toBeInTheDocument();
      expect(window.location.search).toBe('');
    });

    it('expands the prize from the prizeId search param', () => {
      setUrl('prizeId=prize-2');
      renderActive({
        sweepstakes: selectionSweepstakes,
        participant: buildParticipant({ user: connectedUser })
      });
      const trigger = screen
        .getByRole('heading', { name: 'Gift Card' })
        .closest('[aria-expanded]') as HTMLElement;
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(
        within(trigger.parentElement as HTMLElement).getByText('Prize Details')
      ).toBeInTheDocument();
    });
  });

  describe('task list callbacks', () => {
    it('writes the opened task to the url', async () => {
      const user = userEvent.setup();
      renderActive();
      await user.click(screen.getByRole('button', { name: 'open first task' }));
      expect(screen.getByText('open task: task-1')).toBeInTheDocument();
      expect(window.location.search).toBe('?taskId=task-1');
    });

    it('switches to the prizes tab and clears open items', async () => {
      const user = userEvent.setup();
      renderActive({ sweepstakes: buildSweepstakes({ prizes }) });
      await user.click(screen.getByRole('button', { name: 'open first task' }));
      await user.click(screen.getByRole('button', { name: 'show prizes' }));
      expect(screen.getByRole('tab', { name: 'Prizes' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      expect(window.location.search).toBe('');
    });
  });
});
