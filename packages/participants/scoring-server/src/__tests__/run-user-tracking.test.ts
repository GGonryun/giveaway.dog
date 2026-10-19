import { describe, it, expect, beforeEach } from 'vitest';
import { UserEventType, type UserEvent } from '@giveaway/db-model';
import { MAX_TRACKING_REQUESTS_PER_RUN } from '@giveaway/scoring-model/user-scoring';
import {
  createPrismaMock,
  prismaMock,
  type PrismaMock,
  asPrismaClient
} from '@giveaway/testing-server/prisma';
import { runUserTracking } from '../run-user-tracking';

const db = asPrismaClient();

const event = (overrides: Partial<UserEvent> = {}): UserEvent => ({
  id: 'event-1',
  userId: 'user-1',
  type: UserEventType.TRACKING,
  geo: null,
  acceptLanguage: 'en-US',
  timeZone: 'UTC',
  screen: '1280x800',
  userAgent: null,
  timestamp: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides
});

describe('runUserTracking', () => {
  let tx: PrismaMock;

  beforeEach(() => {
    tx = createPrismaMock();
    prismaMock.$transaction.mockImplementation(
      async (fn: (client: PrismaMock) => Promise<unknown>) => fn(tx)
    );
    prismaMock.userEvent.findMany.mockResolvedValue([]);
    tx.deviceFingerprint.upsert.mockResolvedValue({ id: 'fp-1' });
  });

  it('reads the oldest events of every user', async () => {
    await runUserTracking(db);

    expect(prismaMock.userEvent.findMany).toHaveBeenCalledWith({
      take: MAX_TRACKING_REQUESTS_PER_RUN,
      orderBy: { timestamp: 'asc' }
    });
  });

  it('reads only the events of one user when it is given', async () => {
    await runUserTracking(db, { userId: 'user-1' });

    expect(prismaMock.userEvent.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      take: MAX_TRACKING_REQUESTS_PER_RUN,
      orderBy: { timestamp: 'asc' }
    });
  });

  it('turns each event into signals and a scoring request', async () => {
    prismaMock.userEvent.findMany.mockResolvedValue([event()]);

    await expect(runUserTracking(db, { userId: 'user-1' })).resolves.toEqual({
      processed: 1,
      errors: 0,
      total: 1
    });
    expect(tx.userFingerprint.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: { userId: 'user-1', fingerprintId: 'fp-1', count: 1 }
      })
    );
    expect(tx.userScoringRequest.upsert).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      create: { userId: 'user-1' },
      update: {}
    });
    expect(tx.userEvent.delete).toHaveBeenCalledWith({
      where: { id: 'event-1' }
    });
  });
});
