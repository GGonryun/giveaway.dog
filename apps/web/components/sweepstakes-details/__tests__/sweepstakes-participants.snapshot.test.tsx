import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildCompletion,
  buildParticipant,
  buildUser,
  withStableIds
} from '@giveaway/sweepstakes-ui-testing/testing/fixtures';
import { SweepstakesParticipants } from '../sweepstakes-participants';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn(), refresh: vi.fn() }
}));

vi.mock('next/navigation', () => ({ useRouter: () => navigation.router }));

vi.mock('@/procedures/sweepstakes/disqualify-participant', () => ({
  disqualifyParticipant: vi.fn()
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const jane = buildParticipant({
  id: 'participant-1',
  user: buildUser({ id: 'user-1', name: 'Jane Doe', qualityScore: 95 }),
  completions: [
    buildCompletion({ id: 'c-1', completedAt: new Date(2026, 8, 28, 15, 45) }),
    buildCompletion({ id: 'c-2', completedAt: new Date(2026, 8, 30, 9, 5) })
  ]
});

const lurker = buildParticipant({
  id: 'participant-2',
  user: buildUser({
    id: 'user-2',
    name: null,
    email: 'lurker@example.com',
    qualityScore: 20
  }),
  completions: []
});

const renderParticipants = (participants = [jane, lurker], totalTasks = 4) =>
  render(
    <SweepstakesParticipants
      slug="acme"
      sweepstakesId="sweep-1"
      totalTasks={totalTasks}
      participants={participants}
    />
  );

describe('SweepstakesParticipants', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('matches the snapshot', () => {
    const { container } = renderParticipants();
    expect(withStableIds(container)).toMatchSnapshot();
  });
});
