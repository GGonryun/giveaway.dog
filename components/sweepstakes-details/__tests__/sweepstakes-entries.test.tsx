import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  NOW,
  buildTask,
  buildUser,
  buildUserEntry,
  withStableIds
} from '@/components/sweepstakes/__tests__/fixtures';
import { DeleteEntryDialog } from '../delete-entry-dialog';
import { SweepstakesEntries } from '../sweepstakes-entries';
import { VerificationInstructionsDialog } from '../verification-instructions-dialog';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn(), refresh: vi.fn() }
}));

vi.mock('next/navigation', () => ({ useRouter: () => navigation.router }));

vi.mock('../verification-instructions-dialog', () => ({
  VerificationInstructionsDialog: vi.fn(({ open }: { open: boolean }) =>
    open ? <div>verification dialog</div> : null
  )
}));

vi.mock('../delete-entry-dialog', () => ({
  DeleteEntryDialog: vi.fn(({ open }: { open: boolean }) =>
    open ? <div>delete dialog</div> : null
  )
}));

const DAY = 24 * 60 * 60 * 1000;

const jane = buildUser({ id: 'user-1', name: 'Jane Doe' });
const sam = buildUser({
  id: 'user-2',
  name: 'Sam Smith',
  email: 'sam@example.com',
  countryCode: 'CA'
});

const entries = [
  buildUserEntry({
    id: 'entry-1',
    user: jane,
    task: buildTask({ id: 'task-1', title: 'Say hello' }),
    status: 'COMPLETED',
    completedAt: NOW.getTime() - DAY
  }),
  buildUserEntry({
    id: 'entry-2',
    user: sam,
    task: buildTask({ id: 'task-2', title: 'Share the giveaway' }),
    status: 'PENDING',
    completedAt: NOW.getTime() - 3 * 60 * 60 * 1000
  })
];

const manyEntries = Array.from({ length: 30 }, (_, index) =>
  buildUserEntry({ id: `entry-${index + 1}`, completedAt: NOW.getTime() })
);

const renderEntries = (list = entries) =>
  render(
    <SweepstakesEntries slug="acme" sweepstakesId="sweep-1" entries={list} />
  );

const bodyRows = () => screen.getAllByRole('row').slice(1);

describe('SweepstakesEntries', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('matches the snapshot', () => {
    const { container } = renderEntries();
    expect(withStableIds(container)).toMatchSnapshot();
  });

  it('renders the entry columns', () => {
    renderEntries();
    expect(
      screen.getAllByRole('columnheader').map((cell) => cell.textContent)
    ).toEqual(['Status', 'Task', 'Participant', 'Country', 'Updated', '']);
  });

  it('describes each entry', () => {
    renderEntries();
    const [first, second] = bodyRows();
    expect(within(first).getByText('Completed')).toBeInTheDocument();
    expect(
      within(first).getByRole('button', { name: 'Say hello' })
    ).toBeInTheDocument();
    expect(within(first).getByText('Bonus')).toBeInTheDocument();
    expect(
      within(first).getByRole('button', { name: 'Jane Doe' })
    ).toBeInTheDocument();
    expect(within(first).getByText('j***e@example.com')).toBeInTheDocument();
    expect(within(first).getByText('US')).toBeInTheDocument();
    expect(within(first).getByText('1 day ago')).toBeInTheDocument();
    expect(within(second).getByText('Pending Review')).toBeInTheDocument();
    expect(within(second).getByText('CA')).toBeInTheDocument();
    expect(within(second).getByText('3 hours ago')).toBeInTheDocument();
  });

  describe('navigation', () => {
    it('opens the task details of a clicked row', async () => {
      const user = userEvent.setup();
      renderEntries();
      await user.click(within(bodyRows()[1]).getByText('CA'));
      expect(navigation.router.push).toHaveBeenCalledWith(
        '/app/acme/sweepstakes/sweep-1/entries/task/task-2?active=entry-2'
      );
    });

    it('opens the participant details when the name is clicked', async () => {
      const user = userEvent.setup();
      renderEntries();
      await user.click(screen.getByRole('button', { name: 'Sam Smith' }));
      expect(navigation.router.push).toHaveBeenCalledTimes(1);
      expect(navigation.router.push).toHaveBeenCalledWith(
        '/app/acme/sweepstakes/sweep-1/entries/user/user-2'
      );
    });
  });

  describe('pagination', () => {
    it('shows 25 entries per page', () => {
      renderEntries(manyEntries);
      expect(bodyRows()).toHaveLength(25);
      expect(screen.getByText(/1-25 of 30/)).toBeInTheDocument();
    });

    it('shows the remaining entries on the next page', async () => {
      const user = userEvent.setup();
      renderEntries(manyEntries);
      await user.click(screen.getByRole('button', { name: 'Next page' }));
      expect(bodyRows()).toHaveLength(5);
      expect(screen.getByText(/26-30 of 30/)).toBeInTheDocument();
    });

    it('describes an empty list as page 1 of 0', () => {
      renderEntries([]);
      expect(bodyRows()).toHaveLength(0);
      expect(screen.getByText(/1-0 of 0/)).toBeInTheDocument();
    });
  });

  describe('entry actions', () => {
    const openActions = async (rowIndex: number) => {
      const user = userEvent.setup();
      await user.click(within(bodyRows()[rowIndex]).getAllByRole('button')[2]);
      return user;
    };

    it('does not render the dialogs before an entry is chosen', () => {
      renderEntries();
      expect(VerificationInstructionsDialog).not.toHaveBeenCalled();
      expect(DeleteEntryDialog).not.toHaveBeenCalled();
    });

    it('opens the verification dialog for the entry', async () => {
      renderEntries();
      const user = await openActions(1);
      await user.click(screen.getByRole('menuitem', { name: 'Verify Entry' }));

      expect(screen.getByText('verification dialog')).toBeInTheDocument();
      expect(
        vi.mocked(VerificationInstructionsDialog).mock.lastCall?.[0]
      ).toMatchObject({
        open: true,
        taskCompletionId: 'entry-2',
        sweepstakesId: 'sweep-1',
        task: entries[1].task,
        user: sam,
        currentStatus: 'PENDING'
      });
      expect(navigation.router.push).not.toHaveBeenCalled();
    });

    it('opens the delete dialog and refreshes after a deletion', async () => {
      renderEntries();
      const user = await openActions(0);
      await user.click(screen.getByRole('menuitem', { name: 'Delete Entry' }));

      expect(screen.getByText('delete dialog')).toBeInTheDocument();
      const props = vi.mocked(DeleteEntryDialog).mock.lastCall?.[0];
      expect(props).toMatchObject({
        open: true,
        completion: entries[0],
        sweepstakesId: 'sweep-1'
      });

      props?.onDeleted?.();
      expect(navigation.router.refresh).toHaveBeenCalledTimes(1);
      expect(navigation.router.push).not.toHaveBeenCalled();
    });
  });
});
