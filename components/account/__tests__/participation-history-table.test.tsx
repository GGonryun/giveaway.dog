import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import withdrawParticipation from '@/procedures/user/withdraw-participation';
import type { ParticipationHistoryItem } from '@/schemas/participation-history';
import { ParticipationHistoryTable } from '../participation-history-table';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn(), refresh: vi.fn() }
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation.router
}));

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

const createItem = (
  index: number,
  overrides: Partial<ParticipationHistoryItem> = {}
): ParticipationHistoryItem => ({
  sweepstakesId: `sweepstakes-${index}`,
  sweepstakesName: `Giveaway ${index}`,
  sweepstakesStartDate: new Date('2026-01-01T12:00:00.000Z'),
  sweepstakesEndDate: new Date('2026-12-31T12:00:00.000Z'),
  engagement: 50,
  totalTasks: 4,
  completedTasks: 2,
  lastParticipatedAt: '2026-02-14T15:30:00',
  banner: null,
  sweepstakesStatus: 'RUNNING',
  hasWon: false,
  ...overrides
});

const history: ParticipationHistoryItem[] = [
  createItem(1, {
    sweepstakesName: 'Summer Gear Giveaway',
    engagement: 85,
    hasWon: true
  }),
  createItem(2, {
    sweepstakesName: 'Winter Coffee Raffle',
    engagement: 30,
    sweepstakesStatus: 'COMPLETED'
  }),
  createItem(3, {
    sweepstakesName: 'Spring Book Bundle',
    sweepstakesStatus: 'SCHEDULED'
  })
];

const rowFor = (name: string) =>
  screen.getByRole('row', { name: new RegExp(name) });

const openActions = async (
  user: ReturnType<typeof userEvent.setup>,
  name: string
) => {
  await user.click(within(rowFor(name)).getByRole('button'));
};

describe('ParticipationHistoryTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(withdrawParticipation).mockResolvedValue({
      ok: true,
      data: { success: true }
    });
  });

  describe('when the user has not participated yet', () => {
    it('shows an empty state instead of a table', () => {
      render(<ParticipationHistoryTable history={[]} />);

      expect(
        screen.getByText("You haven't participated in any giveaways yet.")
      ).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
      expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    });
  });

  describe('when the user has participated', () => {
    it('matches the snapshot', () => {
      const { container } = render(
        <ParticipationHistoryTable history={history.slice(0, 2)} />
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('links each giveaway to its page', () => {
      render(<ParticipationHistoryTable history={history} />);

      expect(
        screen.getByRole('link', { name: 'Summer Gear Giveaway' })
      ).toHaveAttribute('href', '/browse/sweepstakes-1');
    });

    it('shows progress, status and last activity for each giveaway', () => {
      render(<ParticipationHistoryTable history={history} />);

      const row = rowFor('Winter Coffee Raffle');
      expect(row).toHaveTextContent('30%');
      expect(row).toHaveTextContent('Completed');
      expect(row).toHaveTextContent('Feb 14, 2026, 03:30 PM');
    });

    it('counts the wins next to the filter', () => {
      render(<ParticipationHistoryTable history={history} />);

      expect(
        screen.getByRole('switch', { name: 'Show wins only(1)' })
      ).not.toBeChecked();
    });

    it('omits the win count when there are no wins', () => {
      render(
        <ParticipationHistoryTable history={[createItem(1), createItem(2)]} />
      );

      expect(
        screen.getByRole('switch', { name: 'Show wins only' })
      ).toBeInTheDocument();
    });
  });

  describe('when showing wins only', () => {
    it('lists only the giveaways the user won', async () => {
      const user = userEvent.setup();
      render(<ParticipationHistoryTable history={history} />);

      await user.click(screen.getByRole('switch'));

      expect(
        screen.getByRole('link', { name: 'Summer Gear Giveaway' })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: 'Winter Coffee Raffle' })
      ).not.toBeInTheDocument();
    });

    it('explains when the user has not won anything yet', async () => {
      const user = userEvent.setup();
      render(
        <ParticipationHistoryTable history={[createItem(1), createItem(2)]} />
      );

      await user.click(screen.getByRole('switch'));

      expect(
        screen.getByText("You haven't won any giveaways yet.")
      ).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('lists everything again once the filter is turned off', async () => {
      const user = userEvent.setup();
      render(<ParticipationHistoryTable history={history} />);

      await user.click(screen.getByRole('switch'));
      await user.click(screen.getByRole('switch'));

      expect(screen.getAllByRole('link')).toHaveLength(3);
    });
  });

  describe('when there are more than 50 giveaways', () => {
    const manyItems = Array.from({ length: 51 }, (_, index) =>
      createItem(index + 1, { hasWon: index === 50 })
    );

    it('shows the first 50 on the first page', () => {
      render(<ParticipationHistoryTable history={manyItems} />);

      expect(screen.getAllByRole('link')).toHaveLength(50);
      expect(screen.getByText(/1-50 of 51/)).toBeInTheDocument();
    });

    it('shows the rest on the next page', async () => {
      const user = userEvent.setup();
      render(<ParticipationHistoryTable history={manyItems} />);

      await user.click(screen.getByRole('button', { name: 'Next page' }));

      expect(screen.getAllByRole('link')).toHaveLength(1);
      expect(
        screen.getByRole('link', { name: 'Giveaway 51' })
      ).toBeInTheDocument();
    });

    it('returns to the first page when the wins filter changes', async () => {
      const user = userEvent.setup();
      render(<ParticipationHistoryTable history={manyItems} />);

      await user.click(screen.getByRole('button', { name: 'Next page' }));
      await user.click(screen.getByRole('switch'));

      expect(screen.getByText(/1-1 of 1/)).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'Giveaway 51' })
      ).toBeInTheDocument();
    });
  });

  describe('row actions', () => {
    it('links to the giveaway from the actions menu', async () => {
      const user = userEvent.setup();
      render(<ParticipationHistoryTable history={history} />);

      await openActions(user, 'Winter Coffee Raffle');

      expect(screen.getByRole('menuitem', { name: 'View' })).toHaveAttribute(
        'href',
        '/browse/sweepstakes-2'
      );
    });

    it.each([
      ['running', 'Summer Gear Giveaway'],
      ['scheduled', 'Spring Book Bundle']
    ])('offers to withdraw from a %s giveaway', async (_status, name) => {
      const user = userEvent.setup();
      render(<ParticipationHistoryTable history={history} />);

      await openActions(user, name);

      expect(
        screen.getByRole('menuitem', { name: 'Withdraw' })
      ).toBeInTheDocument();
    });

    it('does not offer to withdraw from a finished giveaway', async () => {
      const user = userEvent.setup();
      render(<ParticipationHistoryTable history={history} />);

      await openActions(user, 'Winter Coffee Raffle');

      expect(
        screen.queryByRole('menuitem', { name: 'Withdraw' })
      ).not.toBeInTheDocument();
    });
  });

  describe('when withdrawing from a giveaway', () => {
    it('asks to confirm withdrawing from that giveaway', async () => {
      const user = userEvent.setup();
      render(<ParticipationHistoryTable history={history} />);

      await openActions(user, 'Spring Book Bundle');
      await user.click(screen.getByRole('menuitem', { name: 'Withdraw' }));

      expect(
        screen.getByRole('alertdialog', { name: 'Withdraw from Giveaway' })
      ).toHaveTextContent('withdraw from Spring Book Bundle?');
    });

    it('withdraws and refreshes the history once confirmed', async () => {
      const user = userEvent.setup();
      render(<ParticipationHistoryTable history={history} />);

      await openActions(user, 'Spring Book Bundle');
      await user.click(screen.getByRole('menuitem', { name: 'Withdraw' }));
      await user.click(screen.getByRole('button', { name: 'Withdraw' }));

      await waitFor(() => expect(navigation.router.refresh).toHaveBeenCalled());
      expect(withdrawParticipation).toHaveBeenCalledWith({
        sweepstakesId: 'sweepstakes-3'
      });
    });
  });
});
