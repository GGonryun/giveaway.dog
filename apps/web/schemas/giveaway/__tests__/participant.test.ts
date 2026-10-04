import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import {
  isFormFilled,
  isProfileComplete,
  participantFormSchema,
  toParticipantForm,
  toParticipantFormFields,
  toSweepstakesHost,
  toSweepstakesPrizes,
  userStatusSchema,
  winnerSchema
} from '../participant';
import type { ParticipantSweepstakesGetPayload } from '@giveaway/sweepstakes-model/db';
import type { UserSchema } from '@giveaway/user-model/user';
import type { SweepstakesFormFieldSchema } from '@giveaway/custom-fields-model/schemas';
import { ApplicationError } from '@giveaway/util-errors';
import { DEFAULT_TEAM_LOGO } from '@giveaway/team-model/team/data';

type Prize = ParticipantSweepstakesGetPayload['prizes'][number];
type Draw = Prize['draws'][number];
type StoredUser = Draw['taskCompletion']['participant']['user'];
type StoredFormField = Prisma.SweepstakesFormFieldGetPayload<object>;

const CREATED_AT = new Date('2026-01-01T00:00:00.000Z');
const UPDATED_AT = new Date('2026-01-02T00:00:00.000Z');

const storedUser = (overrides: Partial<StoredUser> = {}): StoredUser => ({
  id: 'user-1',
  email: 'jane@example.com',
  name: 'Jane',
  image: 'https://example.com/jane.png',
  source: 'SIGNUP',
  createdAt: CREATED_AT,
  birthday: null,
  agents: [],
  ips: [],
  quality: [],
  emailVerified: null,
  accounts: [],
  onboarded: true,
  accountType: 'PARTICIPANT',
  username: 'jane',
  preferredContactMethod: null,
  ...overrides
});

const draw = (
  config: Prisma.JsonValue,
  overrides: Partial<Draw> = {}
): Draw => ({
  id: 'draw-1',
  prizeId: 'prize-1',
  taskCompletionId: 'completion-1',
  result: 'WINNER',
  disqualificationReason: null,
  previousDrawId: null,
  createdAt: CREATED_AT,
  updatedAt: UPDATED_AT,
  taskCompletion: {
    id: 'completion-1',
    participantId: 'participant-1',
    taskId: 'task-1',
    completedAt: CREATED_AT,
    proof: null,
    reason: null,
    status: 'COMPLETED',
    task: { id: 'task-1', sweepstakesId: 'sweep-1', index: 0, config },
    participant: {
      id: 'participant-1',
      userId: 'user-1',
      sweepstakesId: 'sweep-1',
      createdAt: CREATED_AT,
      updatedAt: CREATED_AT,
      user: storedUser()
    }
  },
  ...overrides
});

const prize = (draws: Draw[], overrides: Partial<Prize> = {}): Prize => ({
  id: 'prize-1',
  sweepstakesId: 'sweep-1',
  name: 'Prize',
  index: 0,
  quota: 2,
  draws,
  ...overrides
});

const BONUS_CONFIG = {
  type: 'BONUS_TASK',
  title: 'Bonus',
  value: 2,
  mandatory: false,
  tasksRequired: 0
};

const user = (overrides: Partial<UserSchema> = {}): UserSchema => ({
  id: 'user-1',
  name: 'Jane',
  email: 'jane@example.com',
  emailVerified: true,
  image: null,
  countryCode: 'US',
  userAgent: 'agent',
  birthday: null,
  qualityScore: 80,
  providers: [],
  source: 'SIGNUP',
  preferredContactMethod: null,
  createdAt: CREATED_AT,
  isAnonymous: false,
  ...overrides
});

const usernameField = (
  overrides: Partial<
    Extract<SweepstakesFormFieldSchema, { type: 'USERNAME' }>
  > = {}
): SweepstakesFormFieldSchema => ({
  id: 'username',
  label: 'Username',
  type: 'USERNAME',
  required: true,
  ...overrides
});

const emailField = (): SweepstakesFormFieldSchema => ({
  id: 'email',
  label: 'Email',
  type: 'EMAIL'
});

const ageField = (
  overrides: Partial<Extract<SweepstakesFormFieldSchema, { type: 'AGE' }>> = {}
): SweepstakesFormFieldSchema => ({
  id: 'age',
  label: 'I am 18',
  type: 'AGE',
  minimum: 18,
  required: true,
  ...overrides
});

const twitterField = (
  overrides: Partial<
    Extract<SweepstakesFormFieldSchema, { type: 'TWITTER' }>
  > = {}
): SweepstakesFormFieldSchema => ({
  id: 'twitter',
  label: 'Twitter',
  type: 'TWITTER',
  placeholder: null,
  required: false,
  ...overrides
});

describe('winnerSchema', () => {
  it('accepts a null prize name', () => {
    expect(winnerSchema.parse({ prizeId: 'p1', prizeName: null })).toEqual({
      prizeId: 'p1',
      prizeName: null
    });
  });

  it('requires the prize name key', () => {
    expect(winnerSchema.safeParse({ prizeId: 'p1' }).success).toBe(false);
  });
});

describe('userStatusSchema', () => {
  it.each(['active', 'blocked'])('accepts %s', (status) => {
    expect(userStatusSchema.parse(status)).toBe(status);
  });

  it('rejects any other status', () => {
    expect(userStatusSchema.safeParse('banned').success).toBe(false);
  });
});

describe('toSweepstakesPrizes', () => {
  it('returns an empty list when there are no prizes', () => {
    expect(toSweepstakesPrizes([])).toEqual([]);
  });

  it('maps a prize without draws', () => {
    expect(toSweepstakesPrizes([prize([])])).toEqual([
      { prizeId: 'prize-1', prizeName: 'Prize', quota: 2, draws: [] }
    ]);
  });

  it('maps a null prize name to null', () => {
    expect(toSweepstakesPrizes([prize([], { name: null })])[0].prizeName).toBe(
      null
    );
  });

  it('maps each draw with the parsed task and the winning user', () => {
    const [mapped] = toSweepstakesPrizes([
      prize([draw(BONUS_CONFIG, { disqualificationReason: 'Fake account' })])
    ]);

    expect(mapped.draws).toEqual([
      {
        id: 'draw-1',
        result: 'WINNER',
        disqualificationReason: 'Fake account',
        createdAt: CREATED_AT,
        updatedAt: UPDATED_AT,
        user: {
          id: 'user-1',
          email: 'jane@example.com',
          name: 'Jane',
          image: 'https://example.com/jane.png',
          source: 'SIGNUP',
          birthday: null,
          createdAt: CREATED_AT,
          countryCode: 'XX',
          userAgent: 'unknown',
          qualityScore: 0,
          emailVerified: false,
          providers: [],
          onboarded: true,
          accountType: 'PARTICIPANT',
          username: 'jane',
          preferredContactMethod: null,
          isAnonymous: true
        },
        task: { id: 'task-1', ...BONUS_CONFIG }
      }
    ]);
  });

  it('applies the task schema defaults to the draw task', () => {
    const [mapped] = toSweepstakesPrizes([
      prize([
        draw({
          type: 'SECRET_CODE_V2',
          title: 'Code',
          value: 1,
          mandatory: false,
          tasksRequired: 0,
          codes: ['abc']
        })
      ])
    ]);

    expect(mapped.draws?.[0]?.task).toMatchObject({ caseSensitive: false });
  });

  it('throws a validation error when a draw task config is invalid', () => {
    const prizes = [prize([draw({ type: 'BONUS_TASK', title: '' })])];

    let error: unknown;
    try {
      toSweepstakesPrizes(prizes);
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(ApplicationError);
    expect(error).toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Invalid task data for task ID task-1'
    });
    expect((error as ApplicationError).cause).toBeInstanceOf(z.ZodError);
  });
});

describe('toSweepstakesHost', () => {
  const team = (
    overrides: Partial<Prisma.TeamGetPayload<object>> = {}
  ): Prisma.TeamGetPayload<object> => ({
    id: 'team-1',
    name: 'Acme',
    slug: 'acme',
    logo: 'https://example.com/logo.png',
    links: [{ platform: 'x', url: 'https://x.com/acme' }],
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    tier: 'FREE',
    ...overrides
  });

  it('maps the team identity, logo, and parsed social links', () => {
    expect(toSweepstakesHost(team())).toEqual({
      id: 'team-1',
      slug: 'acme',
      name: 'Acme',
      logo: 'https://example.com/logo.png',
      links: [{ platform: 'x', url: 'https://x.com/acme' }]
    });
  });

  it('uses the default team logo when the logo is empty', () => {
    expect(toSweepstakesHost(team({ logo: '' })).logo).toBe(DEFAULT_TEAM_LOGO);
  });

  it('returns no links when the stored links are invalid', () => {
    expect(
      toSweepstakesHost(team({ links: [{ platform: 'myspace', url: 'x' }] }))
        .links
    ).toEqual([]);
  });

  it('returns no links when no links are stored', () => {
    expect(toSweepstakesHost(team({ links: null })).links).toEqual([]);
  });

  it('accepts a detailed user team', () => {
    expect(
      toSweepstakesHost({
        id: 'team-2',
        name: 'Beta',
        slug: 'beta',
        logo: 'https://example.com/beta.png',
        memberCount: 3,
        tier: 'PRO',
        role: 'OWNER'
      })
    ).toEqual({
      id: 'team-2',
      slug: 'beta',
      name: 'Beta',
      logo: 'https://example.com/beta.png',
      links: []
    });
  });
});

describe('participantFormSchema', () => {
  it('accepts fields with nullable values of any type', () => {
    const form = [
      { id: 'a', label: 'A', value: null, isCustom: true },
      { id: 'b', label: 'B', value: { nested: 1 }, isCustom: false }
    ];

    expect(participantFormSchema.parse(form)).toEqual(form);
  });

  it('requires the isCustom flag', () => {
    expect(
      participantFormSchema.safeParse([{ id: 'a', label: 'A', value: 1 }])
        .success
    ).toBe(false);
  });
});

describe('toParticipantFormFields', () => {
  const stored = (
    overrides: Partial<StoredFormField> = {}
  ): StoredFormField => ({
    id: 'field-1',
    audienceId: 'audience-1',
    label: 'Username',
    type: 'USERNAME',
    required: true,
    placeholder: '@you',
    minimum: null,
    maximum: null,
    index: 0,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    ...overrides
  });

  it('returns an empty list for no fields', () => {
    expect(toParticipantFormFields([])).toEqual([]);
  });

  it('strips storage-only columns from a username field', () => {
    expect(toParticipantFormFields([stored()])).toEqual([
      {
        id: 'field-1',
        label: 'Username',
        type: 'USERNAME',
        required: true,
        placeholder: '@you'
      }
    ]);
  });

  it('keeps the age limits of an age field', () => {
    expect(
      toParticipantFormFields([
        stored({ type: 'AGE', minimum: 18, maximum: null, placeholder: null })
      ])
    ).toEqual([
      {
        id: 'field-1',
        label: 'Username',
        type: 'AGE',
        minimum: 18,
        maximum: null,
        required: true
      }
    ]);
  });

  it('drops the required flag from an email field', () => {
    expect(
      toParticipantFormFields([stored({ type: 'EMAIL', label: 'Email' })])
    ).toEqual([
      { id: 'field-1', label: 'Email', type: 'EMAIL', placeholder: '@you' }
    ]);
  });

  it('throws a validation error for a field with a null required flag', () => {
    expect(() => toParticipantFormFields([stored({ required: null })])).toThrow(
      expect.objectContaining({
        code: 'VALIDATION_ERROR',
        message: 'Invalid form field data for field ID field-1'
      })
    );
  });

  it('throws a validation error for a field without a type', () => {
    expect(() =>
      toParticipantFormFields([stored({ id: 'field-9', type: null })])
    ).toThrow(
      expect.objectContaining({
        code: 'VALIDATION_ERROR',
        message: 'Invalid form field data for field ID field-9'
      })
    );
  });

  it('throws a validation error with the zod cause for a field with an empty label', () => {
    let error: unknown;
    try {
      toParticipantFormFields([stored({ label: '' })]);
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(ApplicationError);
    expect(error).toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Invalid form field data for field ID field-1'
    });
    expect((error as ApplicationError).cause).toBeInstanceOf(z.ZodError);
  });

  it('validates every field and reports the first invalid one', () => {
    expect(() =>
      toParticipantFormFields([
        stored(),
        stored({ id: 'field-2', label: '' }),
        stored({ id: 'field-3', label: '' })
      ])
    ).toThrow('Invalid form field data for field ID field-2');
  });
});

describe('toParticipantForm', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 1, 12, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns an empty form for no fields', () => {
    expect(toParticipantForm([], user(), {})).toEqual([]);
  });

  describe('age fields', () => {
    it('marks the age as confirmed from a birthday older than the minimum age', () => {
      expect(
        toParticipantForm(
          [ageField()],
          user({ birthday: new Date(2008, 9, 1, 11, 59) })
        )
      ).toEqual([
        { id: 'age', label: 'I am 18', value: true, isCustom: false }
      ]);
    });

    it('uses the submitted value when the birthday is exactly the minimum age', () => {
      expect(
        toParticipantForm(
          [ageField()],
          user({ birthday: new Date(2008, 9, 1, 12, 0) }),
          { age: true }
        )
      ).toEqual([{ id: 'age', label: 'I am 18', value: true, isCustom: true }]);
    });

    it('uses the submitted value when the user has no birthday', () => {
      expect(
        toParticipantForm([ageField()], user(), { age: 'yes' })[0]
      ).toMatchObject({ value: 'yes', isCustom: true });
    });

    it('ignores the birthday when the field has no minimum', () => {
      expect(
        toParticipantForm(
          [ageField({ minimum: 0 })],
          user({ birthday: new Date(1990, 0, 1) })
        )[0]
      ).toMatchObject({ value: null, isCustom: true });
    });

    it('turns a false submitted value into null', () => {
      expect(
        toParticipantForm([ageField()], undefined, { age: false })[0]
      ).toMatchObject({ value: null, isCustom: true });
    });
  });

  describe('username fields', () => {
    it('uses the user name', () => {
      expect(
        toParticipantForm([usernameField()], user(), { username: 'other' })[0]
      ).toMatchObject({ value: 'Jane', isCustom: false });
    });

    it('uses the submitted value when the user has no name', () => {
      expect(
        toParticipantForm([usernameField()], user({ name: null }), {
          username: 'other'
        })[0]
      ).toMatchObject({ value: 'other', isCustom: true });
    });

    it('turns an empty submitted value into null', () => {
      expect(
        toParticipantForm([usernameField()], undefined, { username: '' })[0]
      ).toMatchObject({ value: null, isCustom: true });
    });
  });

  describe('email fields', () => {
    it('uses the user email', () => {
      expect(toParticipantForm([emailField()], user())[0]).toEqual({
        id: 'email',
        label: 'Email',
        value: 'jane@example.com',
        isCustom: false
      });
    });

    it('uses the submitted value when the user has no email', () => {
      expect(
        toParticipantForm([emailField()], user({ email: null }), {
          email: 'typed@example.com'
        })[0]
      ).toMatchObject({ value: 'typed@example.com', isCustom: true });
    });
  });

  describe('twitter fields', () => {
    const twitterProvider = (link: string | null) => ({
      type: 'TWITTER' as const,
      scopes: [],
      label: '@jane',
      link,
      status: 'ACTIVE' as const
    });

    it('uses the linked twitter profile', () => {
      expect(
        toParticipantForm(
          [twitterField()],
          user({ providers: [twitterProvider('https://x.com/jane')] })
        )[0]
      ).toMatchObject({ value: 'https://x.com/jane', isCustom: false });
    });

    it('uses the submitted value when the twitter provider has no link', () => {
      expect(
        toParticipantForm(
          [twitterField()],
          user({ providers: [twitterProvider(null)] }),
          { twitter: 'https://x.com/typed' }
        )[0]
      ).toMatchObject({ value: 'https://x.com/typed', isCustom: true });
    });

    it('uses the twitter link when another provider is linked first', () => {
      expect(
        toParticipantForm(
          [twitterField()],
          user({
            providers: [
              {
                ...twitterProvider('https://bsky.app/profile/jane'),
                type: 'BLUESKY'
              },
              twitterProvider('https://x.com/jane')
            ]
          })
        )[0]
      ).toMatchObject({ value: 'https://x.com/jane', isCustom: false });
    });

    it('ignores links from other providers', () => {
      expect(
        toParticipantForm(
          [twitterField()],
          user({
            providers: [
              { ...twitterProvider('https://discord.com/x'), type: 'DISCORD' }
            ]
          })
        )[0]
      ).toMatchObject({ value: null, isCustom: true });
    });
  });

  it('throws for an unknown field type', () => {
    expect(() =>
      toParticipantForm(
        [
          {
            id: 'phone',
            label: 'Phone',
            type: 'PHONE'
          } as unknown as SweepstakesFormFieldSchema
        ],
        user()
      )
    ).toThrow('Unexpected value: [object Object]');
  });
});

describe('isProfileComplete', () => {
  it('returns true when there are no form fields', () => {
    expect(isProfileComplete([])).toBe(true);
  });

  it('returns false when there is no user', () => {
    expect(isProfileComplete([emailField()], undefined, { email: 'x' })).toBe(
      false
    );
  });

  it('returns false when there are no submitted values', () => {
    expect(isProfileComplete([emailField()], user())).toBe(false);
  });

  it('returns false when the submitted values are empty', () => {
    expect(isProfileComplete([emailField()], user(), {})).toBe(false);
  });

  it('returns true when every required field has a value', () => {
    expect(
      isProfileComplete([emailField(), usernameField()], user(), { other: 1 })
    ).toBe(true);
  });

  it('returns false when a required field after a filled one is missing', () => {
    expect(
      isProfileComplete([emailField(), usernameField()], user({ name: null }), {
        other: 1
      })
    ).toBe(false);
  });

  it('always requires the email field', () => {
    expect(
      isProfileComplete([emailField()], user({ email: null }), { other: 1 })
    ).toBe(false);
  });

  it('returns false when a required username is missing', () => {
    expect(
      isProfileComplete([usernameField()], user({ name: null }), { other: 1 })
    ).toBe(false);
  });

  it('ignores an optional username that is missing', () => {
    expect(
      isProfileComplete(
        [usernameField({ required: false })],
        user({ name: null }),
        { other: 1 }
      )
    ).toBe(true);
  });

  it('returns false when a required age confirmation is missing', () => {
    expect(isProfileComplete([ageField()], user(), { other: 1 })).toBe(false);
  });

  it('returns false when a required twitter profile is missing', () => {
    expect(
      isProfileComplete([twitterField({ required: true })], user(), {
        other: 1
      })
    ).toBe(false);
  });

  it('returns true when a required twitter profile was submitted', () => {
    expect(
      isProfileComplete([twitterField({ required: true })], user(), {
        twitter: 'https://x.com/jane'
      })
    ).toBe(true);
  });
});

describe('isFormFilled', () => {
  it('returns true when there are no form fields', () => {
    expect(isFormFilled([])).toBe(true);
  });

  it('returns false when there is no user', () => {
    expect(isFormFilled([emailField()], undefined, { email: 'x' })).toBe(false);
  });

  it('returns false when there are no submitted values', () => {
    expect(isFormFilled([emailField()], user())).toBe(false);
  });

  it('returns false when the submitted values are empty', () => {
    expect(isFormFilled([emailField()], user(), {})).toBe(false);
  });

  it('requires optional fields to have a value too', () => {
    expect(
      isFormFilled(
        [emailField(), usernameField({ required: false })],
        user({ name: null }),
        { other: 1 }
      )
    ).toBe(false);
  });

  it('returns true when every field has a value', () => {
    expect(
      isFormFilled([emailField(), usernameField({ required: false })], user(), {
        other: 1
      })
    ).toBe(true);
  });
});
