import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamsProvider } from '@giveaway/team-context/team-provider';
import {
  NOW,
  buildTask,
  buildTeam,
  buildUser,
  buildUserEntry
} from '@/components/sweepstakes/__tests__/fixtures';
import {
  TaskCompletionDetailSheet,
  TaskCompletionDetailSheetContent
} from '../task-completion-detail-sheet';
import { VerificationInstructionsDialog } from '../verification-instructions-dialog';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn(), back: vi.fn() },
  pathname: '/app/acme/sweepstakes/sweep-1/entries/task/task-1',
  searchParams: new URLSearchParams()
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation.router,
  usePathname: () => navigation.pathname,
  useSearchParams: () => navigation.searchParams
}));

vi.mock('../verification-instructions-dialog', () => ({
  VerificationInstructionsDialog: vi.fn(({ open }: { open: boolean }) =>
    open ? <div>verification dialog</div> : null
  )
}));

const HOUR = 60 * 60 * 1000;
const hello = buildTask({ id: 'task-1', title: 'Say hello' });
const share = buildTask({ id: 'task-2', title: 'Share the giveaway' });
const jane = buildUser({
  id: 'user-1',
  name: 'Jane Doe',
  email: 'jane@example.com'
});
const sam = buildUser({
  id: 'user-2',
  name: 'Sam Smith',
  email: 'sam@example.com',
  countryCode: 'CA',
  qualityScore: 55
});
const alex = buildUser({
  id: 'user-3',
  name: 'Alex Kim',
  email: 'alex@example.com'
});
const kim = buildUser({
  id: 'user-4',
  name: 'Kim Lee',
  email: 'kim@example.com'
});

const entries = [
  buildUserEntry({
    id: 'entry-1',
    task: hello,
    user: jane,
    status: 'COMPLETED',
    completedAt: NOW.getTime() - 5 * HOUR,
    proof: { answer: 'hello there' }
  }),
  buildUserEntry({
    id: 'entry-2',
    task: hello,
    user: sam,
    status: 'PENDING',
    completedAt: NOW.getTime() - 1 * HOUR
  }),
  buildUserEntry({
    id: 'entry-3',
    task: hello,
    user: alex,
    status: 'REJECTED',
    completedAt: NOW.getTime() - 3 * HOUR,
    reason: 'Fake account'
  }),
  buildUserEntry({
    id: 'entry-4',
    task: share,
    user: jane,
    completedAt: NOW.getTime() - 2 * HOUR
  }),
  buildUserEntry({
    id: 'entry-5',
    task: share,
    user: kim,
    completedAt: NOW.getTime() - 2 * HOUR
  })
];

const team = buildTeam();

const Providers = ({ children }: { children: ReactNode }) => (
  <TeamsProvider value={{ activeTeam: team, teams: [team] }}>
    <TaskCompletionDetailSheet sweepstakesId="sweep-1" slug="acme">
      {children}
    </TaskCompletionDetailSheet>
  </TeamsProvider>
);

const renderContent = (active: string | null, list = entries) => {
  navigation.pathname = '/app/acme/sweepstakes/sweep-1/entries/task/task-1';
  navigation.searchParams = new URLSearchParams(
    active ? `active=${active}` : ''
  );
  return render(
    <Providers>
      <TaskCompletionDetailSheetContent
        entries={list}
        sweepstakesId="sweep-1"
      />
    </Providers>
  );
};

const statistic = (label: string) =>
  screen.getByText(label).previousElementSibling?.textContent;

const breakdown = (label: string) =>
  screen.getByText(label, { selector: 'span:not([data-slot="badge"])' })
    .parentElement?.nextElementSibling?.textContent;

describe('TaskCompletionDetailSheetContent', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('asks for a selection without an active completion', () => {
    renderContent(null);
    expect(
      screen.getByText('No task completion selected.')
    ).toBeInTheDocument();
  });

  it('asks for a selection when the active completion is unknown', () => {
    renderContent('entry-404');
    expect(
      screen.getByText('No task completion selected.')
    ).toBeInTheDocument();
  });

  it('titles the sheet with the task of the completion', () => {
    renderContent('entry-1');
    expect(
      screen.getByRole('dialog', { name: 'Say hello' })
    ).toBeInTheDocument();
    expect(screen.getByText('BONUS_TASK')).toBeInTheDocument();
  });

  describe('task statistics', () => {
    it('counts the completions of the task and the completion rate across participants', () => {
      renderContent('entry-1');
      expect(statistic('Total Completions')).toBe('3');
      expect(statistic('Completion Rate')).toBe('75%');
      expect(statistic('Verified')).toBe('1');
    });

    it('breaks the completions down by status', () => {
      renderContent('entry-1');
      expect(breakdown('Completed')).toBe('1');
      expect(breakdown('Rejected')).toBe('1');
    });

    it('never counts pending completions as pending review', () => {
      renderContent('entry-2');
      expect(breakdown('Pending Review')).toBe('0');
    });

    it('groups completions of different tasks that share a title', () => {
      const twin = buildTask({ id: 'task-9', title: 'Say hello' });
      renderContent('entry-1', [
        ...entries,
        buildUserEntry({ id: 'entry-9', task: twin, user: kim })
      ]);
      expect(statistic('Total Completions')).toBe('4');
    });
  });

  describe('this completion', () => {
    it('shows the participant, status and time of the completion', () => {
      renderContent('entry-2');
      const section = screen.getByRole('heading', { name: 'This Completion' })
        .nextElementSibling as HTMLElement;
      expect(within(section).getByText('Pending Review')).toBeInTheDocument();
      expect(within(section).getByText('1 hour ago')).toBeInTheDocument();
      expect(within(section).getByText('Sam Smith')).toBeInTheDocument();
      expect(
        within(section).getByText('s***m@example.com')
      ).toBeInTheDocument();
      expect(within(section).getByText('CA')).toBeInTheDocument();
      expect(
        within(section).getByText('Quality Score: 55')
      ).toBeInTheDocument();
    });

    it('shows the rejection reason of a rejected completion', () => {
      renderContent('entry-3');
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Rejection Reason:Fake account'
      );
    });

    it('does not show a rejection reason otherwise', () => {
      renderContent('entry-1');
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('shows the submitted proof in a dialog', async () => {
      const user = userEvent.setup();
      renderContent('entry-1');

      expect(screen.getByText('Proof Submitted')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'View' }));

      const proofDialog = screen.getByRole('dialog', { name: 'Task Proof' });
      expect(proofDialog).toHaveAccessibleDescription(
        'Proof submitted by Jane Doe'
      );
      expect(
        within(proofDialog).getByText(/"answer": "hello there"/)
      ).toBeInTheDocument();
    });

    it('hides the proof section without proof', () => {
      renderContent('entry-2');
      expect(screen.queryByText('Proof Submitted')).not.toBeInTheDocument();
    });
  });

  describe('recent completions', () => {
    it('lists the completions of the task from newest to oldest', () => {
      renderContent('entry-1');
      expect(screen.getByText('3 shown')).toBeInTheDocument();
      const links = within(
        screen.getByRole('heading', { name: 'Recent Completions' })
          .parentElement?.nextElementSibling as HTMLElement
      ).getAllByRole('link');
      expect(links.map((link) => link.getAttribute('href'))).toEqual([
        '/app/acme/users/user-2',
        '/app/acme/users/user-3',
        '/app/acme/users/user-1'
      ]);
    });

    it('shows at most ten completions', () => {
      const many = Array.from({ length: 12 }, (_, index) =>
        buildUserEntry({
          id: `entry-${index}`,
          task: hello,
          user: buildUser({
            id: `user-${index}`,
            email: `u${index}@example.com`
          })
        })
      );
      renderContent('entry-0', many);
      expect(screen.getByText('10 shown')).toBeInTheDocument();
    });
  });

  describe('actions', () => {
    it('opens the verification dialog for the completion', async () => {
      const user = userEvent.setup();
      renderContent('entry-2');

      await user.click(screen.getByRole('button', { name: 'Verify Entry' }));

      expect(screen.getByText('verification dialog')).toBeInTheDocument();
      expect(
        vi.mocked(VerificationInstructionsDialog).mock.lastCall?.[0]
      ).toMatchObject({
        open: true,
        taskCompletionId: 'entry-2',
        sweepstakesId: 'sweep-1',
        task: hello,
        user: sam,
        currentStatus: 'PENDING'
      });
    });

    it('goes back when the details are closed', async () => {
      const user = userEvent.setup();
      renderContent('entry-2');
      await user.click(screen.getByRole('button', { name: 'Close Details' }));
      expect(navigation.router.back).toHaveBeenCalledTimes(1);
    });
  });
});

describe('TaskCompletionDetailSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderSheet = (pathname: string, root?: 'entries' | 'winners') => {
    navigation.pathname = pathname;
    return render(
      <TaskCompletionDetailSheet
        sweepstakesId="sweep-1"
        slug="acme"
        root={root}
      >
        <p>sheet body</p>
      </TaskCompletionDetailSheet>
    );
  };

  it('stays closed when the path has no task', () => {
    renderSheet('/app/acme/sweepstakes/sweep-1/entries');
    expect(screen.queryByText('sheet body')).not.toBeInTheDocument();
  });

  it('opens for a task in the entries path', () => {
    renderSheet('/app/acme/sweepstakes/sweep-1/entries/task/task-1');
    expect(screen.getByRole('dialog')).toHaveTextContent('sheet body');
  });

  it('does not open for a winners task path under the entries root', () => {
    renderSheet('/app/acme/sweepstakes/sweep-1/winners/task/task-1');
    expect(screen.queryByText('sheet body')).not.toBeInTheDocument();
  });

  it('returns to the entries list when closed', async () => {
    const user = userEvent.setup();
    renderSheet('/app/acme/sweepstakes/sweep-1/entries/task/task-1');
    await user.keyboard('{Escape}');
    expect(navigation.router.push).toHaveBeenCalledWith(
      '/app/acme/sweepstakes/sweep-1/entries'
    );
  });

  it('returns to the winners list when closed under the winners root', async () => {
    const user = userEvent.setup();
    renderSheet('/app/acme/sweepstakes/sweep-1/winners/task/task-1', 'winners');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(navigation.router.push).toHaveBeenCalledWith(
      '/app/acme/sweepstakes/sweep-1/winners'
    );
  });
});
