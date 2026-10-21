import { beforeEach, describe, expect, it, vi } from 'vitest';
import prisma from '@giveaway/db-client/prisma';
import { db } from '@giveaway/testing-integration/database';
import { createUser } from '@giveaway/testing-integration/fixtures';
import { runUserScoring } from '../run-user-scoring';

const scoring = vi.hoisted(() => ({
  duringScoring: async (): Promise<void> => undefined,
  fail: false
}));

vi.mock('../scoring', async (importOriginal) => {
  const original = await importOriginal<typeof import('../scoring')>();
  return {
    ...original,
    computeUserQualityScore: async (
      ...args: Parameters<typeof original.computeUserQualityScore>
    ) => {
      await original.computeUserQualityScore(...args);
      await scoring.duringScoring();
      if (scoring.fail) throw new Error('bad data');
    }
  };
});

const REQUESTED_AT = new Date(Date.now() - 60_000);

const requestScoring = (userId: string) =>
  db.userScoringRequest.upsert({
    where: { userId },
    create: { userId },
    update: { updatedAt: new Date() }
  });

const setup = async () => {
  const user = await createUser({ source: 'SIGNUP' });
  await db.userQuality.deleteMany({ where: { userId: user.id } });
  await db.userScoringRequest.create({
    data: {
      userId: user.id,
      createdAt: REQUESTED_AT,
      updatedAt: REQUESTED_AT
    }
  });
  return user;
};

const findRequest = (userId: string) =>
  db.userScoringRequest.findUnique({ where: { userId } });

describe('runUserScoring', () => {
  beforeEach(() => {
    scoring.duringScoring = async () => undefined;
    scoring.fail = false;
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('scores the user and deletes the request', async () => {
    const user = await setup();

    await expect(runUserScoring(prisma, { userId: user.id })).resolves.toEqual({
      processed: 1,
      errors: 0,
      total: 1
    });

    expect(await findRequest(user.id)).toBeNull();
    expect(await db.userQuality.count({ where: { userId: user.id } })).toBe(1);
  });

  it('keeps a request that was updated while the user was scored, and scores it on the next run', async () => {
    const user = await setup();
    scoring.duringScoring = async () => {
      await requestScoring(user.id);
    };

    await expect(runUserScoring(prisma, { userId: user.id })).resolves.toEqual({
      processed: 1,
      errors: 0,
      total: 1
    });

    const request = await findRequest(user.id);
    expect(request).not.toBeNull();
    expect(request!.updatedAt.getTime()).toBeGreaterThan(
      REQUESTED_AT.getTime()
    );

    scoring.duringScoring = async () => undefined;
    await expect(runUserScoring(prisma, { userId: user.id })).resolves.toEqual({
      processed: 1,
      errors: 0,
      total: 1
    });

    expect(await findRequest(user.id)).toBeNull();
    expect(await db.userQuality.count({ where: { userId: user.id } })).toBe(2);
  });

  it('keeps a request that was updated while scoring the user failed', async () => {
    const user = await setup();
    scoring.duringScoring = async () => {
      await requestScoring(user.id);
    };
    scoring.fail = true;

    await expect(runUserScoring(prisma, { userId: user.id })).resolves.toEqual({
      processed: 0,
      errors: 1,
      total: 1
    });

    expect(await findRequest(user.id)).not.toBeNull();
    expect(await db.userQuality.count({ where: { userId: user.id } })).toBe(0);
  });

  it('deletes a request whose scoring failed when it did not change', async () => {
    const user = await setup();
    scoring.fail = true;

    await expect(runUserScoring(prisma, { userId: user.id })).resolves.toEqual({
      processed: 0,
      errors: 1,
      total: 1
    });

    expect(await findRequest(user.id)).toBeNull();
  });
});
