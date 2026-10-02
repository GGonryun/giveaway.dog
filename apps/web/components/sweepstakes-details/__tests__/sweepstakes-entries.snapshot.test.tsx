import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  NOW,
  buildTask,
  buildUser,
  buildUserEntry,
  withStableIds
} from '@/components/sweepstakes/__tests__/fixtures';
import { SweepstakesEntries } from '../sweepstakes-entries';

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

const renderEntries = (list = entries) =>
  render(
    <SweepstakesEntries slug="acme" sweepstakesId="sweep-1" entries={list} />
  );

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
});
