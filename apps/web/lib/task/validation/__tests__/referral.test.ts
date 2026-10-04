import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Prisma } from '@prisma/client';
import { validateReferral } from '../referral';
import { prismaMock } from '@giveaway/testing-server/prisma';
import {
  BASE_TASK,
  FIXED_DATE,
  IDS,
  applicationError,
  db,
  storedTask,
  taskCompletion
} from '@giveaway/testing-server/fixtures-task-validation';

const runtime = vi.hoisted(() => ({
  cookies: vi.fn(),
  getCookie: vi.fn(),
  setCookie: vi.fn(),
  deleteCookie: vi.fn()
}));

vi.mock('next/headers', () => ({ cookies: runtime.cookies }));

vi.mock('cookies-next', () => ({
  getCookie: runtime.getCookie,
  setCookie: runtime.setCookie,
  deleteCookie: runtime.deleteCookie
}));

const cookieStore = (referralCode: string | undefined) => ({
  get: vi.fn((name: string) =>
    name === 'referral_code' && referralCode !== undefined
      ? { name, value: referralCode }
      : undefined
  )
});

const participant = {
  id: IDS.participantId,
  userId: IDS.userId,
  sweepstakesId: IDS.sweepstakesId,
  createdAt: FIXED_DATE,
  updatedAt: FIXED_DATE
};

const referralConfig = (extra: Prisma.JsonObject = {}) => ({
  ...BASE_TASK,
  type: 'REFERRAL_LINK',
  ...extra
});

const buildReferral = ({
  config = referralConfig({ maximum: 2 }),
  sweepstakesId = IDS.sweepstakesId,
  referrerUserId = 'user-referrer',
  referredUsers = 0
}: {
  config?: Prisma.JsonObject;
  sweepstakesId?: string;
  referrerUserId?: string;
  referredUsers?: number;
} = {}) => ({
  id: 'referral-1',
  code: 'REF123',
  participantId: 'participant-referrer',
  taskId: 'task-referral',
  createdAt: FIXED_DATE,
  updatedAt: FIXED_DATE,
  task: storedTask('task-referral', config, sweepstakesId),
  participant: {
    ...participant,
    id: 'participant-referrer',
    userId: referrerUserId
  },
  referredUsers: Array.from({ length: referredUsers }, (_, index) => ({
    id: `referred-${index}`,
    referralId: 'referral-1',
    userId: `user-referred-${index}`,
    createdAt: FIXED_DATE
  }))
});

const validate = (completions = [] as ReturnType<typeof taskCompletion>[]) =>
  validateReferral(db, {
    taskId: 'task-submitted',
    participant,
    completions
  });

describe('validateReferral', () => {
  beforeEach(() => {
    for (const fn of Object.values(runtime)) {
      fn.mockReset();
    }
    runtime.cookies.mockResolvedValue(cookieStore('REF123'));
    prismaMock.referral.findUnique.mockResolvedValue(buildReferral());
    prismaMock.referredUser.findUnique.mockResolvedValue(null);
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('when there is no referral code cookie', () => {
    it.each([
      ['no cookie', undefined],
      ['an empty cookie', '']
    ])('does nothing for %s', async (_label, code) => {
      const store = cookieStore(code);
      runtime.cookies.mockResolvedValue(store);

      await expect(validate()).resolves.toBeUndefined();

      expect(store.get).toHaveBeenCalledWith('referral_code');
      expect(prismaMock.referral.findUnique).not.toHaveBeenCalled();
      expect(runtime.deleteCookie).not.toHaveBeenCalled();
    });
  });

  describe('when the referral cannot be applied', () => {
    it('clears the cookie without a lookup when the user already completed a task', async () => {
      await validate([taskCompletion('task-other')]);

      expect(prismaMock.referral.findUnique).not.toHaveBeenCalled();
      expect(runtime.deleteCookie).toHaveBeenCalledWith('referral_code');
    });

    it('looks up the referral by its code', async () => {
      prismaMock.referral.findUnique.mockResolvedValue(null);

      await validate();

      expect(prismaMock.referral.findUnique).toHaveBeenCalledWith({
        where: { code: 'REF123' },
        include: { task: true, participant: true, referredUsers: true }
      });
    });

    it('clears the cookie when the referral code does not exist', async () => {
      prismaMock.referral.findUnique.mockResolvedValue(null);

      await validate();

      expect(runtime.deleteCookie).toHaveBeenCalledWith('referral_code');
      expect(prismaMock.referredUser.findUnique).not.toHaveBeenCalled();
    });

    it('clears the cookie when the referral belongs to another giveaway', async () => {
      prismaMock.referral.findUnique.mockResolvedValue(
        buildReferral({ sweepstakesId: 'sweep-other' })
      );

      await validate();

      expect(runtime.deleteCookie).toHaveBeenCalledWith('referral_code');
      expect(prismaMock.referredUser.findUnique).not.toHaveBeenCalled();
    });

    it('clears the cookie when users try to refer themselves', async () => {
      prismaMock.referral.findUnique.mockResolvedValue(
        buildReferral({ referrerUserId: IDS.userId })
      );

      await validate();

      expect(runtime.deleteCookie).toHaveBeenCalledWith('referral_code');
      expect(prismaMock.referredUser.findUnique).not.toHaveBeenCalled();
    });

    it('checks whether the user was already referred by this code', async () => {
      await validate();

      expect(prismaMock.referredUser.findUnique).toHaveBeenCalledWith({
        where: {
          referralId_userId: { referralId: 'referral-1', userId: IDS.userId }
        }
      });
    });

    it('clears the cookie without writing when the user was already referred', async () => {
      prismaMock.referredUser.findUnique.mockResolvedValue({
        id: 'referred-0',
        referralId: 'referral-1',
        userId: IDS.userId,
        createdAt: FIXED_DATE
      });

      await validate();

      expect(runtime.deleteCookie).toHaveBeenCalledWith('referral_code');
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
      expect(prismaMock.referredUser.create).not.toHaveBeenCalled();
    });
  });

  describe('when the referral is applied', () => {
    it('records the referred user in a transaction', async () => {
      await validate();

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      expect(prismaMock.referredUser.create).toHaveBeenCalledWith({
        data: { referralId: 'referral-1', userId: IDS.userId }
      });
    });

    it('credits the referrer with a completed referral task', async () => {
      await validate();

      expect(prismaMock.taskCompletion.create).toHaveBeenCalledWith({
        data: {
          participantId: 'participant-referrer',
          taskId: 'task-referral',
          status: 'COMPLETED',
          proof: {
            referralId: 'referral-1',
            referredUserId: IDS.userId,
            sourceTaskId: 'task-submitted'
          }
        }
      });
    });

    it('clears the cookie afterwards', async () => {
      await validate();

      expect(runtime.deleteCookie).toHaveBeenCalledWith('referral_code');
    });

    it('credits the referrer while below the maximum', async () => {
      prismaMock.referral.findUnique.mockResolvedValue(
        buildReferral({ referredUsers: 1 })
      );

      await validate();

      expect(prismaMock.taskCompletion.create).toHaveBeenCalledTimes(1);
    });

    it('records the referred user but does not credit the referrer at the maximum', async () => {
      prismaMock.referral.findUnique.mockResolvedValue(
        buildReferral({ referredUsers: 2 })
      );

      await validate();

      expect(prismaMock.referredUser.create).toHaveBeenCalledTimes(1);
      expect(prismaMock.taskCompletion.create).not.toHaveBeenCalled();
      expect(runtime.deleteCookie).toHaveBeenCalledWith('referral_code');
    });

    it.each([
      ['a null maximum', referralConfig({ maximum: null })],
      ['no maximum', referralConfig()],
      [
        'a referral task that is not a referral link',
        { ...BASE_TASK, type: 'BONUS_TASK' }
      ]
    ])('treats %s as unlimited', async (_label, config) => {
      prismaMock.referral.findUnique.mockResolvedValue(
        buildReferral({ config, referredUsers: 50 })
      );

      await validate();

      expect(prismaMock.taskCompletion.create).toHaveBeenCalledTimes(1);
    });
  });

  it('rejects with the task schema parse error when the referral task config is invalid', async () => {
    prismaMock.referral.findUnique.mockResolvedValue(
      buildReferral({ config: { type: 'REFERRAL_LINK' } })
    );

    const error = await applicationError(validate());

    expect(error).toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to parse task config'
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(runtime.deleteCookie).not.toHaveBeenCalled();
  });

  it('does not clear the cookie when the transaction fails', async () => {
    prismaMock.referredUser.create.mockRejectedValue(new Error('db down'));

    await expect(validate()).rejects.toThrow('db down');
    expect(runtime.deleteCookie).not.toHaveBeenCalled();
  });

  describe('logging', () => {
    it('logs the submitted task when there is no referral code', async () => {
      runtime.cookies.mockResolvedValue(cookieStore(undefined));

      await validate();

      expect(console.info).toHaveBeenCalledWith(
        '[Referral] No referral code found in cookies',
        {
          userId: IDS.userId,
          sweepstakesId: IDS.sweepstakesId,
          taskId: 'task-submitted'
        }
      );
    });

    it('logs the completion count when the user already completed a task', async () => {
      await validate([taskCompletion('task-a'), taskCompletion('task-b')]);

      expect(console.info).toHaveBeenCalledWith(
        '[Referral] User already has completions, skipping referral',
        {
          userId: IDS.userId,
          sweepstakesId: IDS.sweepstakesId,
          referralCode: 'REF123',
          completionsCount: 2
        }
      );
    });

    it('logs an unknown referral code', async () => {
      prismaMock.referral.findUnique.mockResolvedValue(null);

      await validate();

      expect(console.info).toHaveBeenCalledWith(
        '[Referral] Referral code not found in database',
        {
          userId: IDS.userId,
          sweepstakesId: IDS.sweepstakesId,
          referralCode: 'REF123'
        }
      );
    });

    it('logs both giveaways when the referral belongs to another giveaway', async () => {
      prismaMock.referral.findUnique.mockResolvedValue(
        buildReferral({ sweepstakesId: 'sweep-other' })
      );

      await validate();

      expect(console.info).toHaveBeenCalledWith(
        '[Referral] Referral code is for a different sweepstakes',
        {
          userId: IDS.userId,
          participantSweepstakesId: IDS.sweepstakesId,
          referralSweepstakesId: 'sweep-other',
          referralCode: 'REF123'
        }
      );
    });

    it('logs a self-referral attempt', async () => {
      prismaMock.referral.findUnique.mockResolvedValue(
        buildReferral({ referrerUserId: IDS.userId })
      );

      await validate();

      expect(console.info).toHaveBeenCalledWith(
        '[Referral] User attempted to use their own referral code',
        {
          userId: IDS.userId,
          sweepstakesId: IDS.sweepstakesId,
          referralCode: 'REF123'
        }
      );
    });

    it('logs a repeated referral with the referral id', async () => {
      prismaMock.referredUser.findUnique.mockResolvedValue({
        id: 'referred-0',
        referralId: 'referral-1',
        userId: IDS.userId,
        createdAt: FIXED_DATE
      });

      await validate();

      expect(console.info).toHaveBeenCalledWith(
        '[Referral] User already referred by this code',
        {
          userId: IDS.userId,
          sweepstakesId: IDS.sweepstakesId,
          referralCode: 'REF123',
          referralId: 'referral-1'
        }
      );
    });

    it('logs the referral being processed with the current count and maximum', async () => {
      prismaMock.referral.findUnique.mockResolvedValue(
        buildReferral({ referredUsers: 1 })
      );

      await validate();

      expect(console.info).toHaveBeenCalledWith(
        '[Referral] Processing referral',
        {
          userId: IDS.userId,
          sweepstakesId: IDS.sweepstakesId,
          referralCode: 'REF123',
          referralId: 'referral-1',
          referrerUserId: 'user-referrer',
          currentReferrals: 1,
          maximum: 2
        }
      );
    });

    it('logs the new referral count after crediting the referrer', async () => {
      prismaMock.referral.findUnique.mockResolvedValue(
        buildReferral({ referredUsers: 1 })
      );

      await validate();

      expect(console.info).toHaveBeenCalledWith(
        '[Referral] Referral completed successfully',
        {
          userId: IDS.userId,
          referrerUserId: 'user-referrer',
          sweepstakesId: IDS.sweepstakesId,
          referralCode: 'REF123',
          newReferralCount: 2,
          maximum: 2
        }
      );
    });

    it('logs that no completion was created at the maximum', async () => {
      prismaMock.referral.findUnique.mockResolvedValue(
        buildReferral({ referredUsers: 2 })
      );

      await validate();

      expect(console.info).toHaveBeenCalledWith(
        '[Referral] Maximum referrals reached, user added but no completion created',
        {
          userId: IDS.userId,
          referrerUserId: 'user-referrer',
          sweepstakesId: IDS.sweepstakesId,
          referralCode: 'REF123',
          currentReferrals: 2,
          maximum: 2
        }
      );
    });

    it('logs an unlimited maximum as Infinity', async () => {
      prismaMock.referral.findUnique.mockResolvedValue(
        buildReferral({ config: referralConfig() })
      );

      await validate();

      expect(console.info).toHaveBeenCalledWith(
        '[Referral] Processing referral',
        expect.objectContaining({ currentReferrals: 0, maximum: Infinity })
      );
    });
  });
});
