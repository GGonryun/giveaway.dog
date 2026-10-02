import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { SweepstakesFormFieldType } from '@prisma/client';
import {
  checkBonusCompleteProfile,
  checkBonusLimited,
  checkBonusLoyalty,
  checkBonusTimed
} from '../bonus';
import {
  BonusCompleteProfileTaskSchema,
  BonusLimitedTaskSchema,
  BonusLoyaltyTaskSchema,
  BonusTimedTaskSchema
} from '../../schemas';
import { USER_SCHEMA_SELECT_QUERY } from '@/schemas/user';
import { prismaMock } from '@/test/prisma';
import {
  BASE_TASK,
  FIXED_DATE,
  IDS,
  applicationError,
  db
} from './fixtures-task-validation';

const input = <T>(task: T) => ({
  task,
  userId: IDS.userId,
  participantId: IDS.participantId,
  teamId: IDS.teamId
});

describe('checkBonusTimed', () => {
  const START = '2024-03-01T00:00:00.000Z';
  const END = '2024-03-31T00:00:00.000Z';

  const timedTask = (
    window: Pick<BonusTimedTaskSchema, 'startDate' | 'endDate'>
  ): BonusTimedTaskSchema => ({
    ...BASE_TASK,
    id: 'task-timed',
    type: 'BONUS_TIMED',
    ...window
  });

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2024-03-15T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves when neither date is set', async () => {
    await expect(
      checkBonusTimed(timedTask({ startDate: null, endDate: undefined }))
    ).resolves.toBeUndefined();
  });

  it('resolves inside the time window', async () => {
    await expect(
      checkBonusTimed(timedTask({ startDate: START, endDate: END }))
    ).resolves.toBeUndefined();
  });

  it('rejects with BAD_REQUEST before the start date', async () => {
    vi.setSystemTime(new Date('2024-02-29T23:59:59.999Z'));

    const error = await applicationError(
      checkBonusTimed(timedTask({ startDate: START, endDate: END }))
    );

    expect(error).toMatchObject({
      code: 'BAD_REQUEST',
      message: 'This bonus timed task is not active yet.'
    });
  });

  it('resolves exactly at the start date', async () => {
    vi.setSystemTime(new Date(START));

    await expect(
      checkBonusTimed(timedTask({ startDate: START }))
    ).resolves.toBeUndefined();
  });

  it('rejects with BAD_REQUEST after the end date', async () => {
    vi.setSystemTime(new Date('2024-03-31T00:00:00.001Z'));

    const error = await applicationError(
      checkBonusTimed(timedTask({ startDate: START, endDate: END }))
    );

    expect(error).toMatchObject({
      code: 'BAD_REQUEST',
      message: 'This bonus timed task has expired.'
    });
  });

  it('resolves exactly at the end date', async () => {
    vi.setSystemTime(new Date(END));

    await expect(
      checkBonusTimed(timedTask({ endDate: END }))
    ).resolves.toBeUndefined();
  });

  it('only enforces the end date when no start date is set', async () => {
    vi.setSystemTime(new Date('2020-01-01T00:00:00.000Z'));

    await expect(
      checkBonusTimed(timedTask({ endDate: END }))
    ).resolves.toBeUndefined();
  });

  it('only enforces the start date when no end date is set', async () => {
    vi.setSystemTime(new Date('2030-01-01T00:00:00.000Z'));

    await expect(
      checkBonusTimed(timedTask({ startDate: START }))
    ).resolves.toBeUndefined();
  });

  it('rejects before the start date when only a start date is set', async () => {
    vi.setSystemTime(new Date('2024-02-29T23:59:59.999Z'));

    const error = await applicationError(
      checkBonusTimed(timedTask({ startDate: START }))
    );

    expect(error).toMatchObject({
      code: 'BAD_REQUEST',
      message: 'This bonus timed task is not active yet.'
    });
  });

  it('rejects after the end date when only an end date is set', async () => {
    vi.setSystemTime(new Date('2024-03-31T00:00:00.001Z'));

    const error = await applicationError(
      checkBonusTimed(timedTask({ endDate: END }))
    );

    expect(error).toMatchObject({
      code: 'BAD_REQUEST',
      message: 'This bonus timed task has expired.'
    });
  });
});

describe('checkBonusLimited', () => {
  const limitedTask: BonusLimitedTaskSchema = {
    ...BASE_TASK,
    id: 'task-limited',
    type: 'BONUS_LIMITED',
    maxEntrants: 3
  };

  it('counts the completions of the task', async () => {
    prismaMock.taskCompletion.count.mockResolvedValue(0);

    await checkBonusLimited(db, { task: limitedTask });

    expect(prismaMock.taskCompletion.count).toHaveBeenCalledWith({
      where: { taskId: 'task-limited' }
    });
  });

  it('resolves while the number of entrants is below the limit', async () => {
    prismaMock.taskCompletion.count.mockResolvedValue(2);

    await expect(
      checkBonusLimited(db, { task: limitedTask })
    ).resolves.toBeUndefined();
  });

  it.each([3, 4])(
    'rejects with BAD_REQUEST when %i entrants already completed it',
    async (count) => {
      prismaMock.taskCompletion.count.mockResolvedValue(count);

      const error = await applicationError(
        checkBonusLimited(db, { task: limitedTask })
      );

      expect(error).toMatchObject({
        code: 'BAD_REQUEST',
        message:
          'This bonus limited task has reached its maximum number of entrants.'
      });
    }
  );
});

describe('checkBonusLoyalty', () => {
  const loyaltyTask: BonusLoyaltyTaskSchema = {
    ...BASE_TASK,
    id: 'task-loyalty',
    type: 'BONUS_LOYALTY',
    loyaltyRequired: 3
  };

  it('counts the giveaways of the team the user participated in', async () => {
    prismaMock.sweepstakesParticipant.count.mockResolvedValue(3);

    await checkBonusLoyalty(db, input(loyaltyTask));

    expect(prismaMock.sweepstakesParticipant.count).toHaveBeenCalledWith({
      where: {
        userId: IDS.userId,
        sweepstakes: { teamId: IDS.teamId },
        taskCompletions: {
          some: { status: { in: ['COMPLETED', 'PENDING'] } }
        }
      }
    });
  });

  it.each([3, 10])('resolves when the user has %i loyalty', async (loyalty) => {
    prismaMock.sweepstakesParticipant.count.mockResolvedValue(loyalty);

    await expect(
      checkBonusLoyalty(db, input(loyaltyTask))
    ).resolves.toBeUndefined();
  });

  it('rejects with FORBIDDEN and the loyalty details when below the requirement', async () => {
    prismaMock.sweepstakesParticipant.count.mockResolvedValue(2);

    const error = await applicationError(
      checkBonusLoyalty(db, input(loyaltyTask))
    );

    expect(error).toMatchObject({
      code: 'FORBIDDEN',
      message: 'You need at least 3 loyalty to complete this tier.',
      data: { userLoyalty: 2, requiredLoyalty: 3 }
    });
  });
});

describe('checkBonusCompleteProfile', () => {
  const profileTask: BonusCompleteProfileTaskSchema = {
    ...BASE_TASK,
    id: 'task-profile',
    type: 'BONUS_COMPLETE_PROFILE'
  };

  const formField = (
    id: string,
    type: SweepstakesFormFieldType | null,
    required: boolean
  ) => ({
    id,
    audienceId: 'audience-1',
    label: `${type} field`,
    type,
    required,
    placeholder: null,
    minimum: null,
    maximum: null,
    index: 0,
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE
  });

  const sweepstakesWith = (
    formFields: ReturnType<typeof formField>[] | null,
    tasks = [{ sweepstakesId: IDS.sweepstakesId }]
  ) => ({
    tasks,
    audience: formFields === null ? null : { formFields }
  });

  const user = (overrides: {
    name?: string | null;
    email?: string | null;
  }) => ({
    id: IDS.userId,
    email: null,
    name: null,
    image: null,
    source: 'SIGNUP',
    createdAt: FIXED_DATE,
    birthday: null,
    agents: [],
    ips: [],
    quality: [],
    emailVerified: null,
    accounts: [],
    onboarded: true,
    accountType: 'PARTICIPANT',
    username: null,
    preferredContactMethod: null,
    ...overrides
  });

  const participantWith = (values: Record<string, string>) => ({
    id: IDS.participantId,
    userId: IDS.userId,
    sweepstakesId: IDS.sweepstakesId,
    formValues: Object.entries(values).map(([fieldId, value]) => ({
      id: `value-${fieldId}`,
      fieldId,
      value
    }))
  });

  const INCOMPLETE = {
    code: 'VALIDATION_ERROR',
    message: 'Please complete your profile before claiming this bonus.'
  };

  describe('loading the requirements', () => {
    it('fetches the form fields of the giveaway owning the task', async () => {
      prismaMock.sweepstakes.findFirst.mockResolvedValue(sweepstakesWith([]));
      prismaMock.user.findUnique.mockResolvedValue(user({}));
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(null);

      await checkBonusCompleteProfile(db, input(profileTask));

      expect(prismaMock.sweepstakes.findFirst).toHaveBeenCalledWith({
        where: { tasks: { some: { id: 'task-profile' } } },
        select: {
          tasks: {
            where: { id: 'task-profile' },
            select: { sweepstakesId: true }
          },
          audience: { select: { formFields: true } }
        }
      });
    });

    it('fetches the user profile and the participant form values', async () => {
      prismaMock.sweepstakes.findFirst.mockResolvedValue(sweepstakesWith([]));
      prismaMock.user.findUnique.mockResolvedValue(user({}));
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(null);

      await checkBonusCompleteProfile(db, input(profileTask));

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: IDS.userId },
        select: USER_SCHEMA_SELECT_QUERY
      });
      expect(prismaMock.sweepstakesParticipant.findUnique).toHaveBeenCalledWith(
        {
          where: {
            userId_sweepstakesId: {
              userId: IDS.userId,
              sweepstakesId: IDS.sweepstakesId
            }
          },
          include: { formValues: true }
        }
      );
    });

    it.each([
      ['the giveaway is not found', null],
      ['the giveaway has no audience', sweepstakesWith(null)],
      ['the task is not returned', sweepstakesWith([], [])]
    ])(
      'rejects with INTERNAL_SERVER_ERROR when %s',
      async (_label, sweepstakes) => {
        prismaMock.sweepstakes.findFirst.mockResolvedValue(sweepstakes);

        const error = await applicationError(
          checkBonusCompleteProfile(db, input(profileTask))
        );

        expect(error).toMatchObject({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Unable to verify profile completion requirements'
        });
        expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
      }
    );

    it('rejects with NOT_FOUND when the user does not exist', async () => {
      prismaMock.sweepstakes.findFirst.mockResolvedValue(sweepstakesWith([]));
      prismaMock.user.findUnique.mockResolvedValue(null);

      const error = await applicationError(
        checkBonusCompleteProfile(db, input(profileTask))
      );

      expect(error).toMatchObject({
        code: 'NOT_FOUND',
        message: 'User not found'
      });
      expect(
        prismaMock.sweepstakesParticipant.findUnique
      ).not.toHaveBeenCalled();
    });

    it('rejects with VALIDATION_ERROR when a stored form field is invalid', async () => {
      prismaMock.sweepstakes.findFirst.mockResolvedValue(
        sweepstakesWith([formField('field-broken', null, true)])
      );
      prismaMock.user.findUnique.mockResolvedValue(user({}));
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(
        participantWith({ 'field-broken': 'x' })
      );

      const error = await applicationError(
        checkBonusCompleteProfile(db, input(profileTask))
      );

      expect(error).toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'Invalid form field data for field ID field-broken'
      });
    });
  });

  describe('evaluating the profile', () => {
    it('resolves when the giveaway has no form fields', async () => {
      prismaMock.sweepstakes.findFirst.mockResolvedValue(sweepstakesWith([]));
      prismaMock.user.findUnique.mockResolvedValue(user({}));
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(null);

      await expect(
        checkBonusCompleteProfile(db, input(profileTask))
      ).resolves.toBeUndefined();
    });

    it('rejects when form fields exist but the user is not a participant yet', async () => {
      prismaMock.sweepstakes.findFirst.mockResolvedValue(
        sweepstakesWith([formField('field-name', 'USERNAME', false)])
      );
      prismaMock.user.findUnique.mockResolvedValue(user({ name: 'Alice' }));
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(null);

      const error = await applicationError(
        checkBonusCompleteProfile(db, input(profileTask))
      );

      expect(error).toMatchObject(INCOMPLETE);
    });

    it('rejects when the participant has no form values', async () => {
      prismaMock.sweepstakes.findFirst.mockResolvedValue(
        sweepstakesWith([formField('field-name', 'USERNAME', false)])
      );
      prismaMock.user.findUnique.mockResolvedValue(user({ name: 'Alice' }));
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(
        participantWith({})
      );

      const error = await applicationError(
        checkBonusCompleteProfile(db, input(profileTask))
      );

      expect(error).toMatchObject(INCOMPLETE);
    });

    it('resolves when required fields are filled from the user and the form values', async () => {
      prismaMock.sweepstakes.findFirst.mockResolvedValue(
        sweepstakesWith([
          formField('field-name', 'USERNAME', true),
          formField('field-age', 'AGE', true),
          formField('field-email', 'EMAIL', false)
        ])
      );
      prismaMock.user.findUnique.mockResolvedValue(
        user({ name: 'Alice', email: 'alice@example.com' })
      );
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(
        participantWith({ 'field-age': 'true' })
      );

      await expect(
        checkBonusCompleteProfile(db, input(profileTask))
      ).resolves.toBeUndefined();
    });

    it('rejects when a required field has no value', async () => {
      prismaMock.sweepstakes.findFirst.mockResolvedValue(
        sweepstakesWith([
          formField('field-name', 'USERNAME', true),
          formField('field-age', 'AGE', true)
        ])
      );
      prismaMock.user.findUnique.mockResolvedValue(user({}));
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(
        participantWith({ 'field-name': 'alice' })
      );

      const error = await applicationError(
        checkBonusCompleteProfile(db, input(profileTask))
      );

      expect(error).toMatchObject(INCOMPLETE);
    });

    it('always requires the email field even when it is not marked required', async () => {
      prismaMock.sweepstakes.findFirst.mockResolvedValue(
        sweepstakesWith([formField('field-email', 'EMAIL', false)])
      );
      prismaMock.user.findUnique.mockResolvedValue(user({ email: null }));
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(
        participantWith({ 'field-other': 'x' })
      );

      const error = await applicationError(
        checkBonusCompleteProfile(db, input(profileTask))
      );

      expect(error).toMatchObject(INCOMPLETE);
    });

    it('ignores optional fields that are empty', async () => {
      prismaMock.sweepstakes.findFirst.mockResolvedValue(
        sweepstakesWith([
          formField('field-name', 'USERNAME', true),
          formField('field-twitter', 'TWITTER', false)
        ])
      );
      prismaMock.user.findUnique.mockResolvedValue(user({}));
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(
        participantWith({ 'field-name': 'alice' })
      );

      await expect(
        checkBonusCompleteProfile(db, input(profileTask))
      ).resolves.toBeUndefined();
    });
  });
});
