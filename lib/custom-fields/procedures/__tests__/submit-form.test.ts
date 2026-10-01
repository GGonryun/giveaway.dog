import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  Prisma,
  SweepstakesFormFieldType,
  type Account,
  type SweepstakesFormField,
  type Task,
  type User
} from '@prisma/client';
import { saveUserChanges, submitParticipantForm } from '../submit-form';
import { asPrismaClient, knownRequestError, prismaMock } from '@/test/prisma';
import { signIn, TEST_USER } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';

const SWEEPSTAKES_ID = 'sw-1';
const PARTICIPANT_ID = 'participant-1';

const dbUser = (overrides: Partial<User> = {}): User => ({
  id: TEST_USER.id,
  name: 'Test User',
  email: 'test@example.com',
  emailVerified: null,
  username: 'testuser',
  birthday: null,
  image: null,
  emoji: null,
  onboarded: true,
  accountType: 'PARTICIPANT',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  source: 'SIGNUP',
  preferredContactMethod: null,
  ...overrides
});

const formField = (
  overrides: Partial<SweepstakesFormField> & { id: string }
): SweepstakesFormField => ({
  audienceId: 'audience-1',
  label: 'Field',
  type: null,
  required: false,
  placeholder: null,
  minimum: null,
  maximum: null,
  index: null,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  ...overrides
});

const task = (id: string, config: Prisma.JsonValue): Task => ({
  id,
  sweepstakesId: SWEEPSTAKES_ID,
  index: 0,
  config
});

const profileTaskConfig = {
  type: 'BONUS_COMPLETE_PROFILE',
  title: 'Complete your profile',
  value: 1,
  mandatory: false,
  tasksRequired: 0
};

const bonusTaskConfig = {
  type: 'BONUS_TASK',
  title: 'Click for a bonus entry',
  value: 1,
  mandatory: false,
  tasksRequired: 0
};

const twitterAccount = (userId: string | null): Account => ({
  userId,
  type: 'oauth',
  provider: 'twitter',
  providerAccountId: 'tw-1',
  refresh_token: null,
  access_token: null,
  expires_at: null,
  token_type: null,
  scope: null,
  id_token: null,
  session_state: null,
  label: 'someone',
  link: 'https://x.com/someone',
  status: 'ACTIVE',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z')
});

const emailField = formField({ id: 'email', type: 'EMAIL', label: 'Email' });
const twitterField = formField({
  id: 'twitter',
  type: 'TWITTER',
  label: 'X profile'
});
const usernameField = formField({
  id: 'username',
  type: 'USERNAME',
  label: 'Username'
});
const ageField = formField({
  id: 'age',
  type: 'AGE',
  label: 'Age',
  minimum: 18
});

type ArrangeOptions = {
  fields?: SweepstakesFormField[];
  tasks?: Task[];
  participantUser?: User;
};

const arrange = ({
  fields = [emailField, twitterField, usernameField, ageField],
  tasks = [],
  participantUser = dbUser()
}: ArrangeOptions = {}) => {
  signIn();
  prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue({
    id: PARTICIPANT_ID,
    userId: participantUser.id,
    sweepstakesId: SWEEPSTAKES_ID,
    user: participantUser
  });
  prismaMock.sweepstakes.findUnique.mockResolvedValue({
    id: SWEEPSTAKES_ID,
    audience: { id: 'audience-1', formFields: fields }
  });
  prismaMock.account.findMany.mockResolvedValue([]);
  prismaMock.user.findFirst.mockResolvedValue(null);
  prismaMock.account.findFirst.mockResolvedValue(null);
  prismaMock.sweepstakesFormValue.findFirst.mockResolvedValue(null);
  prismaMock.sweepstakesFormValue.findMany.mockResolvedValue([]);
  prismaMock.task.findMany.mockResolvedValue(tasks);
  prismaMock.taskCompletion.findFirst.mockResolvedValue(null);
};

const submit = (data: Record<string, string | boolean>) =>
  submitParticipantForm({ sweepstakesId: SWEEPSTAKES_ID, data });

describe('submitParticipantForm', () => {
  describe('authorization and input', () => {
    it('rejects unauthenticated callers before touching the database', async () => {
      const result = await submit({ email: 'a@b.com' });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(
        prismaMock.sweepstakesParticipant.findUnique
      ).not.toHaveBeenCalled();
    });

    it('rejects input without a data record', async () => {
      signIn();

      const result = await submitParticipantForm({
        sweepstakesId: SWEEPSTAKES_ID
      } as unknown as Parameters<typeof submitParticipantForm>[0]);

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: /
      );
    });

    it('rejects numeric form values', async () => {
      signIn();

      const result = await submitParticipantForm({
        sweepstakesId: SWEEPSTAKES_ID,
        data: { age: 21 }
      } as unknown as Parameters<typeof submitParticipantForm>[0]);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(
        prismaMock.sweepstakesParticipant.findUnique
      ).not.toHaveBeenCalled();
    });
  });

  describe('record lookup', () => {
    it('looks up the participant by the session user and sweepstakes', async () => {
      arrange();

      await submit({});

      expect(prismaMock.sweepstakesParticipant.findUnique).toHaveBeenCalledWith(
        {
          where: {
            userId_sweepstakesId: {
              userId: TEST_USER.id,
              sweepstakesId: SWEEPSTAKES_ID
            }
          },
          include: { user: true }
        }
      );
    });

    it('returns NOT_FOUND when the caller has no participant record', async () => {
      arrange();
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(null);

      const result = await submit({ email: 'a@b.com' });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Participant record not found'
      );
      expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
    });

    it('loads the sweepstakes with its audience form fields', async () => {
      arrange();

      await submit({});

      expect(prismaMock.sweepstakes.findUnique).toHaveBeenCalledWith({
        where: { id: SWEEPSTAKES_ID },
        include: { audience: { include: { formFields: true } } }
      });
    });

    it('returns NOT_FOUND when the sweepstakes does not exist', async () => {
      arrange();
      prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

      const result = await submit({ email: 'a@b.com' });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Sweepstakes not found'
      );
      expect(prismaMock.account.findMany).not.toHaveBeenCalled();
    });

    it('returns NOT_FOUND when the sweepstakes has no audience', async () => {
      arrange();
      prismaMock.sweepstakes.findUnique.mockResolvedValue({
        id: SWEEPSTAKES_ID,
        audience: null
      });

      const result = await submit({ email: 'a@b.com' });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Sweepstakes not found'
      );
    });

    it("fetches the caller's connected accounts", async () => {
      arrange();

      await submit({});

      expect(prismaMock.account.findMany).toHaveBeenCalledWith({
        where: { userId: TEST_USER.id }
      });
    });
  });

  describe('field validation', () => {
    it('rejects a field id that is not part of the form', async () => {
      arrange();

      const result = await submit({ unknown: 'value' });

      expect(expectFailure(result, 'BAD_REQUEST').message).toBe(
        'Invalid field ID: unknown'
      );
      expect(prismaMock.sweepstakesFormValue.upsert).not.toHaveBeenCalled();
    });

    it('fails with a generic message when a field has no type', async () => {
      arrange({ fields: [formField({ id: 'typeless', type: null })] });

      const failure = expectFailure(
        await submit({ typeless: 'value' }),
        'INTERNAL_SERVER_ERROR'
      );

      expect(failure.message).toBe(
        'Something went wrong! Please try again later or contact support if the issue persists.'
      );
      expect(failure.cause).toBe(
        'Field type is missing for field ID: typeless'
      );
    });

    it('fails with INTERNAL_SERVER_ERROR for an unrecognized field type', async () => {
      arrange({
        fields: [
          formField({
            id: 'phone',
            type: 'PHONE' as unknown as SweepstakesFormFieldType
          })
        ]
      });

      const result = await submit({ phone: '555' });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Unexpected value: PHONE'
      );
    });

    it('performs no lookups for USERNAME and AGE values', async () => {
      arrange();

      expectOk(await submit({ username: 'neo', age: 'true' }));

      expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.account.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.sweepstakesFormValue.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.sweepstakesFormValue.findMany).not.toHaveBeenCalled();
    });

    it('validates every field before writing any value', async () => {
      arrange();

      const result = await submit({ username: 'neo', unknown: 'x' });

      expectFailure(result, 'BAD_REQUEST');
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });
  });

  describe('EMAIL fields', () => {
    it('looks up existing users by email case-insensitively', async () => {
      arrange();

      await submit({ email: 'Neo@Matrix.io' });

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: { email: { equals: 'Neo@Matrix.io', mode: 'insensitive' } }
      });
    });

    it('rejects an email that belongs to another user', async () => {
      arrange();
      prismaMock.user.findFirst.mockResolvedValue(dbUser({ id: 'user-2' }));

      const result = await submit({ email: 'other@example.com' });

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'This email address belongs to another user. You can only use your own email address.'
      );
      expect(prismaMock.sweepstakesFormValue.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.sweepstakesFormValue.upsert).not.toHaveBeenCalled();
    });

    it("accepts the caller's own registered email", async () => {
      arrange();
      prismaMock.user.findFirst.mockResolvedValue(dbUser());

      expect(expectOk(await submit({ email: 'test@example.com' }))).toEqual({
        success: true
      });
    });

    it('checks uniqueness against other participants in the same sweepstakes', async () => {
      arrange();

      await submit({ email: 'neo@matrix.io' });

      expect(prismaMock.sweepstakesFormValue.findFirst).toHaveBeenCalledWith({
        where: {
          fieldId: 'email',
          value: 'neo@matrix.io',
          participant: { sweepstakesId: SWEEPSTAKES_ID },
          participantId: { not: PARTICIPANT_ID }
        }
      });
    });

    it('rejects an email already used by another participant', async () => {
      arrange();
      prismaMock.sweepstakesFormValue.findFirst.mockResolvedValue({
        id: 'value-9',
        value: 'neo@matrix.io'
      });

      const result = await submit({ email: 'neo@matrix.io' });

      expect(expectFailure(result, 'CONFLICT').message).toBe(
        'This email address has already been used in this sweepstakes'
      );
      expect(prismaMock.sweepstakesFormValue.upsert).not.toHaveBeenCalled();
    });

    it('stringifies boolean values before validating them', async () => {
      arrange();

      await submit({ email: false });

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: { email: { equals: 'false', mode: 'insensitive' } }
      });
    });
  });

  describe('TWITTER fields', () => {
    it('skips validation for an empty value', async () => {
      arrange();

      expectOk(await submit({ twitter: '' }));

      expect(prismaMock.account.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.sweepstakesFormValue.findMany).not.toHaveBeenCalled();
    });

    it('skips validation for a whitespace-only value', async () => {
      arrange();

      expectOk(await submit({ twitter: '   ' }));

      expect(prismaMock.account.findFirst).not.toHaveBeenCalled();
    });

    it('rejects a value that is not an x.com profile URL', async () => {
      arrange();

      const result = await submit({ twitter: 'https://twitter.com/neo' });

      expect(expectFailure(result, 'BAD_REQUEST').message).toBe(
        'Invalid Twitter profile URL format. Please use https://x.com/username'
      );
      expect(prismaMock.account.findFirst).not.toHaveBeenCalled();
    });

    it('rejects a profile URL surrounded by whitespace', async () => {
      arrange();

      const result = await submit({ twitter: ' https://x.com/neo ' });

      expectFailure(result, 'BAD_REQUEST');
    });

    it('rejects a boolean value as an invalid profile URL', async () => {
      arrange();

      const result = await submit({ twitter: true });

      expectFailure(result, 'BAD_REQUEST');
    });

    it('looks up connected twitter accounts by username or link', async () => {
      arrange();

      await submit({ twitter: 'https://www.x.com/Neo_1' });

      expect(prismaMock.account.findFirst).toHaveBeenCalledWith({
        where: {
          provider: 'twitter',
          OR: [
            { label: { equals: 'Neo_1', mode: 'insensitive' } },
            {
              link: {
                equals: 'https://www.x.com/Neo_1',
                mode: 'insensitive'
              }
            }
          ]
        },
        include: { user: true }
      });
    });

    it('rejects a profile connected to another user', async () => {
      arrange();
      prismaMock.account.findFirst.mockResolvedValue(twitterAccount('user-2'));

      const result = await submit({ twitter: 'https://x.com/neo' });

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'This Twitter profile (@neo) belongs to another user. You can only use your own connected accounts.'
      );
      expect(prismaMock.sweepstakesFormValue.findMany).not.toHaveBeenCalled();
    });

    it('rejects a profile on an orphaned account with no owner', async () => {
      arrange();
      prismaMock.account.findFirst.mockResolvedValue(twitterAccount(null));

      const result = await submit({ twitter: 'https://x.com/neo' });

      expectFailure(result, 'FORBIDDEN');
    });

    it("accepts a profile connected to the caller's own account", async () => {
      arrange();
      prismaMock.account.findFirst.mockResolvedValue(
        twitterAccount(TEST_USER.id)
      );

      expect(expectOk(await submit({ twitter: 'https://x.com/neo' }))).toEqual({
        success: true
      });
    });

    it('loads values from other participants of the sweepstakes', async () => {
      arrange();

      await submit({ twitter: 'https://x.com/neo' });

      expect(prismaMock.sweepstakesFormValue.findMany).toHaveBeenCalledWith({
        where: {
          fieldId: 'twitter',
          participant: { sweepstakesId: SWEEPSTAKES_ID },
          participantId: { not: PARTICIPANT_ID }
        }
      });
    });

    it('rejects a profile already used, ignoring case and surrounding whitespace', async () => {
      arrange();
      prismaMock.sweepstakesFormValue.findMany.mockResolvedValue([
        { value: 'https://x.com/someone' },
        { value: '  HTTPS://X.COM/NEO  ' }
      ]);

      const result = await submit({ twitter: 'https://x.com/neo' });

      expect(expectFailure(result, 'CONFLICT').message).toBe(
        'This Twitter profile has already been used in this sweepstakes'
      );
      expect(prismaMock.sweepstakesFormValue.upsert).not.toHaveBeenCalled();
    });

    it('accepts a profile when only different profiles were used', async () => {
      arrange();
      prismaMock.sweepstakesFormValue.findMany.mockResolvedValue([
        { value: 'https://x.com/neo2' },
        { value: 'https://www.x.com/neo' }
      ]);

      expectOk(await submit({ twitter: 'https://x.com/neo' }));
    });
  });

  describe('saving values', () => {
    it('runs the writes inside a transaction', async () => {
      arrange();

      await submit({ username: 'neo' });

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      expect(prismaMock.$transaction).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    it('upserts each submitted value keyed by participant and field', async () => {
      arrange();

      await submit({ username: 'neo', email: 'neo@matrix.io' });

      expect(prismaMock.sweepstakesFormValue.upsert).toHaveBeenCalledTimes(2);
      expect(prismaMock.sweepstakesFormValue.upsert).toHaveBeenNthCalledWith(
        1,
        {
          where: {
            participantId_fieldId: {
              participantId: PARTICIPANT_ID,
              fieldId: 'username'
            }
          },
          create: {
            participantId: PARTICIPANT_ID,
            fieldId: 'username',
            value: 'neo'
          },
          update: { value: 'neo' }
        }
      );
      expect(prismaMock.sweepstakesFormValue.upsert).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          create: {
            participantId: PARTICIPANT_ID,
            fieldId: 'email',
            value: 'neo@matrix.io'
          }
        })
      );
    });

    it('stores boolean values as strings', async () => {
      arrange();

      await submit({ age: true });

      expect(prismaMock.sweepstakesFormValue.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ value: 'true' }),
          update: { value: 'true' }
        })
      );
    });

    it('succeeds with an empty submission without writing values or updating the user', async () => {
      arrange();

      expect(expectOk(await submit({}))).toEqual({ success: true });
      expect(prismaMock.sweepstakesFormValue.upsert).not.toHaveBeenCalled();
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it('maps a prisma P2025 error during the upsert to NOT_FOUND', async () => {
      arrange();
      prismaMock.sweepstakesFormValue.upsert.mockRejectedValue(
        knownRequestError('P2025')
      );

      const result = await submit({ username: 'neo' });

      expectFailure(result, 'NOT_FOUND');
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it('returns INTERNAL_SERVER_ERROR with the message of an unexpected error', async () => {
      arrange();
      prismaMock.task.findMany.mockRejectedValue(new Error('connection lost'));

      const result = await submit({ username: 'neo' });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'connection lost'
      );
    });
  });

  describe('profile completion task', () => {
    it("loads the sweepstakes' tasks", async () => {
      arrange();

      await submit({ username: 'neo' });

      expect(prismaMock.task.findMany).toHaveBeenCalledWith({
        where: { sweepstakesId: SWEEPSTAKES_ID }
      });
    });

    it('does nothing when there is no profile completion task', async () => {
      arrange({ tasks: [task('t-bonus', bonusTaskConfig)] });

      await submit({ username: 'neo' });

      expect(prismaMock.taskCompletion.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.taskCompletion.create).not.toHaveBeenCalled();
    });

    it('ignores tasks whose stored config cannot be parsed', async () => {
      arrange({
        tasks: [task('t-broken', { type: 'VISIT_URL' }), task('t-empty', null)]
      });

      expectOk(await submit({ username: 'neo' }));

      expect(prismaMock.taskCompletion.findFirst).not.toHaveBeenCalled();
    });

    it('completes the profile task when it has not been completed yet', async () => {
      arrange({
        tasks: [
          task('t-bonus', bonusTaskConfig),
          task('t-profile', profileTaskConfig)
        ]
      });

      await submit({ username: 'neo' });

      expect(prismaMock.taskCompletion.findFirst).toHaveBeenCalledWith({
        where: { participantId: PARTICIPANT_ID, taskId: 't-profile' }
      });
      expect(prismaMock.taskCompletion.create).toHaveBeenCalledWith({
        data: {
          participantId: PARTICIPANT_ID,
          taskId: 't-profile',
          status: 'COMPLETED',
          proof: Prisma.JsonNull
        }
      });
    });

    it('completes the profile task even when no values were submitted', async () => {
      arrange({ tasks: [task('t-profile', profileTaskConfig)] });

      await submit({});

      expect(prismaMock.taskCompletion.create).toHaveBeenCalledTimes(1);
    });

    it('uses only the first profile completion task', async () => {
      arrange({
        tasks: [
          task('t-profile-1', profileTaskConfig),
          task('t-profile-2', profileTaskConfig)
        ]
      });

      await submit({ username: 'neo' });

      expect(prismaMock.taskCompletion.create).toHaveBeenCalledTimes(1);
      expect(prismaMock.taskCompletion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ taskId: 't-profile-1' })
      });
    });

    it('does not create a second completion when one already exists', async () => {
      arrange({ tasks: [task('t-profile', profileTaskConfig)] });
      prismaMock.taskCompletion.findFirst.mockResolvedValue({
        id: 'completion-1'
      });

      expectOk(await submit({ username: 'neo' }));

      expect(prismaMock.taskCompletion.create).not.toHaveBeenCalled();
    });
  });

  describe('user profile updates', () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date(2026, 5, 15, 12));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("copies a USERNAME value onto the participant user's name and username", async () => {
      arrange({ participantUser: dbUser({ id: 'db-user-7' }) });

      await submit({ username: 'neo' });

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'db-user-7' },
        data: { name: 'neo', username: 'neo' }
      });
    });

    it('derives a birthday from the AGE field minimum', async () => {
      arrange();

      await submit({ age: 'true' });

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: TEST_USER.id },
        data: { birthday: new Date(2008, 0, 1) }
      });
    });

    it('does not update the user when only EMAIL and TWITTER values are sent', async () => {
      arrange();

      await submit({ email: 'neo@matrix.io', twitter: 'https://x.com/neo' });

      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it('updates the user after the form values are saved', async () => {
      arrange();

      await submit({ username: 'neo' });

      const upsertOrder =
        prismaMock.sweepstakesFormValue.upsert.mock.invocationCallOrder[0];
      const updateOrder = prismaMock.user.update.mock.invocationCallOrder[0];
      expect(upsertOrder).toBeLessThan(updateOrder);
    });
  });
});

describe('saveUserChanges', () => {
  const db = asPrismaClient();

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 5, 15, 12));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('skips values for fields that are not in the field list', async () => {
    await saveUserChanges({
      db,
      user: dbUser(),
      data: { missing: 'neo' },
      fields: [usernameField]
    });

    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it('skips values for fields without a type', async () => {
    await saveUserChanges({
      db,
      user: dbUser(),
      data: { typeless: 'neo' },
      fields: [formField({ id: 'typeless', type: null })]
    });

    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it('ignores EMAIL and TWITTER fields', async () => {
    await saveUserChanges({
      db,
      user: dbUser(),
      data: { email: 'neo@matrix.io', twitter: 'https://x.com/neo' },
      fields: [emailField, twitterField]
    });

    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it('sets name and username from a USERNAME field', async () => {
    await saveUserChanges({
      db,
      user: dbUser({ id: 'u-9' }),
      data: { username: 'trinity' },
      fields: [usernameField]
    });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'u-9' },
      data: { name: 'trinity', username: 'trinity' }
    });
  });

  it('passes a boolean USERNAME value through unchanged', async () => {
    await saveUserChanges({
      db,
      user: dbUser(),
      data: { username: true },
      fields: [usernameField]
    });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: TEST_USER.id },
      data: { name: true, username: true }
    });
  });

  it('keeps the last USERNAME value when several username fields are sent', async () => {
    await saveUserChanges({
      db,
      user: dbUser(),
      data: { first: 'neo', second: 'trinity' },
      fields: [
        formField({ id: 'first', type: 'USERNAME' }),
        formField({ id: 'second', type: 'USERNAME' })
      ]
    });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: TEST_USER.id },
      data: { name: 'trinity', username: 'trinity' }
    });
  });

  it('assumes January 1st of the minimum-age birth year when the user has no birthday', async () => {
    await saveUserChanges({
      db,
      user: dbUser({ birthday: null }),
      data: { age: 'true' },
      fields: [ageField]
    });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: TEST_USER.id },
      data: { birthday: new Date(2008, 0, 1) }
    });
  });

  it('keeps an existing birthday that is earlier than the assumed one', async () => {
    const birthday = new Date(1990, 4, 20);

    await saveUserChanges({
      db,
      user: dbUser({ birthday }),
      data: { age: 'true' },
      fields: [ageField]
    });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: TEST_USER.id },
      data: { birthday }
    });
  });

  it('replaces an existing birthday that is later than the assumed one', async () => {
    await saveUserChanges({
      db,
      user: dbUser({ birthday: new Date(2015, 2, 3) }),
      data: { age: 'true' },
      fields: [ageField]
    });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: TEST_USER.id },
      data: { birthday: new Date(2008, 0, 1) }
    });
  });

  it('uses the assumed birthday when it equals the existing one', async () => {
    await saveUserChanges({
      db,
      user: dbUser({ birthday: new Date(2008, 0, 1) }),
      data: { age: 'true' },
      fields: [ageField]
    });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: TEST_USER.id },
      data: { birthday: new Date(2008, 0, 1) }
    });
  });

  it('writes a null birthday when the AGE field has no minimum', async () => {
    await saveUserChanges({
      db,
      user: dbUser({ birthday: new Date(1990, 4, 20) }),
      data: { age: 'true' },
      fields: [formField({ id: 'age', type: 'AGE', minimum: null })]
    });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: TEST_USER.id },
      data: { birthday: null }
    });
  });

  it('treats a zero minimum as no minimum', async () => {
    await saveUserChanges({
      db,
      user: dbUser(),
      data: { age: 'true' },
      fields: [formField({ id: 'age', type: 'AGE', minimum: 0 })]
    });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: TEST_USER.id },
      data: { birthday: null }
    });
  });

  it('derives the birthday even when the AGE value is false', async () => {
    await saveUserChanges({
      db,
      user: dbUser(),
      data: { age: false },
      fields: [ageField]
    });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: TEST_USER.id },
      data: { birthday: new Date(2008, 0, 1) }
    });
  });

  it('combines USERNAME and AGE updates into one write', async () => {
    await saveUserChanges({
      db,
      user: dbUser(),
      data: { username: 'neo', age: 'true' },
      fields: [usernameField, ageField]
    });

    expect(prismaMock.user.update).toHaveBeenCalledTimes(1);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: TEST_USER.id },
      data: {
        name: 'neo',
        username: 'neo',
        birthday: new Date(2008, 0, 1)
      }
    });
  });

  it('does not write when there are no values', async () => {
    await saveUserChanges({
      db,
      user: dbUser(),
      data: {},
      fields: [usernameField, ageField]
    });

    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });
});
