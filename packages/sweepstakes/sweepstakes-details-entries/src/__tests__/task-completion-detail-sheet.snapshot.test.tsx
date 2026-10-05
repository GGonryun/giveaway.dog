import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamsProvider } from '@giveaway/team-context/team-provider';
import {
  NOW,
  buildTask,
  buildTeam,
  buildUser,
  buildUserEntry,
  withStableIds
} from '@giveaway/sweepstakes-ui-testing/testing/fixtures';
import {
  TaskCompletionDetailSheet,
  TaskCompletionDetailSheetContent
} from '../task-completion-detail-sheet';

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

describe('TaskCompletionDetailSheetContent', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('matches the snapshot for a selected completion', () => {
    renderContent('entry-3');
    expect(withStableIds(screen.getByRole('dialog'))).toMatchSnapshot();
  });
});
