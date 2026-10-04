import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import withdrawParticipation from '@/procedures/user/withdraw-participation';
import type { ParticipationHistoryItem } from '@giveaway/participation-history-model/participation-history';
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

describe('ParticipationHistoryTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(withdrawParticipation).mockResolvedValue({
      ok: true,
      data: { success: true }
    });
  });

  describe('when the user has participated', () => {
    it('matches the snapshot', () => {
      const { container } = render(
        <ParticipationHistoryTable history={history.slice(0, 2)} />
      );

      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
