import { describe, it, expect } from 'vitest';
import { getLoyalty } from '../db';
import { prismaMock, asPrismaClient } from '@/test/prisma';

describe('getLoyalty', () => {
  it('returns the number of participations counted by the database', async () => {
    prismaMock.sweepstakesParticipant.count.mockResolvedValue(4);

    const loyalty = await getLoyalty(asPrismaClient(), {
      userId: 'user-1',
      teamId: 'team-1'
    });

    expect(loyalty).toBe(4);
  });

  it('returns zero when the user has no qualifying participations', async () => {
    prismaMock.sweepstakesParticipant.count.mockResolvedValue(0);

    const loyalty = await getLoyalty(asPrismaClient(), {
      userId: 'user-1',
      teamId: 'team-1'
    });

    expect(loyalty).toBe(0);
  });

  it('counts participations of the user in sweepstakes of the team with a completed or pending task', async () => {
    prismaMock.sweepstakesParticipant.count.mockResolvedValue(1);

    await getLoyalty(asPrismaClient(), { userId: 'user-7', teamId: 'team-3' });

    expect(prismaMock.sweepstakesParticipant.count).toHaveBeenCalledWith({
      where: {
        userId: 'user-7',
        sweepstakes: { teamId: 'team-3' },
        taskCompletions: {
          some: { status: { in: ['COMPLETED', 'PENDING'] } }
        }
      }
    });
  });

  it('propagates database errors', async () => {
    prismaMock.sweepstakesParticipant.count.mockRejectedValue(
      new Error('db down')
    );

    await expect(
      getLoyalty(asPrismaClient(), { userId: 'user-1', teamId: 'team-1' })
    ).rejects.toThrow('db down');
  });
});
